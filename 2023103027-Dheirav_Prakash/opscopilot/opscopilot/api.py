"""The copilot's HTTP surface: ask, request, approve, inspect, plus the runtime
contract Kubernetes needs (health, readiness, metrics).

Identity comes in as headers for the demo. In production the gateway would
validate a token and set the same two headers from its claims; nothing below
this line would change.
"""
from __future__ import annotations

import uuid

import httpx
from fastapi import FastAPI, Header, HTTPException, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from pydantic import BaseModel, Field

from .agents import rag_agent, supervisor
from .config import settings
from .identity import Identity, PolicyDenied
from .integration import db
from .telemetry import APPROVALS_PENDING, EVENT_BACKLOG, PROMPT_INFO, REQUESTS, get_logger, log, new_trace_id
from .agents.prompts import PROMPT_VERSION

PROMPT_INFO.labels(prompt_version=PROMPT_VERSION, chat_model=settings.chat_model).set(1)

logger = get_logger("api")
app = FastAPI(title="Operations Copilot", version="1.0")


def _identity(x_user: str, x_role: str) -> Identity:
    """Identity comes from headers a gateway sets after validating a token.
    A request with no identity is refused; nothing defaults to a role."""
    if not x_user or not x_role:
        raise HTTPException(401, "X-User and X-Role are required")
    try:
        return Identity.for_role(x_user, x_role)
    except PermissionError as e:
        raise HTTPException(403, str(e))


APPROVER_ROLES = {"shift_supervisor", "ops_manager", "quality_lead", "finance_controller"}
MANAGER_ROLES = {"ops_manager", "finance_controller"}


def _require(ident: Identity, roles: set[str], what: str) -> None:
    if ident.role not in roles:
        raise HTTPException(403, f"{what} is restricted to {sorted(roles)}")


class AskBody(BaseModel):
    question: str = Field(min_length=3, max_length=2000)


class RequestBody(BaseModel):
    request: str = Field(min_length=3, max_length=2000)


