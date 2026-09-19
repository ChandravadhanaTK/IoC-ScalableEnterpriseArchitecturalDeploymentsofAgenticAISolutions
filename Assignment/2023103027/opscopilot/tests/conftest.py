"""Test fixtures. Every test gets a fresh seeded database in a temp dir so the
allowlisted query service, the idempotent writes and the outbox can be tested
without touching the demo data. Model-dependent tests are marked `llm` and
skipped unless Ollama is reachable, so the suite stays green in CI."""
from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


# telemetry is deliberately not reloaded: Prometheus metrics register once per process.
MODULES = [
    "opscopilot.config", "opscopilot.integration.db", "opscopilot.integration.business_api",
    "opscopilot.integration.business_client", "opscopilot.tools.shipments", "opscopilot.llm",
    "opscopilot.agents.rag_agent", "opscopilot.agents.supervisor", "opscopilot.worker", "opscopilot.api",
]


def _reload_all():
    for name in MODULES:
        mod = sys.modules.get(name)
        if mod is not None:
            importlib.reload(mod)
        else:
            importlib.import_module(name)


@pytest.fixture()
def fresh_db(tmp_path, monkeypatch):
    """A seeded database and checkpoint file in a temp dir, with every module
    that captured `settings` reloaded so nothing touches data/."""
    monkeypatch.setenv("DB_PATH", str(tmp_path / "ops.db"))
    monkeypatch.setenv("CHECKPOINT_PATH", str(tmp_path / "checkpoints.db"))
    monkeypatch.setenv("BUSINESS_API_TOKEN", "t0k3n")
    monkeypatch.setenv("BUSINESS_API_URL", "inprocess")
    monkeypatch.setenv("ACTIONS_DISABLED", "false")
    _reload_all()
    from opscopilot import telemetry
    telemetry.set_trace_id("-")
    seed = importlib.import_module("scripts.seed_db")
    importlib.reload(seed)
    seed.main()
    import opscopilot.integration.db as db
    return db


def ollama_up() -> bool:
    import httpx
    try:
        base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        return httpx.get(f"{base}/api/version", timeout=2).status_code == 200
    except Exception:
        return False


llm = pytest.mark.skipif(not ollama_up(), reason="Ollama not reachable")
