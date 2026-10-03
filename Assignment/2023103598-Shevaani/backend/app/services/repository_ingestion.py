"""Secure, static-only acquisition of public Python repositories.

This module treats every repository artifact as untrusted data. It downloads
GitHub's source archive over HTTPS and streams ZIP members into a temporary
workspace without invoking Git, Python, shells, package managers, or archive
extraction helpers that trust member paths.
"""
from __future__ import annotations

import logging
import re
import stat
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import BinaryIO

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)

_MIB = 1024 * 1024
_DOWNLOAD_CHUNK_SIZE = 64 * 1024
_MAX_ARCHIVE_ENTRIES_MULTIPLIER = 20
_MAX_WARNINGS = 50
_GITHUB_REDIRECT_HOSTS = frozenset({"github.com", "api.github.com", "codeload.github.com"})
_IGNORED_DIRECTORIES = frozenset(
    {
        ".git",
        ".hg",
        ".svn",
        ".venv",
        "venv",
        "env",
        "virtualenv",
        "node_modules",
        "__pycache__",
        ".pytest_cache",
        ".mypy_cache",
        ".ruff_cache",
        ".tox",
        ".nox",
        "build",
        "dist",
        "site-packages",
        "vendor",
        ".idea",
        ".vscode",
    }
)
_IGNORED_FILENAMES = frozenset({".ds_store", "thumbs.db", "desktop.ini"})
_IGNORED_SUFFIXES = frozenset(
    {
        ".pyc",
        ".pyo",
        ".so",
        ".dll",
        ".dylib",
        ".exe",
        ".bin",
        ".dat",
        ".db",
        ".sqlite",
        ".sqlite3",
        ".zip",
        ".tar",
        ".gz",
        ".7z",
        ".rar",
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".ico",
        ".mp3",
        ".mp4",
        ".mov",
        ".wav",
        ".woff",
        ".woff2",
        ".ttf",
        ".otf",
        ".class",
        ".jar",
        ".whl",
        ".lockb",
    }
)
_TEXT_SUFFIXES = frozenset(
    {
        ".py",
        ".pyi",
        ".md",
        ".rst",
        ".txt",
        ".toml",
        ".yaml",
        ".yml",
        ".json",
        ".ini",
        ".cfg",
        ".conf",
        ".xml",
        ".csv",
        ".tsv",
        ".html",
        ".css",
        ".js",
        ".sh",
        ".ps1",
        ".bat",
        ".cmd",
        ".sql",
        ".ipynb",
    }
)
_TEXT_FILENAMES = frozenset(
    {
        "readme",
        "license",
        "copying",
        "notice",
        "authors",
        "authors.txt",
        "contributors",
        "makefile",
        "dockerfile",
        ".gitignore",
        ".dockerignore",
        ".editorconfig",
        ".gitattributes",
        ".python-version",
    }
)
_WINDOWS_RESERVED_NAMES = frozenset(
    {"con", "prn", "aux", "nul", *(f"com{i}" for i in range(1, 10)), *(f"lpt{i}" for i in range(1, 10))}
)


