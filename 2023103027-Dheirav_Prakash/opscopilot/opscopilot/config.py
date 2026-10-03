"""Runtime configuration.

Everything comes from environment variables so the same image runs on a laptop
against a host Ollama and inside Kubernetes against a ConfigMap. Nothing secret
is defaulted here; the only secret in the system (the business API token) has
no default on purpose.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")  # chroma phones home otherwise

ROOT = Path(__file__).resolve().parents[1]


def _env(name: str, default: str) -> str:
    return os.environ.get(name, default)


@dataclass(frozen=True)
class Settings:
    ollama_base_url: str = _env("OLLAMA_BASE_URL", "http://localhost:11434")
    chat_model: str = _env("CHAT_MODEL", "qwen2.5:7b")
    embed_model: str = _env("EMBED_MODEL", "nomic-embed-text")
    temperature: float = float(_env("TEMPERATURE", "0.1"))

    docs_dir: str = _env("DOCS_DIR", str(ROOT / "data" / "docs"))
    chroma_path: str = _env("CHROMA_PATH", str(ROOT / "data" / "chroma"))
    bm25_path: str = _env("BM25_PATH", str(ROOT / "data" / "chunks.json"))
    db_path: str = _env("DB_PATH", str(ROOT / "data" / "ops.db"))
    checkpoint_path: str = _env("CHECKPOINT_PATH", str(ROOT / "data" / "checkpoints.db"))

    top_k: int = int(_env("TOP_K", "4"))
    max_iterations: int = int(_env("MAX_ITERATIONS", "3"))
    max_tool_calls: int = int(_env("MAX_TOOL_CALLS", "4"))

    llm_timeout_seconds: float = float(_env("LLM_TIMEOUT_SECONDS", "120"))
    # Kill switch: when true, approved actions are held at the execute step.
    actions_disabled: bool = _env("ACTIONS_DISABLED", "false").lower() in ("1", "true", "yes")

    business_api_url: str = _env("BUSINESS_API_URL", "http://localhost:8001")
    business_api_token: str = _env("BUSINESS_API_TOKEN", "")
    api_port: int = int(_env("API_PORT", "8000"))
    worker_poll_seconds: float = float(_env("WORKER_POLL_SECONDS", "2"))
    log_level: str = _env("LOG_LEVEL", "INFO")


settings = Settings()
