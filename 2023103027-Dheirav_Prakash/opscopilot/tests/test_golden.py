"""Regression evaluation against the live model (Module 8: agent evaluation).

Each golden question asserts on citations, tool calls and a few key facts,
never on wording, so a prompt or model change is judged on behaviour. Skipped
when Ollama is unreachable; run explicitly with
    .venv/bin/python -m pytest -q tests/test_golden.py -s
Results are also written to data/golden_results.json for the HANDOFF.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import pytest

from opscopilot.identity import Identity

from .conftest import ROOT, llm

CASES = json.loads((ROOT / "tests" / "golden_questions.json").read_text())
RESULTS: list[dict] = []


@llm
@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
def test_golden(case):
    from opscopilot.agents.rag_agent import ask
    from opscopilot.telemetry import new_trace_id
    new_trace_id()
    t0 = time.perf_counter()
    out = ask(case["question"], Identity.for_role("golden", case["role"]))
    elapsed = round(time.perf_counter() - t0, 1)
    answer = out.get("answer", "")
    cites = set(out.get("citations", []))
    called = {t["tool"] for t in out.get("tool_results", []) if t["ok"]}
    problems = []
    for c in case.get("must_cite", []):
        if c not in cites:
            problems.append(f"missing citation {c}")
    for t in case.get("must_call", []):
        if t not in called:
            problems.append(f"tool {t} not called")
    for m in case.get("must_mention", []):
        if m.lower() not in answer.lower():
            problems.append(f"answer does not mention {m!r}")
    for m in case.get("must_not_mention", []):
        if m.lower() in answer.lower():
            problems.append(f"answer leaks {m!r}")
    # An answer released with an unverified evaluator is a failure of the
    # pipeline even if its content is right; a run that hit the iteration
    # budget is recorded as a warning because the content checks still hold.
    if out.get("stopped_by") == "unverified":
        problems.append("evaluator could not verify the answer")
    from opscopilot.agents.prompts import PROMPT_VERSION
    from opscopilot.config import settings
    RESULTS.append({"id": case["id"], "ok": not problems, "problems": problems, "seconds": elapsed,
                    "stopped_by": out.get("stopped_by"), "citations": sorted(cites),
                    "prompt_version": PROMPT_VERSION, "chat_model": settings.chat_model})
    assert not problems, f"{case['id']}: {problems}\nANSWER: {answer}"


@pytest.fixture(scope="session", autouse=True)
def _write_results():
    yield
    if RESULTS:
        Path(ROOT / "data").mkdir(exist_ok=True)
        (ROOT / "data" / "golden_results.json").write_text(json.dumps(RESULTS, indent=1))
