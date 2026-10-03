"""
Unit tests for app.core.config.Settings.

These confirm the safe-defaults requirement from the spec: the app must
boot with no environment variables set, AI analysis defaulting to the
mock provider, and no required secrets.
"""
from app.core.config import Settings


def test_settings_have_safe_defaults(monkeypatch):
    # Ensure no leftover env vars from the host influence this test.
    for key in ["LLM_API_KEY", "LLM_PROVIDER", "DATABASE_URL"]:
        monkeypatch.delenv(key, raising=False)

    settings = Settings(_env_file=None)

    assert settings.llm_provider == "mock"
    assert settings.llm_api_key == ""
    assert settings.database_url.startswith("sqlite:///")
    assert settings.max_repository_size_mb > 0
    assert settings.max_files > 0


def test_settings_read_from_environment(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("APP_ENV", "production")

    settings = Settings(_env_file=None)

    assert settings.llm_provider == "openai"
    assert settings.app_env == "production"
