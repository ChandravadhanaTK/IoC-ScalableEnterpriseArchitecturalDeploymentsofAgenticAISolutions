"""CLI for stage A. Usage:

    .venv/bin/python scripts/ask.py --role shift_supervisor "Which shipments are at risk on Chennai to Mumbai?"
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from opscopilot.agents.rag_agent import ask  # noqa: E402
from opscopilot.identity import Identity  # noqa: E402
from opscopilot.telemetry import new_trace_id  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("question")
    ap.add_argument("--role", default="shift_supervisor")
    ap.add_argument("--user", default="u-demo")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    tid = new_trace_id()
    state = ask(a.question, Identity.for_role(a.user, a.role))
    if a.json:
        print(json.dumps({k: v for k, v in state.items() if k != "identity"}, indent=1, default=str))
        return
    print(f"\ntrace_id: {tid}")
    print(f"evidence: {[c['citation'] for c in state.get('evidence', [])]}")
    print(f"tools:    {[(t['tool'], t.get('args'), t['ok']) for t in state.get('tool_results', [])]}")
    print(f"loops:    iterations={state.get('iterations')} stopped_by={state.get('stopped_by')}")
    print(f"eval:     {state.get('evaluation')}")
    print(f"\nANSWER:\n{state.get('answer')}\n\ncitations: {state.get('citations')}")


if __name__ == "__main__":
    main()
