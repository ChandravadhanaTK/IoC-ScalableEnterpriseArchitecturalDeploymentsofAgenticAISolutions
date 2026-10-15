"""LLM factory with on-disk caching, rate limiting, and exponential backoff.

Provides get_llm() to create ChatGoogleGenerativeAI instances with
proper caching keyed by hash(prompt + model) to respect free-tier rate limits.

Robustness features (these fix the "model not found" / "API key not valid"
errors that used to kill every run):
  * ``check_gemini_access()``  - cheap pre-flight check of key + model names.
  * ``resolve_model()``        - if the configured model no longer exists, the
                                 newest available Gemini Flash model is used.
  * Fatal errors (bad key, unknown model) are NOT retried 3x with long sleeps;
    they raise ``LLMConfigError`` immediately with a readable message.
"""

from __future__ import annotations

import hashlib
import json
import re
import threading
import time
from functools import lru_cache
from typing import Any

import httpx
from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from utils.config import CACHE_DIR, get_settings
from utils.logging import get_logger

logger = get_logger(__name__)

_API_ROOT = "https://generativelanguage.googleapis.com/v1beta"

# Thread-safe rate limiter
_rate_lock = threading.Lock()
_last_request_time: float = 0.0


class LLMConfigError(RuntimeError):
    """Raised for problems that retrying cannot fix (bad key, unknown model)."""


# ── Pre-flight checks & model resolution ───────────────────────────


def _placeholder_key(key: str) -> bool:
    return (not key) or key.strip().lower() in {
        "your-gemini-api-key-here", "your_api_key", "changeme", "xxx",
    }


@lru_cache(maxsize=4)
def _list_models(api_key: str) -> list[dict[str, Any]] | None:
    """Return the models visible to this key, or None if the API is unreachable.

    Raises:
        LLMConfigError: if Google rejects the API key.
    """
    models: list[dict[str, Any]] = []
    page_token = ""
    try:
        for _ in range(5):
            params = {"key": api_key, "pageSize": 200}
            if page_token:
                params["pageToken"] = page_token
            r = httpx.get(f"{_API_ROOT}/models", params=params, timeout=10.0)
            if r.status_code in (400, 401, 403):
                msg = ""
                try:
                    msg = r.json().get("error", {}).get("message", "")
                except Exception:  # noqa: BLE001
                    pass
                raise LLMConfigError(
                    f"Gemini rejected the API key ({r.status_code}): {msg or 'invalid key'}. "
                    "Create a key at https://aistudio.google.com/apikey and put it in src/.env "
                    "as GEMINI_API_KEY=..."
                )
            r.raise_for_status()
            data = r.json()
            models.extend(data.get("models", []))
            page_token = data.get("nextPageToken", "")
            if not page_token:
                break
        return models
    except LLMConfigError:
        raise
    except Exception as e:  # noqa: BLE001 - network problems are not fatal here
        logger.warning("Could not list Gemini models (%s); using configured names as-is.", e)
        return None


def _version_key(name: str) -> tuple:
    m = re.search(r"gemini-(\d+(?:\.\d+)?)", name)
    return (float(m.group(1)) if m else 0.0,)


def _pick_model(models: list[dict[str, Any]], method: str, kind: str) -> str | None:
    """Pick the best stable model supporting ``method`` for the given kind."""
    names = []
    for m in models:
        if method not in m.get("supportedGenerationMethods", []):
            continue
        names.append(m["name"].removeprefix("models/"))
    if kind == "embedding":
        cands = [n for n in names if "embedding" in n and "exp" not in n]
        cands.sort(key=lambda n: (n != "gemini-embedding-001", n))
        return cands[0] if cands else None
    stable = [n for n in names if re.fullmatch(r"gemini-\d+(?:\.\d+)?-flash(?:-lite)?", n)]
    full = [n for n in stable if not n.endswith("-lite")]
    pool = full or stable
    pool.sort(key=_version_key, reverse=True)
    return pool[0] if pool else None


