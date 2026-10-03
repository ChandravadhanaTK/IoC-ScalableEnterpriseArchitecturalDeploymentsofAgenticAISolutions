"""Application configuration loaded from environment variables.

All secrets and model IDs are read from .env via pydantic-settings.
Never hardcode API keys or model names in source code.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve project paths
_THIS_DIR = Path(__file__).resolve().parent
SRC_DIR = _THIS_DIR.parent
PROJECT_ROOT = SRC_DIR.parent
DATA_DIR = SRC_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
CHROMA_DIR = DATA_DIR / "chroma"
CACHE_DIR = DATA_DIR / "cache"
TRACES_DIR = DATA_DIR / "traces"
REPORTS_DIR = DATA_DIR / "reports"

# Ensure data directories exist
for _d in [UPLOADS_DIR, CHROMA_DIR, CACHE_DIR, TRACES_DIR, REPORTS_DIR]:
    _d.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    """Central configuration for ResearchPilot.

    Values are loaded from .env in the src/ directory.
    """

    model_config = SettingsConfigDict(
        env_file=str(SRC_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Gemini API ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    gemini_fallback_model: str = "gemini-3.8-flash-lite"
    gemini_embedding_model: str = "gemini-embedding-001"

    # --- OpenAlex ---
    openalex_email: str = ""

    # --- Rate limiting ---
    llm_requests_per_minute: int = 15
    llm_max_concurrency: int = 2

    # --- Retries ---
    max_retries: int = 3

    # --- Logging ---
    log_level: str = "INFO"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Get cached application settings.

    Returns:
        Settings instance loaded from environment.
    """
    return Settings()
