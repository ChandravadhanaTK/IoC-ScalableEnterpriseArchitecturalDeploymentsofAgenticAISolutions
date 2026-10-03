"""
Application configuration.

All configuration is sourced from environment variables (see .env.example
at the repository root). Every setting has a safe default so the
application boots in a bare development environment with AI analysis
disabled and a local SQLite database.

This module has no dependency on the analyzer package: the analyzer is
usable as a standalone library regardless of how the API is configured.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Resolve the repository-level .env independently of the process working
    # directory (the documented backend command runs from ./backend).
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- General ---
    app_env: str = "development"
    app_name: str = "AI Architecture Reviewer"
    app_version: str = "0.1.0"

    # --- Database ---
    database_url: str = "sqlite:///./analysis.db"

    # --- Optional Gemini AI review ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    gemini_image_model: str = "gemini-3.1-flash-image"
    enable_ai_analysis: bool = True
    llm_timeout_seconds: int = Field(default=30, ge=1, le=120)

    # --- Optional GitHub API authentication ---
    github_token: str = ""

    # --- Repository ingestion limits ---
    max_repository_size_mb: int = Field(default=200, ge=1, le=2048)
    max_files: int = Field(default=5000, ge=1, le=100000)
    max_file_size_mb: int = Field(default=5, ge=1, le=200)
    max_active_workspaces: int = Field(default=10, ge=1, le=100)
    github_request_timeout_seconds: int = Field(default=20, ge=1, le=120)
    github_cache_ttl_seconds: int = Field(default=3600, ge=0, le=86400)

    # --- Initial heuristic smell thresholds ---
    long_method_lines: int = Field(default=50, ge=1, le=10000)
    large_class_methods: int = Field(default=15, ge=1, le=1000)
    long_parameter_count: int = Field(default=5, ge=1, le=100)
    high_fan_out: int = Field(default=10, ge=1, le=10000)
    high_complexity: int = Field(default=15, ge=1, le=1000)
    wide_interface_methods: int = Field(default=10, ge=1, le=1000)
    god_class_methods: int = Field(default=20, ge=2, le=1000)
    god_class_loc: int = Field(default=500, ge=50, le=50000)
    god_class_fan_out: int = Field(default=10, ge=2, le=10000)
    god_class_attributes: int = Field(default=15, ge=2, le=2000)
    god_class_min_signals: int = Field(default=3, ge=2, le=4)

    # --- Logging ---
    log_level: str = "INFO"

    # --- API access ---
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance.

    Using a function (rather than a module-level singleton) makes it easy
    to override settings in tests via dependency-injection / cache-clearing.
    """
    return Settings()