def resolve_model(configured: str, kind: str = "chat") -> str:
    """Return a model id that really exists for this API key.

    Falls back to the configured name when the model list cannot be fetched.
    """
    settings = get_settings()
    if _placeholder_key(settings.gemini_api_key):
        return configured
    models = _list_models(settings.gemini_api_key)
    if not models:
        return configured
    method = "embedContent" if kind == "embedding" else "generateContent"
    available = {m["name"].removeprefix("models/") for m in models
                 if method in m.get("supportedGenerationMethods", [])}
    if configured.removeprefix("models/") in available:
        return configured.removeprefix("models/")
    picked = _pick_model(models, method, kind)
    if picked:
        logger.warning("Configured model '%s' is not available; using '%s' instead.", configured, picked)
        return picked
    raise LLMConfigError(
        f"Model '{configured}' is not available for your API key and no replacement was found."
    )


def check_gemini_access() -> tuple[bool, str]:
    """Pre-flight check used by the UI.

    Returns:
        (ok, message). ``ok`` is False only for definite problems (missing or
        rejected key). A network failure returns ok=True with a warning text.
    """
    settings = get_settings()
    if _placeholder_key(settings.gemini_api_key):
        return False, ("GEMINI_API_KEY is missing. Copy src/.env.example to src/.env and paste "
                       "a key from https://aistudio.google.com/apikey")
    try:
        models = _list_models(settings.gemini_api_key)
    except LLMConfigError as e:
        return False, str(e)
    if models is None:
        return True, "Could not reach the Gemini API to verify the key (offline?)."
    try:
        chat = resolve_model(settings.gemini_model)
        emb = resolve_model(settings.gemini_embedding_model, "embedding")
    except LLMConfigError as e:
        return False, str(e)
    return True, f"Gemini OK - chat model: {chat}, embedding model: {emb}"


# ── Caching / rate limiting ─────────────────────────────────────────


def _cache_key(prompt: str, model: str) -> str:
    """Generate a deterministic cache key for an LLM call."""
    content = f"{model}::{prompt}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _get_cached(key: str) -> str | None:
    """Retrieve a cached LLM response from disk."""
    cache_file = CACHE_DIR / f"{key}.json"
    if cache_file.exists():
        try:
            data = json.loads(cache_file.read_text(encoding="utf-8"))
            logger.debug("Cache hit: %s", key[:12])
            return data.get("response")
        except (json.JSONDecodeError, KeyError):
            return None
    return None


def _set_cache(key: str, response: str, model: str, prompt_preview: str) -> None:
    """Store an LLM response in the disk cache."""
    cache_file = CACHE_DIR / f"{key}.json"
    data = {
        "model": model,
        "prompt_preview": prompt_preview[:100],
        "response": response,
        "cached_at": time.time(),
    }
    cache_file.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    logger.debug("Cache set: %s", key[:12])


def _rate_limit() -> None:
    """Enforce rate limiting between LLM requests."""
    global _last_request_time
    settings = get_settings()
    min_interval = 60.0 / max(settings.llm_requests_per_minute, 1)

    with _rate_lock:
        now = time.time()
        elapsed = now - _last_request_time
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)
        _last_request_time = time.time()


# ── Error classification ────────────────────────────────────────────

_FATAL_MARKERS = (
    "API_KEY_INVALID", "API key not valid", "NOT_FOUND", "is not found",
    "no longer available", "PERMISSION_DENIED", "UNAUTHENTICATED",
    "INVALID_ARGUMENT",
)


def _is_fatal(exc: BaseException) -> bool:
    if isinstance(exc, LLMConfigError):
        return True
    text = str(exc)
    return any(m in text for m in _FATAL_MARKERS)


def _friendly(exc: BaseException) -> LLMConfigError:
    text = str(exc)
    if "API_KEY_INVALID" in text or "API key not valid" in text:
        return LLMConfigError(
            "Gemini API key is invalid. Create a new key at https://aistudio.google.com/apikey "
            "and set GEMINI_API_KEY in src/.env, then restart the app."
        )
    if "NOT_FOUND" in text or "no longer available" in text or "is not found" in text:
        return LLMConfigError(
            "The configured Gemini model does not exist (or was retired). Update GEMINI_MODEL / "
            f"GEMINI_FALLBACK_MODEL in src/.env. Details: {text[:200]}"
        )
    return LLMConfigError(text[:300])