class DecisionBody(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")
    note: str = ""


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@app.get("/readyz")
def readyz() -> dict:
    """Ready only when the two dependencies a request needs are reachable."""
    problems = []
    try:
        db.event_backlog()
    except Exception as e:
        problems.append(f"db: {e}")
    try:
        tags = httpx.get(f"{settings.ollama_base_url}/api/tags", timeout=2)
        tags.raise_for_status()
        names = {m.get("name", "") for m in tags.json().get("models", [])}
        for needed in (settings.chat_model, settings.embed_model):
            if not any(n == needed or n.split(":")[0] == needed.split(":")[0] and n.startswith(needed) for n in names):
                problems.append(f"ollama: model {needed} not present")
    except Exception as e:
        problems.append(f"ollama: {e}")
    if problems:
        raise HTTPException(503, {"ready": False, "problems": problems})
    return {"ready": True, "model": settings.chat_model}


@app.get("/metrics")
def metrics() -> Response:
    # Gauges that describe shared state are refreshed on every scrape, so each
    # replica reports the truth rather than the last value it happened to set.
    try:
        APPROVALS_PENDING.set(db.pending_approval_count())
        EVENT_BACKLOG.set(db.event_backlog())
    except Exception as e:  # noqa: BLE001 - a scrape must not fail because the DB is busy
        log(logger, "gauge refresh failed", error=str(e))
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/ask")
def ask(body: AskBody, x_user: str = Header(default=""), x_role: str = Header(default="")) -> dict:
    ident = _identity(x_user, x_role)
    tid = new_trace_id()
    try:
        out = rag_agent.ask(body.question, ident)
    except Exception as e:
        REQUESTS.labels(outcome="error").inc()
        log(logger, "ask failed", error=str(e))
        raise HTTPException(500, "copilot error; see trace " + tid)
    REQUESTS.labels(outcome=out.get("stopped_by", "ok")).inc()
    return {"trace_id": tid, "answer": out.get("answer"), "citations": out.get("citations"),
            "evidence": [c["citation"] for c in out.get("evidence", [])],
            "tools": [{"tool": t["tool"], "args": t.get("args"), "ok": t["ok"]} for t in out.get("tool_results", [])],
            "evaluation": out.get("evaluation"), "stopped_by": out.get("stopped_by")}


@app.post("/requests")
def create_request(body: RequestBody, x_user: str = Header(default=""), x_role: str = Header(default="")) -> dict:
    ident = _identity(x_user, x_role)
    tid = new_trace_id()
    thread_id = f"req-{uuid.uuid4().hex[:12]}"
    try:
        snap = supervisor.start_request(body.request, ident, thread_id)
    except Exception as e:
        REQUESTS.labels(outcome="error").inc()
        log(logger, "request failed", error=str(e), thread_id=thread_id)
        # The checkpoint (if any) survives; hand back the thread id so it can be retried.
        raise HTTPException(500, {"error": "copilot error", "trace_id": tid, "thread_id": thread_id})
    REQUESTS.labels(outcome=snap["state"].get("status", "ok")).inc()
    return {"trace_id": tid, **snap}


@app.get("/approvals")
def approvals(status: str = "pending", x_user: str = Header(default=""), x_role: str = Header(default="")) -> list[dict]:
    ident = _identity(x_user, x_role)
    _require(ident, APPROVER_ROLES, "the approval inbox")
    rows = db.list_approvals(status)
    # An approver sees only what they could act on, plus their own requests.
    return [r for r in rows if ident.role in r["approver_roles"] or r["requested_by"] == ident.user_id]


@app.post("/approvals/{thread_id}")
def decide(thread_id: str, body: DecisionBody, x_user: str = Header(default=""), x_role: str = Header(default="")) -> dict:
    ident = _identity(x_user, x_role)
    new_trace_id()
    try:
        snap = supervisor.resume_request(thread_id, {"decision": body.decision, "user": ident.user_id, "role": ident.role, "note": body.note})
        if snap["paused"]:
            # A valid signature that is not yet the last one: accepted, still pending.
            return Response(content=__import__("json").dumps(snap, default=str), media_type="application/json", status_code=202)
        return snap
    except LookupError as e:
        raise HTTPException(404, str(e))
    except ValueError as e:
        raise HTTPException(409, str(e))
    except PolicyDenied as e:
        raise HTTPException(403, str(e))


@app.post("/requests/{thread_id}/retry")
def retry(thread_id: str, x_user: str = Header(default=""), x_role: str = Header(default="")) -> dict:
    ident = _identity(x_user, x_role)
    _require(ident, MANAGER_ROLES, "retrying an action")
    new_trace_id()
    try:
        return supervisor.retry_request(thread_id, actor=ident.user_id)
    except ValueError as e:
        raise HTTPException(409, str(e))


@app.get("/requests/{thread_id}")
def get_request(thread_id: str, x_user: str = Header(default=""), x_role: str = Header(default="")) -> dict:
    ident = _identity(x_user, x_role)
    graph = supervisor.build_team_graph()
    cfg = {"configurable": {"thread_id": thread_id}}
    raw = graph.get_state(cfg).values
    if not raw:
        raise HTTPException(404, "no such request")
    owner = (raw.get("identity") or {}).get("user_id")
    if ident.user_id != owner and ident.role not in APPROVER_ROLES:
        raise HTTPException(403, "only the requester or an approver may view this request")
    return supervisor.snapshot(graph, cfg, viewer=ident)


@app.get("/audit")
def audit(trace_id: str | None = None, limit: int = 50, x_user: str = Header(default=""), x_role: str = Header(default="")) -> list[dict]:
    ident = _identity(x_user, x_role)
    _require(ident, MANAGER_ROLES, "the audit log")
    return db.list_audit(limit=limit, trace=trace_id)


@app.get("/events")
def events(all: bool = False, x_user: str = Header(default=""), x_role: str = Header(default="")) -> list[dict]:
    ident = _identity(x_user, x_role)
    _require(ident, MANAGER_ROLES, "the event log")
    return db.list_events(unconsumed_only=not all)
