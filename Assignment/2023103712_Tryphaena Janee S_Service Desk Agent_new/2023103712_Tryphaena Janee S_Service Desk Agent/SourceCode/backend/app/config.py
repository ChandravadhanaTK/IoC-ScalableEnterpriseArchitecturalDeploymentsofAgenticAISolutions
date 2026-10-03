"""Central configuration, loaded once from environment variables.

Every setting has a safe local-development default so the app runs with zero
configuration (mock LLM, SQLite, demo login). Production deployments override
these through Kubernetes ConfigMaps / Secrets (see k8s/).
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _list(name: str, default: str) -> list[str]:
    return [v.strip() for v in os.getenv(name, default).split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    app_env: str = "development"
    app_version: str = "1.0.0"

    # --- Auth -------------------------------------------------------------
    jwt_secret: str = "dev-only-change-me-please-32-bytes-min!!"
    jwt_ttl_minutes: int = 480
    demo_login_enabled: bool = True

    # --- LLM --------------------------------------------------------------
    # "auto" uses Anthropic when ANTHROPIC_API_KEY is set, otherwise the
    # deterministic mock (handy for tests, demos and offline development).
    llm_provider: str = "auto"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5-5"
    anthropic_base_url: str = "https://api.anthropic.com"
    llm_timeout_s: float = 20.0
    llm_max_retries: int = 2
    # USD per million tokens, used for cost dashboards. Set to your contract rates.
    cost_per_mtok_input: float = 3.0
    cost_per_mtok_output: float = 15.0

    # --- Workflow ----------------------------------------------------------
    max_graph_steps: int = 20
    tool_max_retries: int = 2
    approval_ttl_minutes: int = 240
    triage_min_confidence: float = 0.45
    max_input_chars: int = 4000

    # --- Platform ----------------------------------------------------------
    db_path: str = "./data/servicedesk.db"
    cors_origins: list[str] = field(default_factory=lambda: ["http://localhost:5173"])
    rate_limit_per_minute: int = 30
    seed_demo_data: bool = False
    frontend_dist: str = "../frontend/dist"
    # Business-outcome assumptions for the monitoring dashboard.
    minutes_saved_per_auto_resolution: float = 18.0
    loaded_cost_per_agent_hour: float = 35.0

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            app_env=os.getenv("APP_ENV", cls.app_env),
            app_version=os.getenv("APP_VERSION", cls.app_version),
            jwt_secret=os.getenv("JWT_SECRET", cls.jwt_secret),
            jwt_ttl_minutes=int(os.getenv("JWT_TTL_MINUTES", cls.jwt_ttl_minutes)),
            demo_login_enabled=_bool("DEMO_LOGIN_ENABLED", cls.demo_login_enabled),
            llm_provider=os.getenv("LLM_PROVIDER", cls.llm_provider).lower(),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
            anthropic_model=os.getenv("ANTHROPIC_MODEL", cls.anthropic_model),
            anthropic_base_url=os.getenv("ANTHROPIC_BASE_URL", cls.anthropic_base_url),
            llm_timeout_s=float(os.getenv("LLM_TIMEOUT_S", cls.llm_timeout_s)),
            llm_max_retries=int(os.getenv("LLM_MAX_RETRIES", cls.llm_max_retries)),
            cost_per_mtok_input=float(os.getenv("COST_PER_MTOK_INPUT", cls.cost_per_mtok_input)),
            cost_per_mtok_output=float(os.getenv("COST_PER_MTOK_OUTPUT", cls.cost_per_mtok_output)),
            max_graph_steps=int(os.getenv("MAX_GRAPH_STEPS", cls.max_graph_steps)),
            tool_max_retries=int(os.getenv("TOOL_MAX_RETRIES", cls.tool_max_retries)),
            approval_ttl_minutes=int(os.getenv("APPROVAL_TTL_MINUTES", cls.approval_ttl_minutes)),
            triage_min_confidence=float(os.getenv("TRIAGE_MIN_CONFIDENCE", cls.triage_min_confidence)),
            max_input_chars=int(os.getenv("MAX_INPUT_CHARS", cls.max_input_chars)),
            db_path=os.getenv("DB_PATH", cls.db_path),
            cors_origins=_list("CORS_ORIGINS", "http://localhost:5173"),
            rate_limit_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", cls.rate_limit_per_minute)),
            seed_demo_data=_bool("SEED_DEMO_DATA", cls.seed_demo_data),
            frontend_dist=os.getenv("FRONTEND_DIST", cls.frontend_dist),
            minutes_saved_per_auto_resolution=float(
                os.getenv("MINUTES_SAVED_PER_AUTO_RESOLUTION", cls.minutes_saved_per_auto_resolution)
            ),
            loaded_cost_per_agent_hour=float(
                os.getenv("LOADED_COST_PER_AGENT_HOUR", cls.loaded_cost_per_agent_hour)
            ),
        )

    def validate_for_production(self) -> list[str]:
        """Return a list of misconfigurations that must block a prod start."""
        problems = []
        if self.app_env == "production":
            if self.jwt_secret == Settings.jwt_secret or len(self.jwt_secret) < 32:
                problems.append("JWT_SECRET must be set to a random value of 32+ chars")
            if self.demo_login_enabled:
                problems.append("DEMO_LOGIN_ENABLED must be false in production (use SSO/OIDC)")
            if "*" in self.cors_origins:
                problems.append("CORS_ORIGINS must not contain '*' in production")
        return problems


settings = Settings.from_env()