class IngestionError(Exception):
    """An expected user-facing ingestion failure."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass(frozen=True)
class IngestionResult:
    """Public metadata for an ingested repository; no local paths are exposed."""

    ingestion_id: str
    repository_name: str
    source: str
    status: str
    files: int
    python_files: int
    warnings: list[str]
    archive_size_bytes: int = 0
    timings: dict[str, float] = field(default_factory=dict)


@dataclass
class _Workspace:
    temporary_directory: tempfile.TemporaryDirectory[str]
    repository_root: Path
    result: IngestionResult


class _SafeGitHubRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Permit only HTTPS redirects to GitHub's known archive hosts."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        try:
            parsed = urllib.parse.urlsplit(newurl)
            port = parsed.port
        except ValueError:
            raise IngestionError("GitHub returned an unsafe archive redirect.", 502) from None
        if (
            parsed.scheme != "https"
            or parsed.hostname not in _GITHUB_REDIRECT_HOSTS
            or parsed.username is not None
            or parsed.password is not None
            or port not in (None, 443)
        ):
            raise IngestionError("GitHub returned an unsafe archive redirect.", 502)
        redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
        if parsed.hostname != urllib.parse.urlsplit(req.full_url).hostname:
            redirected.remove_header("Authorization")
        return redirected


class RepositoryIngestionService:
    """Validate and retain bounded repository snapshots in temporary storage."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._workspaces: dict[str, _Workspace] = {}
        self._lock = threading.Lock()
        self._github_cache: dict[str, tuple[float, str]] = {}

    @property
    def workspace_paths(self) -> dict[str, Path]:
        """Internal paths for later pipeline stages; never serialize this property."""
        with self._lock:
            return {key: value.repository_root for key, value in self._workspaces.items()}

    def get_workspace(self, ingestion_id: str) -> tuple[Path, IngestionResult] | None:
        """Return a retained workspace and its public metadata for analysis."""
        with self._lock:
            workspace = self._workspaces.get(ingestion_id)
            if workspace is None:
                return None
            return workspace.repository_root, workspace.result

    def ingest_github(self, repository_url: str) -> IngestionResult:
        owner, repository = self._parse_github_url(repository_url)
        canonical_url = f"https://github.com/{owner}/{repository}"
        if self._settings.github_cache_ttl_seconds:
            cached = self._cached_workspace(canonical_url)
            if cached is not None:
                return cached
        temporary_directory = tempfile.TemporaryDirectory(prefix="aar-ingest-")
        workspace = Path(temporary_directory.name)
        archive_path = workspace / "source.zip"
        repository_root = workspace / "repository"
        try:
            download_started = time.perf_counter()
            archive_size = self._download_archive(owner, repository, archive_path)
            download_seconds = time.perf_counter() - download_started
            extraction_started = time.perf_counter()
            warnings = self._extract_archive(archive_path, repository_root)
            extraction_seconds = time.perf_counter() - extraction_started
            archive_path.unlink(missing_ok=True)
            result = self._register_workspace(
                temporary_directory,
                repository_root,
                repository,
                canonical_url,
                warnings,
                archive_size,
                timings={
                    "archive_download_seconds": download_seconds,
                    "archive_extraction_seconds": extraction_seconds,
                },
            )
            if self._settings.github_cache_ttl_seconds > 0:
                with self._lock:
                    self._github_cache[canonical_url.casefold()] = (
                        time.monotonic() + self._settings.github_cache_ttl_seconds,
                        result.ingestion_id,
                    )
            return result
        except Exception:
            temporary_directory.cleanup()
            raise

    def ingest_zip(self, upload: BinaryIO, filename: str | None) -> IngestionResult:
        if not filename or Path(filename.replace("\\", "/")).suffix.lower() != ".zip":
            raise IngestionError("Upload a repository archive with a .zip filename.", 422)

        safe_name = Path(filename.replace("\\", "/")).name
        repository_name = Path(safe_name).stem[:100] or "uploaded-repository"
        temporary_directory = tempfile.TemporaryDirectory(prefix="aar-ingest-")
        workspace = Path(temporary_directory.name)
        archive_path = workspace / "upload.zip"
        repository_root = workspace / "repository"
        try:
            staging_started = time.perf_counter()
            archive_size = self._copy_bounded(upload, archive_path)
            staging_seconds = time.perf_counter() - staging_started
            extraction_started = time.perf_counter()
            warnings = self._extract_archive(archive_path, repository_root)
            extraction_seconds = time.perf_counter() - extraction_started
            archive_path.unlink(missing_ok=True)
            return self._register_workspace(
                temporary_directory,
                repository_root,
                repository_name,
                "zip_upload",
                warnings,
                archive_size,
                timings={
                    "upload_staging_seconds": staging_seconds,
                    "archive_extraction_seconds": extraction_seconds,
                },
            )
        except Exception:
            temporary_directory.cleanup()
            raise

    def cleanup(self) -> None:
        """Remove all retained temporary workspaces, usually on app shutdown."""
        with self._lock:
            workspaces, self._workspaces = self._workspaces, {}
            self._github_cache.clear()
        for workspace in workspaces.values():
            workspace.temporary_directory.cleanup()

    def _register_workspace(
        self,
        temporary_directory: tempfile.TemporaryDirectory[str],
        repository_root: Path,
        repository_name: str,
        source: str,
        warnings: list[str],
        archive_size: int,
        timings: dict[str, float] | None = None,
    ) -> IngestionResult:
        file_paths = [path for path in repository_root.rglob("*") if path.is_file()]
        python_files = sum(path.suffix.lower() == ".py" for path in file_paths)
        if python_files == 0:
            raise IngestionError("The repository contains no supported Python (.py) source files.", 422)

        result = IngestionResult(
            ingestion_id=f"ING-{uuid.uuid4().hex}",
            repository_name=repository_name,
            source=source,
            status="INGESTED",
            files=len(file_paths),
            python_files=python_files,
            warnings=warnings[:_MAX_WARNINGS],
            archive_size_bytes=archive_size,
            timings=timings or {},
        )
        with self._lock:
            while len(self._workspaces) >= self._settings.max_active_workspaces:
                oldest_id = next(iter(self._workspaces))
                oldest = self._workspaces.pop(oldest_id)
                self._remove_cached_workspace_locked(oldest_id)
                oldest.temporary_directory.cleanup()
            self._workspaces[result.ingestion_id] = _Workspace(
                temporary_directory=temporary_directory,
                repository_root=repository_root,
                result=result,
            )
        logger.info(
            "repository_ingested id=%s source=%s files=%d python_files=%d archive_bytes=%d",
            result.ingestion_id,
            source,
            result.files,
            result.python_files,
            archive_size,
        )
        return result

    def _cached_workspace(self, canonical_url: str) -> IngestionResult | None:
        key = canonical_url.casefold()
        with self._lock:
            cached = self._github_cache.get(key)
            if cached is None:
                return None
            expires_at, ingestion_id = cached
            workspace = self._workspaces.get(ingestion_id)
            if expires_at <= time.monotonic() or workspace is None:
                self._github_cache.pop(key, None)
                return None
            logger.info("github_repository_cache_hit id=%s", ingestion_id)
            return workspace.result

    def _remove_cached_workspace_locked(self, ingestion_id: str) -> None:
        expired = [key for key, (_, cached_id) in self._github_cache.items() if cached_id == ingestion_id]
        for key in expired:
            self._github_cache.pop(key, None)

    @staticmethod
    def _parse_github_url(repository_url: str) -> tuple[str, str]:
        try:
            parsed = urllib.parse.urlsplit(repository_url.strip())
            port = parsed.port
        except (ValueError, AttributeError):
            raise IngestionError("Enter a valid public GitHub repository URL.", 422) from None
        if (
            parsed.scheme != "https"
            or parsed.hostname != "github.com"
            or parsed.username is not None
            or parsed.password is not None
            or port not in (None, 443)
            or parsed.query
            or parsed.fragment
        ):
            raise IngestionError("Only public HTTPS github.com repository URLs are supported.", 422)

        path = parsed.path.strip("/")
        segments = path.split("/") if path else []
        if len(segments) != 2:
            raise IngestionError("Use a repository URL in the form https://github.com/owner/repository.", 422)
        owner, repository = segments
        if repository.lower().endswith(".git"):
            repository = repository[:-4]
        valid_segment = re.compile(r"^[A-Za-z0-9_.-]{1,100}$")
        if (
            not valid_segment.fullmatch(owner)
            or not valid_segment.fullmatch(repository)
            or owner in {".", ".."}
            or repository in {".", ".."}
        ):
            raise IngestionError("The GitHub owner or repository name is invalid.", 422)
        return owner, repository

    def _download_archive(self, owner: str, repository: str, destination: Path) -> int:
        url = f"https://api.github.com/repos/{owner}/{repository}/zipball"
        request = urllib.request.Request(
            url,
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "AI-Architecture-Reviewer/0.1",
                "X-GitHub-Api-Version": "2022-11-28",
                **({"Authorization": f"Bearer {self._settings.github_token}"} if self._settings.github_token else {}),
            },
        )
        opener = urllib.request.build_opener(_SafeGitHubRedirectHandler())
        try:
            response = opener.open(request, timeout=self._settings.github_request_timeout_seconds)
            with response, destination.open("xb") as archive_file:
                final_url = urllib.parse.urlsplit(response.geturl())
                if final_url.scheme != "https" or final_url.hostname not in _GITHUB_REDIRECT_HOSTS:
                    raise IngestionError("GitHub returned an unsafe archive location.", 502)
                content_length = response.headers.get("Content-Length")
                if content_length and int(content_length) > self._max_repository_bytes:
                    raise IngestionError("Repository archive exceeds the configured size limit.", 413)
                total = 0
                while chunk := response.read(_DOWNLOAD_CHUNK_SIZE):
                    total += len(chunk)
                    if total > self._max_repository_bytes:
                        raise IngestionError("Repository archive exceeds the configured size limit.", 413)
                    archive_file.write(chunk)
                return total
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                raise IngestionError("GitHub repository was not found or is not public.", 404) from None
            if exc.code in {403, 429}:
                raise self._github_access_error(exc) from None
            raise IngestionError(f"GitHub archive request failed with HTTP {exc.code}.", 502) from None
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise IngestionError(f"Could not download the GitHub repository: {exc}", 502) from None
        except ValueError:
            raise IngestionError("GitHub returned an invalid archive size.", 502) from None

    @staticmethod
    def _github_access_error(error: urllib.error.HTTPError) -> IngestionError:
        headers = error.headers or {}
        remaining = headers.get("X-RateLimit-Remaining")
        retry_after = headers.get("Retry-After")
        reset_epoch = headers.get("X-RateLimit-Reset")
        try:
            error_body = error.read(4096).decode("utf-8", errors="replace").casefold()
        except (OSError, AttributeError):
            error_body = ""
        rate_limited = (
            error.code == 429
            or remaining == "0"
            or bool(retry_after)
            or "rate limit" in error_body
            or "secondary rate" in error_body
        )
        if rate_limited:
            retry_message = ""
            if retry_after:
                retry_message = f" Retry after approximately {retry_after} seconds."
            elif reset_epoch:
                try:
                    reset_at = datetime.fromtimestamp(int(reset_epoch), UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
                    retry_message = f" Rate limit resets at {reset_at}."
                except (ValueError, OverflowError, OSError):
                    retry_message = " Check X-RateLimit-Reset for the reset time."
            return IngestionError(
                "GitHub API rate limit reached. Configure GITHUB_TOKEN to use the authenticated rate limit."
                + retry_message,
                429,
            )
        return IngestionError(
            "GitHub denied access to this repository (403); it may be private or restricted. "
            "Only public repositories are supported.",
            403,
        )

    @property
    def _max_repository_bytes(self) -> int:
        return self._settings.max_repository_size_mb * _MIB

    def _copy_bounded(self, upload: BinaryIO, destination: Path) -> int:
        total = 0
        try:
            with destination.open("xb") as output:
                while chunk := upload.read(_DOWNLOAD_CHUNK_SIZE):
                    total += len(chunk)
                    if total > self._max_repository_bytes:
                        raise IngestionError("Uploaded archive exceeds the configured size limit.", 413)
                    output.write(chunk)
        except OSError as exc:
            raise IngestionError(f"Could not stage the uploaded archive: {exc}", 400) from None
        return total

    def _extract_archive(self, archive_path: Path, repository_root: Path) -> list[str]:
        try:
            archive = zipfile.ZipFile(archive_path)
        except (zipfile.BadZipFile, OSError) as exc:
            raise IngestionError(f"Uploaded file is not a valid ZIP archive: {exc}", 422) from None

        with archive:
            infos = archive.infolist()
            regular_files = [info for info in infos if not info.is_dir()]
            if len(regular_files) > self._settings.max_files * _MAX_ARCHIVE_ENTRIES_MULTIPLIER:
                raise IngestionError("Archive contains too many entries to inspect safely.", 413)
            if sum(info.file_size for info in regular_files) > self._max_repository_bytes:
                raise IngestionError("Expanded repository archive exceeds the configured size limit.", 413)

            normalized: list[tuple[zipfile.ZipInfo, tuple[str, ...]]] = []
            seen: set[str] = set()
            for info in infos:
                parts = self._safe_member_parts(info.filename)
                if not parts:
                    continue
                identity = "/".join(parts).casefold()
                if identity in seen:
                    raise IngestionError("Archive contains duplicate or colliding paths.", 422)
                seen.add(identity)
                if self._is_symlink(info):
                    raise IngestionError("Archive contains a symbolic link; links are not accepted.", 422)
                if self._is_unsupported_file_type(info):
                    raise IngestionError("Archive contains a special filesystem entry.", 422)
                if info.flag_bits & 0x1:
                    raise IngestionError("Password-protected ZIP entries are not supported.", 422)
                normalized.append((info, parts))

            prefix = self._single_root_prefix(normalized)
            repository_root.mkdir(parents=True, exist_ok=False)
            warnings: list[str] = []
            extracted_count = 0
            max_file_bytes = self._settings.max_file_size_mb * _MIB
            for info, original_parts in normalized:
                parts = original_parts[len(prefix):] if prefix and original_parts[: len(prefix)] == prefix else original_parts
                if not parts or info.is_dir():
                    continue
                if self._is_ignored(parts):
                    continue
                if not self._is_supported_text_file(parts[-1]):
                    continue
                if info.file_size > max_file_bytes:
                    self._append_warning(warnings, f"Skipped oversized file: {'/'.join(parts)}")
                    continue
                extracted_count += 1
                if extracted_count > self._settings.max_files:
                    raise IngestionError("Repository exceeds the configured file-count limit.", 413)

                destination = repository_root.joinpath(*parts)
                resolved_root = repository_root.resolve()
                resolved_destination = destination.resolve()
                if not resolved_destination.is_relative_to(resolved_root):
                    raise IngestionError("Archive path escaped the temporary workspace.", 422)
                destination.parent.mkdir(parents=True, exist_ok=True)
                try:
                    with archive.open(info, "r") as source, destination.open("xb") as output:
                        copied = 0
                        contains_nul = False
                        while chunk := source.read(_DOWNLOAD_CHUNK_SIZE):
                            copied += len(chunk)
                            if copied > max_file_bytes:
                                raise IngestionError(f"File exceeds the configured size limit: {'/'.join(parts)}", 413)
                            if b"\x00" in chunk:
                                contains_nul = True
                            if not contains_nul:
                                output.write(chunk)
                        if copied != info.file_size:
                            raise IngestionError("Archive entry size did not match its ZIP metadata.", 422)
                except (zipfile.BadZipFile, RuntimeError, OSError) as exc:
                    raise IngestionError(f"Could not safely extract {'/'.join(parts)}: {exc}", 422) from None
                if contains_nul:
                    destination.unlink(missing_ok=True)
                    extracted_count -= 1
                    self._append_warning(warnings, f"Skipped binary-like file: {'/'.join(parts)}")

            return warnings

    @staticmethod
    def _safe_member_parts(name: str) -> tuple[str, ...]:
        if "\x00" in name:
            raise IngestionError("Archive contains a path with a null byte.", 422)
        normalized = name.replace("\\", "/")
        windows_path = PureWindowsPath(name)
        posix_path = PurePosixPath(normalized)
        if normalized.startswith("/") or posix_path.is_absolute() or windows_path.is_absolute() or windows_path.drive:
            raise IngestionError("Archive contains an absolute path.", 422)
        parts = tuple(part for part in normalized.split("/") if part not in ("", "."))
        if any(part == ".." for part in parts):
            raise IngestionError("Archive contains a path traversal entry.", 422)
        for part in parts:
            if any(char in part for char in '<>:"|?*') or part.endswith((".", " ")):
                raise IngestionError("Archive contains a filename unsafe on supported platforms.", 422)
            if part.split(".", 1)[0].casefold() in _WINDOWS_RESERVED_NAMES:
                raise IngestionError("Archive contains a reserved filename.", 422)
        return parts

    @staticmethod
    def _is_symlink(info: zipfile.ZipInfo) -> bool:
        unix_mode = info.external_attr >> 16
        return stat.S_ISLNK(unix_mode)

    @staticmethod
    def _is_unsupported_file_type(info: zipfile.ZipInfo) -> bool:
        unix_mode = info.external_attr >> 16
        file_type = stat.S_IFMT(unix_mode)
        return file_type not in (0, stat.S_IFREG, stat.S_IFDIR, stat.S_IFLNK)

    @staticmethod
    def _single_root_prefix(
        members: list[tuple[zipfile.ZipInfo, tuple[str, ...]]],
    ) -> tuple[str, ...]:
        files = [parts for info, parts in members if not info.is_dir()]
        if not files:
            return ()
        roots = {parts[0] for parts in files if len(parts) > 1}
        if len(roots) == 1 and all(len(parts) > 1 and parts[0] in roots for parts in files):
            return (next(iter(roots)),)
        return ()

    @staticmethod
    def _is_ignored(parts: tuple[str, ...]) -> bool:
        if any(part.casefold() in _IGNORED_DIRECTORIES for part in parts[:-1]):
            return True
        filename = parts[-1]
        lowered = filename.casefold()
        if lowered in _IGNORED_FILENAMES or lowered.endswith(("~", ".swp", ".tmp")):
            return True
        return lowered.endswith(".pyc") or lowered.endswith(".pyo")

    @staticmethod
    def _is_supported_text_file(filename: str) -> bool:
        lowered = filename.casefold()
        suffix = Path(lowered).suffix
        if suffix in _IGNORED_SUFFIXES:
            return False
        return suffix in _TEXT_SUFFIXES or lowered in _TEXT_FILENAMES

    @staticmethod
    def _append_warning(warnings: list[str], warning: str) -> None:
        if len(warnings) < _MAX_WARNINGS:
            warnings.append(warning)
