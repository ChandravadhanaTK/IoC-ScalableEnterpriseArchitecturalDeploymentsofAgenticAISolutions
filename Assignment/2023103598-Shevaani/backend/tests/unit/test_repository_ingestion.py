from __future__ import annotations

import io
import stat
import urllib.request
import zipfile
from pathlib import Path

import pytest

from app.core.config import Settings
from app.services.repository_ingestion import (
    IngestionError,
    RepositoryIngestionService,
    _SafeGitHubRedirectHandler,
)


def make_zip(entries: dict[str, bytes]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name, content in entries.items():
            archive.writestr(name, content)
    return buffer.getvalue()


def make_service(
    tmp_path: Path,
    *,
    max_repository_size_mb: int = 1,
    max_file_size_mb: int = 1,
    max_files: int = 25,
) -> RepositoryIngestionService:
    return RepositoryIngestionService(
        Settings(
            _env_file=None,
            max_repository_size_mb=max_repository_size_mb,
            max_file_size_mb=max_file_size_mb,
            max_files=max_files,
        )
    )


def test_extracts_python_and_text_files_and_ignores_generated_content(tmp_path):
    service = make_service(tmp_path)
    archive = make_zip(
        {
            "sample-main/src/main.py": b"def run():\n    return 1\n",
            "sample-main/README.md": b"Example repository",
            "sample-main/.git/config": b"ignored",
            "sample-main/__pycache__/cached.py": b"ignored",
            "sample-main/assets/image.png": b"not source",
        }
    )

    result = service.ingest_zip(io.BytesIO(archive), "sample.zip")

    assert result.status == "INGESTED"
    assert result.repository_name == "sample"
    assert result.files == 2
    assert result.python_files == 1
    repo_root = service.workspace_paths[result.ingestion_id]
    assert (repo_root / "src" / "main.py").read_text() == "def run():\n    return 1\n"
    assert (repo_root / "README.md").exists()
    assert not (repo_root / ".git").exists()
    service.cleanup()
    assert not repo_root.exists()


@pytest.mark.parametrize(
    "member_name",
    [
        "../outside.py",
        "repo/../../outside.py",
        "/absolute/outside.py",
        "C:/outside.py",
        "..\\..\\outside.py",
        "\\\\server\\share\\outside.py",
    ],
)
def test_rejects_archive_path_traversal(tmp_path, member_name):
    service = make_service(tmp_path)
    archive = make_zip({member_name: b"print('must not execute')"})

    with pytest.raises(IngestionError, match="path"):
        service.ingest_zip(io.BytesIO(archive), "unsafe.zip")

    assert service.workspace_paths == {}
    assert not (tmp_path.parent / "outside.py").exists()


def test_rejects_symbolic_link_entries(tmp_path):
    service = make_service(tmp_path)
    buffer = io.BytesIO()
    link = zipfile.ZipInfo("repo/link.py")
    link.create_system = 3
    link.external_attr = (stat.S_IFLNK | 0o777) << 16
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr(link, "../../outside.py")

    with pytest.raises(IngestionError, match="symbolic link"):
        service.ingest_zip(io.BytesIO(buffer.getvalue()), "unsafe.zip")


def test_rejects_invalid_zip_and_non_zip_filename(tmp_path):
    service = make_service(tmp_path)
    with pytest.raises(IngestionError, match=r"\.zip"):
        service.ingest_zip(io.BytesIO(b"not zip"), "repository.tar")
    with pytest.raises(IngestionError, match="valid ZIP"):
        service.ingest_zip(io.BytesIO(b"not zip"), "repository.zip")


def test_enforces_compressed_and_expanded_size_limits(tmp_path):
    service = make_service(tmp_path, max_repository_size_mb=1)
    with pytest.raises(IngestionError) as compressed_error:
        service.ingest_zip(io.BytesIO(b"x" * (1024 * 1024 + 1)), "large.zip")
    assert compressed_error.value.status_code == 413

    large_content = b"x" * (1024 * 1024 + 1)
    archive = make_zip({"repo/module.py": large_content})
    with pytest.raises(IngestionError) as expanded_error:
        service.ingest_zip(io.BytesIO(archive), "expanded.zip")
    assert expanded_error.value.status_code == 413


def test_skips_oversized_individual_file_with_warning(tmp_path):
    service = make_service(tmp_path, max_repository_size_mb=2, max_file_size_mb=1)
    archive = make_zip(
        {
            "repo/main.py": b"def ok(): return True\n",
            "repo/large.py": b"x" * (1024 * 1024 + 1),
        }
    )

    result = service.ingest_zip(io.BytesIO(archive), "oversized-member.zip")

    assert result.python_files == 1
    assert any("Skipped oversized file" in warning for warning in result.warnings)
    service.cleanup()


def test_requires_at_least_one_python_file(tmp_path):
    service = make_service(tmp_path)
    with pytest.raises(IngestionError, match="no supported Python"):
        service.ingest_zip(io.BytesIO(make_zip({"repo/README.md": b"docs only"})), "docs.zip")


def test_python_source_is_retained_as_data_and_never_executed(tmp_path):
    service = make_service(tmp_path)
    sentinel = tmp_path / "repository_code_was_executed.txt"
    source = (
        "from pathlib import Path\n"
        f"Path({str(sentinel)!r}).write_text('executed')\n"
    ).encode()

    result = service.ingest_zip(io.BytesIO(make_zip({"repo/main.py": source})), "source.zip")

    assert not sentinel.exists()
    assert (service.workspace_paths[result.ingestion_id] / "main.py").read_bytes() == source
    service.cleanup()


def test_skips_binary_like_python_file_with_nul_bytes(tmp_path):
    service = make_service(tmp_path)
    archive = make_zip(
        {
            "repo/main.py": b"def good(): return True\n",
            "repo/data.py": b"not source\x00binary data",
        }
    )

    result = service.ingest_zip(io.BytesIO(archive), "binary-like.zip")
    repository_root = service.workspace_paths[result.ingestion_id]

    assert result.python_files == 1
    assert not (repository_root / "data.py").exists()
    assert any("binary-like file" in warning for warning in result.warnings)
    service.cleanup()


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://github.com/octocat/Hello-World", ("octocat", "Hello-World")),
        ("https://github.com/octocat/Hello-World.git/", ("octocat", "Hello-World")),
    ],
)
def test_accepts_public_github_repository_urls(tmp_path, url, expected):
    assert RepositoryIngestionService._parse_github_url(url) == expected