def _retryable(exc: BaseException) -> bool:
    return not _is_fatal(exc)


def _log_retry(retry_state) -> None:
    logger.warning("LLM retry %d: %s", retry_state.attempt_number, retry_state.outcome.exception())


_retry_policy = dict(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=4, max=60),
    retry=retry_if_exception(_retryable),
    before_sleep=_log_retry,
    reraise=True,
)


# ── Public API ──────────────────────────────────────────────────────


def get_llm(
    temperature: float = 0.2,
    model: str | None = None,
    use_fallback: bool = False,
) -> ChatGoogleGenerativeAI:
    """Create a ChatGoogleGenerativeAI instance."""
    settings = get_settings()
    if _placeholder_key(settings.gemini_api_key):
        raise LLMConfigError("GEMINI_API_KEY is not set. Add it to src/.env.")

    if model is None:
        model = settings.gemini_fallback_model if use_fallback else settings.gemini_model
    model = resolve_model(model)

    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=settings.gemini_api_key,
        temperature=temperature,
    )


def _text_of(response: Any) -> str:
    """Normalise a LangChain response to plain text (content may be a list of parts)."""
    content = getattr(response, "content", response)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and part.get("type", "text") == "text":
                parts.append(part.get("text", ""))
        return "".join(parts)
    return str(content)


@retry(**_retry_policy)
def _call_llm_once(prompt: str, resolved_model: str, temperature: float) -> str:
    _rate_limit()
    llm = get_llm(temperature=temperature, model=resolved_model)
    try:
        return _text_of(llm.invoke(prompt))
    except Exception as e:  # noqa: BLE001
        if _is_fatal(e) and not isinstance(e, LLMConfigError):
            raise _friendly(e) from e
        raise


def call_llm(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.2,
    use_cache: bool = True,
    use_fallback: bool = False,
) -> str:
    """Call the LLM with caching and rate limiting."""
    settings = get_settings()
    resolved_model = model or (
        settings.gemini_fallback_model if use_fallback else settings.gemini_model
    )

    key = _cache_key(prompt, resolved_model)
    if use_cache:
        cached = _get_cached(key)
        if cached is not None:
            return cached

    try:
        result = _call_llm_once(prompt, resolved_model, temperature)
    except LLMConfigError:
        if not use_fallback and settings.gemini_fallback_model and model is None:
            logger.warning("Primary model failed, trying fallback model %s", settings.gemini_fallback_model)
            result = _call_llm_once(prompt, settings.gemini_fallback_model, temperature)
        else:
            raise

    if use_cache and result:
        _set_cache(key, result, resolved_model, prompt)
    return result


@retry(**_retry_policy)
def _structured_once(prompt: str, output_schema: type, model: str, temperature: float) -> Any:
    _rate_limit()
    llm = get_llm(temperature=temperature, model=model)
    structured_llm = llm.with_structured_output(output_schema)
    try:
        result = structured_llm.invoke(prompt)
    except Exception as e:  # noqa: BLE001
        if _is_fatal(e) and not isinstance(e, LLMConfigError):
            raise _friendly(e) from e
        raise
    if result is None:
        raise ValueError("Model returned no structured output")
    if isinstance(result, dict):
        result = output_schema(**result)
    return result


def call_llm_structured(
    prompt: str,
    output_schema: type,
    model: str | None = None,
    temperature: float = 0.2,
    use_fallback: bool = False,
) -> Any:
    """Call the LLM with structured output bound to a Pydantic schema."""
    settings = get_settings()
    resolved_model = model or (
        settings.gemini_fallback_model if use_fallback else settings.gemini_model
    )
    try:
        return _structured_once(prompt, output_schema, resolved_model, temperature)
    except Exception as e:  # noqa: BLE001
        if not use_fallback and model is None and settings.gemini_fallback_model \
                and settings.gemini_fallback_model != resolved_model \
                and not (isinstance(e, LLMConfigError) and "API key" in str(e)):
            logger.warning(
                "Primary model %s failed (%s). Trying fallback %s.",
                resolved_model, str(e)[:120], settings.gemini_fallback_model,
            )
            return _structured_once(prompt, output_schema, settings.gemini_fallback_model, temperature)
        raise
