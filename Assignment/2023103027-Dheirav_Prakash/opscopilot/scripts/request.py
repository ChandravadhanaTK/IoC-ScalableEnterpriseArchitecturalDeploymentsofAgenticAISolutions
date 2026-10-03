"""CLI for stage B and C: start a request, approve or reject it, drain events.

    .venv/bin/python scripts/request.py start --role shift_supervisor "Re-route SHP-1003"
    .venv/bin/python scripts/request.py approve <thread_id> --role ops_manager --user mgr1
    .venv/bin/python scripts/request.py pending
    .venv/bin/python scripts/request.py drain
"""
from __future__ import annotations

import argparse
import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from opscopilot.agents import supervisor  # noqa: E402
from opscopilot.identity import Identity, PolicyDenied  # noqa: E402
from opscopilot.integration import db  # noqa: E402
from opscopilot.telemetry import new_trace_id  # noqa: E402
from opscopilot import worker  # noqa: E402


def show(snap: dict) -> None:
    st = snap["state"]
    print(f"\nthread: {snap['thread_id']}  paused: {snap['paused']}  status: {st.get('status')}")
    if snap["interrupt"]:
        print("APPROVAL REQUIRED:\n" + json.dumps(snap["interrupt"]["proposal"], indent=1))
    if st.get("report"):
        print("\nREPORT:\n" + st["report"])


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("start"); s.add_argument("request"); s.add_argument("--role", default="shift_supervisor"); s.add_argument("--user", default="u-demo")
    a = sub.add_parser("approve"); a.add_argument("thread_id"); a.add_argument("--role", default="ops_manager"); a.add_argument("--user", default="mgr1"); a.add_argument("--note", default="")
    r = sub.add_parser("reject"); r.add_argument("thread_id"); r.add_argument("--role", default="ops_manager"); r.add_argument("--user", default="mgr1"); r.add_argument("--note", default="")
    t = sub.add_parser("retry"); t.add_argument("thread_id")
    sub.add_parser("pending")
    sub.add_parser("drain")
    args = ap.parse_args()
    tid = new_trace_id()
    if args.cmd == "start":
        ident = Identity.for_role(args.user, args.role)
        show(supervisor.start_request(args.request, ident, f"req-{uuid.uuid4().hex[:12]}"))
        print(f"\ntrace_id: {tid}")
    elif args.cmd in ("approve", "reject"):
        ident = Identity.for_role(args.user, args.role)
        try:
            show(supervisor.resume_request(args.thread_id, {"decision": "approve" if args.cmd == "approve" else "reject", "user": ident.user_id, "role": ident.role, "note": args.note}))
        except (PolicyDenied, LookupError, ValueError) as e:
            print(f"refused: {e}")
            sys.exit(2)
    elif args.cmd == "retry":
        try:
            show(supervisor.retry_request(args.thread_id))
        except ValueError as e:
            print(f"refused: {e}")
            sys.exit(2)
    elif args.cmd == "pending":
        for p in db.list_approvals("pending"):
            print(p["thread_id"], p["proposal"]["shipment_id"], "->", p["proposal"]["to_carrier"], "approvers:", p["approver_roles"],
                  f"signed {len(p['signatures'])}/{p['required_approvals']}")
    elif args.cmd == "drain":
        n = 0
        while worker.run_once("cli"):
            n += 1
        print(f"handled {n} events; backlog now {db.event_backlog()}")


if __name__ == "__main__":
    main()