@pytest.mark.parametrize(
    "url",
    [
        "http://github.com/owner/repo",
        "https://github.com.evil.example/owner/repo",
        "https://user@github.com/owner/repo",
        "https://github.com:8443/owner/repo",
        "https://github.com/owner/repo/tree/main",
        "https://github.com/owner/repo?download=1",
        "https://github.com/../repo",
        "file:///owner/repo",
    ],
)
def test_rejects_unsafe_or_unsupported_github_urls(tmp_path, url):
    with pytest.raises(IngestionError):
        RepositoryIngestionService._parse_github_url(url)


@pytest.mark.parametrize(
    "redirect_url",
    [
        "http://codeload.github.com/owner/repo/zip/main",
        "https://codeload.github.com.evil.example/owner/repo/zip/main",
        "https://codeload.github.com:8443/owner/repo/zip/main",
        "https://user@codeload.github.com/owner/repo/zip/main",
    ],
)
def test_rejects_unsafe_github_archive_redirects(redirect_url):
    handler = _SafeGitHubRedirectHandler()
    request = urllib.request.Request("https://api.github.com/repos/owner/repo/zipball")

    with pytest.raises(IngestionError, match="unsafe archive redirect"):
        handler.redirect_request(
            request,
            io.BytesIO(),
            302,
            "Found",
            {},
            redirect_url,
        )
