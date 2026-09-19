"""Stage B: supervisor, specialist workers and a human approval gate.

    intake -> supervisor -> research -> [policy -> approval -> execute] -> report

supervisor  classifies the request and plans the route (structured output)
research    the stage A RAG agent, reused as a worker
policy      deterministic policy-as-runtime: decides whether a re-route is
            permitted, picks an alternate carrier, computes who may approve.
            The model only writes the justification, never the decision.
approval    LangGraph interrupt. State is checkpointed to SQLite, so the run
            survives a restart and resumes on any replica when a human decides.
execute     calls the governed business API with an idempotency key
report      composes the outcome with evidence and audit references

Worker contracts are the Pydantic models below: input schema, output schema,
and a failure path for each.
"""
from __future__ import annotations

import hashlib
import sqlite3
from typing import Any, Literal, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, StateGraph
from langgraph.types import Command, interrupt
from pydantic import BaseModel, Field

from ..config import settings
from ..identity import Identity, PolicyDenied, authorize_tool, reroute_approver_roles, reroute_required_approvals
from ..integration import business_client, db
from ..llm import chat_model, structured
from ..telemetry import APPROVAL_DECISIONS, APPROVALS_PENDING, SUCCESSFUL_ACTIONS, get_logger, log, record_usage, set_trace_id, span, trace_id
from . import prompts
from .rag_agent import build_rag_graph

logger = get_logger("supervisor")


class SupervisorDecision(BaseModel):
    intent: Literal["answer_question", "reroute_shipment"] = Field(description="reroute_shipment only when the user asks to move, re-route or reassign a specific shipment; otherwise answer_question")
    shipment_id: str = Field(default="", description="Shipment id like SHP-1003 if one is named, else empty string")
    reasoning: str = Field(default="", description="One sentence")


class RerouteProposal(BaseModel):
    shipment_id: str
    from_carrier: str
    to_carrier: str
    reason_code: str
    declared_value_inr: int
    cold_chain: bool
    sla_state: str
    approver_roles: list[str]
    required_approvals: int = 1
    idempotency_key: str
    justification: str = ""
    citations: list[str] = Field(default_factory=list)


class TeamState(TypedDict, total=False):
    request: str
    identity: dict[str, Any]   # plain data so the checkpointer can serialise it
    trace_id: str              # minted at intake, restored on every resume so audit rows line up
    thread_id: str             # the checkpoint thread, also the approvals record key
    decision: dict[str, Any]
    research: dict[str, Any]
    proposal: dict[str, Any]
    policy_block: str
    approval: dict[str, Any]
    execution: dict[str, Any]
    report: str
    status: str


def _ident(state: TeamState) -> Identity:
    d = state["identity"]
    return Identity(user_id=d["user_id"], role=d["role"], access=tuple(d["access"]))


# ---- nodes ---------------------------------------------------------------

def supervisor_node(state: TeamState) -> dict:
    messages = [
        SystemMessage(content="You are the supervisor of an operations copilot. Classify the request. " + prompts.CONTEXT_POLICY),
        HumanMessage(content=f"Request: {state['request']}"),
    ]
    with span("supervisor", logger):
        d = structured(SupervisorDecision, messages, step="supervise")
    log(logger, "supervisor decision", intent=d.intent, shipment=d.shipment_id)
    if d.intent == "reroute_shipment":
        # The same gate every tool goes through: a role that may not propose a
        # re-route gets an answer about the shipment, not a proposal.
        try:
            authorize_tool(_ident(state), "propose_reroute")
        except PolicyDenied as e:
            db.record_audit(_ident(state).user_id, "tool_denied", {"tool": "propose_reroute", "reason": str(e)})
            return {"decision": {**d.model_dump(), "intent": "answer_question"}, "policy_block": f"Policy denied: {e}. Answering instead."}
    return {"decision": d.model_dump()}


def research_node(state: TeamState) -> dict:
    """Reuse the stage A graph as the research worker. Its contract: question +
    identity in, answer + evidence + tool results + citations out."""
    question = state["request"]
    sid = state.get("decision", {}).get("shipment_id")
    if state["decision"]["intent"] == "reroute_shipment" and sid:
        question = f"What is the status of {sid}, is it eligible for re-routing under the SOP, and who must approve a re-route to a different carrier?"
    with span("research", logger):
        out = build_rag_graph().invoke({"question": question, "identity": _ident(state)}, config={"recursion_limit": 20})
    return {"research": {k: out.get(k) for k in ("answer", "evidence", "tool_results", "citations", "evaluation", "stopped_by")}}


def policy_node(state: TeamState) -> dict:
    """Policy-as-runtime. Every rule here traces to a section of SOP-OPS-014 or
    POL-CAR-007, and the outcome does not depend on the model."""
    sid = state["decision"].get("shipment_id", "")
    shipment = db.get_shipment(sid) if sid else None
    if shipment is None:
        return {"policy_block": f"No shipment named in the request or shipment {sid!r} not found.", "status": "blocked"}
    if shipment["status"] == "delivered":
        return {"policy_block": f"{sid} is already delivered; nothing to re-route.", "status": "blocked"}
    if shipment["status"] == "out_for_delivery":
        return {"policy_block": f"{sid} is out for delivery; SOP-OPS-014 §1 forbids re-routing it.", "status": "blocked"}

    open_req = db.open_reroute_for_shipment(sid)
    if open_req:
        what = "a pending approval" if open_req["kind"] == "pending_approval" else "committed re-route request"
        return {"policy_block": f"{sid} already has {what} {open_req['id']}; raise a new one only after it is decided or cancelled (SOP-OPS-014 §5).", "status": "blocked"}

    disrupted = shipment["carrier_disruption"] is not None
    # SOP-OPS-014 §1 grounds, checked in the order the SOP lists them. A breached
    # shipment has no window left to deliver inside, so SLA alone is not grounds
    # once it is breached; a carrier disruption still is.
    if disrupted:
        reason = "RR-01"
    elif shipment["sla_state"] == "at_risk":
        reason = "RR-02"
    elif shipment["sla_state"] == "breached":
        return {"policy_block": f"{sid} has already breached its SLA window and its carrier has no open disruption, so SOP-OPS-014 §1 gives no grounds to re-route; escalate under GDE-OPS-003 instead.", "status": "blocked"}
    else:
        return {"policy_block": f"{sid} is on track and its carrier has no open disruption, so SOP-OPS-014 §1 gives no grounds to re-route.", "status": "blocked"}

    alternates = [c for c in db.active_carriers_for_lane(shipment["lane"]) if c["code"] != shipment["carrier_code"]]
    if not alternates:
        return {"policy_block": f"No alternate carrier is active on {shipment['lane']} that is off performance review and undisrupted (POL-CAR-007 §2).", "status": "blocked"}
    target = alternates[0]

    approvers = reroute_approver_roles(shipment["declared_value_inr"], bool(shipment["cold_chain"]))
    key = hashlib.sha256(f"{sid}|{target['code']}|{reason}|{trace_id()}".encode()).hexdigest()[:24]

    # The model writes the justification from the research worker's evidence.
    ev = state.get("research", {}).get("evidence", [])
    ev_text = "\n\n".join(f"[{c['citation']}] {c['body']}" for c in ev) or "(none)"
    messages = [
        SystemMessage(content="Write a two or three sentence justification for a shipment re-route, citing the evidence ids in square brackets. " + prompts.CONTEXT_POLICY),
        HumanMessage(content=f"EVIDENCE:\n{ev_text}\n\nFACTS (from the tracking system): shipment {sid}, tier {shipment['tier']}, sla_state {shipment['sla_state']}, "
                             f"carrier {shipment['carrier_code']} (disruption: {disrupted}, on review: {bool(shipment['carrier_on_review'])}), declared value {shipment['declared_value_inr']} INR, "
                             f"cold chain {bool(shipment['cold_chain'])}. Proposed: move to {target['code']} with reason code {reason}. Required approver roles: {sorted(approvers)}."),
    ]
    with span("policy.justify", logger):
        reply = chat_model().invoke(messages)
    record_usage(reply, step="policy.justify")
    proposal = RerouteProposal(
        shipment_id=sid, from_carrier=shipment["carrier_code"], to_carrier=target["code"], reason_code=reason,
        declared_value_inr=shipment["declared_value_inr"], cold_chain=bool(shipment["cold_chain"]),
        sla_state=shipment["sla_state"], approver_roles=sorted(approvers),
        required_approvals=reroute_required_approvals(bool(shipment["cold_chain"])), idempotency_key=key,
        justification=str(reply.content).strip(), citations=[c["citation"] for c in ev],
    )
    db.record_audit(_ident(state).user_id, "reroute_proposed", proposal.model_dump())
    return {"proposal": proposal.model_dump(), "status": "awaiting_approval"}


class GateError(RuntimeError):
    """Raised by the gate when a resume value is not a valid decision. The
    checkpoint stays at the gate, so the request remains pending."""


def approval_node(state: TeamState, config: RunnableConfig) -> dict:
    """Pause here. The interrupt payload is what the approver sees; the resume
    value is their decision. Both are persisted by the checkpointer. On resume
    LangGraph re-runs this node from the top, so the row insert is idempotent.

    The role check here is the last line of defence; the API and CLI check the
    same thing before resuming. Either way an invalid decision does not close
    the gate: it is audited as a denied attempt and the request stays pending."""
    proposal = state["proposal"]
    thread = config["configurable"]["thread_id"]
    requester = _ident(state).user_id
    required = proposal.get("required_approvals", 1)
    db.create_approval(thread, proposal, requester, set(proposal["approver_roles"]), required)
    APPROVALS_PENDING.set(db.pending_approval_count())
    decision = interrupt({"type": "approval_required", "proposal": proposal, "required_approvals": required})
    # ---- resumed ----
    by_role = decision.get("role", "")
    by_user = decision.get("user", "")
    verdict = decision.get("decision", "")
    existing = db.get_approval(thread) or {}
    problem = validate_decision(proposal, requester, by_user, by_role, verdict, existing.get("signatures", []))
    if problem:
        db.record_audit(by_user, "approval_denied", {"thread_id": thread, "role": by_role, "reason": problem})
        APPROVAL_DECISIONS.labels(decision="denied").inc()
        raise GateError(problem)
    note = decision.get("note", "")
    if verdict == "reject":
        if not db.decide_approval(thread, "rejected", by_user):
            raise GateError("approval is no longer pending")
        APPROVALS_PENDING.set(db.pending_approval_count())
        APPROVAL_DECISIONS.labels(decision="reject").inc()
        db.record_audit(by_user, "approval_reject", {"thread_id": thread, "role": by_role, "note": note})
        return {"approval": {"decision": "reject", "user": by_user, "role": by_role, "note": note}, "status": "rejected"}
    sigs = db.add_signature(thread, by_user, by_role)
    db.record_audit(by_user, "approval_signed", {"thread_id": thread, "role": by_role, "note": note, "signatures": len(sigs), "required": required})
    if len(sigs) < required:
        # Two-person rule (cold chain): keep the gate open for the second signer.
        raise GateError(f"{len(sigs)} of {required} approvals recorded; awaiting another approver from {proposal['approver_roles']}")
    signers = ",".join(s["user"] for s in sigs)
    roles = ",".join(s["role"] for s in sigs)
    if not db.decide_approval(thread, "approved", signers):
        raise GateError("approval is no longer pending")
    APPROVALS_PENDING.set(db.pending_approval_count())
    APPROVAL_DECISIONS.labels(decision="approve").inc()
    db.record_audit(by_user, "approval_approve", {"thread_id": thread, "signers": signers, "roles": roles})
    return {"approval": {"decision": "approve", "user": signers, "role": roles, "note": note, "signatures": sigs}, "status": "approved"}


def validate_decision(proposal: dict[str, Any], requester: str, by_user: str, by_role: str, verdict: str,
                      signatures: list[dict[str, str]] | None = None) -> str | None:
    """Return a reason the decision is invalid, or None if it is acceptable."""
    if verdict not in ("approve", "reject"):
        return f"decision must be approve or reject, got {verdict!r}"
    if by_role not in proposal["approver_roles"]:
        return f"role {by_role!r} is not an allowed approver (needs one of {proposal['approver_roles']})"
    if by_user == requester:
        return "requester may not approve their own request (separation of duties)"
    for sig in signatures or []:
        if sig["user"] == by_user:
            return f"{by_user} has already signed this request"
        if proposal.get("required_approvals", 1) > 1 and sig["role"] == by_role:
            return f"a {by_role} has already signed; the second approval must come from a different role"
    return None


def execute_node(state: TeamState) -> dict:
    """Commit through the governed API. On failure the audit row is written and
    the exception propagates, which leaves the checkpoint on this node so that
    retry_request re-runs exactly this step and nothing before it."""
    p = state["proposal"]
    a = state["approval"]
    if settings.actions_disabled:
        # Kill switch (Module 1: constrained autonomy zone). Approved requests
        # wait at this node; flip the flag and retry to release them.
        db.record_audit("system", "action_blocked_kill_switch", {"idempotency_key": p["idempotency_key"]})
        raise business_client.BusinessApiError("actions are disabled by the ACTIONS_DISABLED kill switch")
    with span("execute", logger):
        try:
            result = business_client.create_reroute(
                shipment_id=p["shipment_id"], new_carrier_code=p["to_carrier"], reason_code=p["reason_code"],
                requested_by=_ident(state).user_id, approved_by=a["user"], approver_role=a["role"],
                idempotency_key=p["idempotency_key"], approval_thread_id=state.get("thread_id", ""),
            )
        except business_client.BusinessApiError as e:
            db.record_audit(_ident(state).user_id, "reroute_failed", {"error": str(e), "idempotency_key": p["idempotency_key"]})
            raise
    if not result.get("replayed"):
        SUCCESSFUL_ACTIONS.inc()
    return {"execution": {"ok": True, **result}, "status": "committed"}


def report_node(state: TeamState) -> dict:
    st = state.get("status", "answered")
    if state["decision"]["intent"] == "answer_question":
        prefix = (state["policy_block"] + "\n\n") if state.get("policy_block") else ""
        return {"report": prefix + state["research"]["answer"], "status": "answered"}
    lines = [f"Outcome: {st}."]
    if state.get("policy_block"):
        lines.append(state["policy_block"])
    if state.get("proposal"):
        p = state["proposal"]
        lines.append(f"Proposal: move {p['shipment_id']} from {p['from_carrier']} to {p['to_carrier']} ({p['reason_code']}); approvers {p['approver_roles']}.")
        lines.append(p["justification"])
    if state.get("approval"):
        a = state["approval"]
        lines.append(f"Decision: {a['decision']} by {a['user']} ({a['role']}). {a.get('note','')}".strip())
    if state.get("execution"):
        e = state["execution"]
        lines.append(f"Execution: {'request ' + str(e.get('request_id')) + ' ' + e.get('status', '') if e.get('ok') else 'failed: ' + e.get('error', '')}"
                     + (" (replayed, no second booking)" if e.get("replayed") else ""))
    lines.append(f"Trace: {trace_id()}")
    return {"report": "\n".join(lines), "status": st}


def route_after_research(state: TeamState) -> Literal["policy_worker", "report_writer"]:
    return "policy_worker" if state["decision"]["intent"] == "reroute_shipment" else "report_writer"


def route_after_policy(state: TeamState) -> Literal["approval_gate", "report_writer"]:
    return "approval_gate" if state.get("proposal") else "report_writer"


def route_after_approval(state: TeamState) -> Literal["execute_worker", "report_writer"]:
    return "execute_worker" if state.get("approval", {}).get("decision") == "approve" else "report_writer"


# ---- graph + checkpointer ------------------------------------------------

def _traced(fn):
    """Restore the request's trace id before a node runs. A resume or retry
    happens in a fresh process with a fresh context, and without this the
    approval and execution audit rows would carry a different trace."""
    import functools, inspect

    wants_config = "config" in inspect.signature(fn).parameters

    @functools.wraps(fn)
    def inner(state, config=None):
        if state.get("trace_id"):
            set_trace_id(state["trace_id"])
        return fn(state, config) if wants_config else fn(state)
    return inner


def build_team_graph(checkpointer=None):
    # Node names must not collide with state keys, hence the _worker suffixes.
    g = StateGraph(TeamState)
    for name, fn in [("supervise", supervisor_node), ("research_worker", research_node), ("policy_worker", policy_node),
                     ("approval_gate", approval_node), ("execute_worker", execute_node), ("report_writer", report_node)]:
        g.add_node(name, _traced(fn))
    g.set_entry_point("supervise")
    g.add_edge("supervise", "research_worker")
    g.add_conditional_edges("research_worker", route_after_research, {"policy_worker": "policy_worker", "report_writer": "report_writer"})
    g.add_conditional_edges("policy_worker", route_after_policy, {"approval_gate": "approval_gate", "report_writer": "report_writer"})
    g.add_conditional_edges("approval_gate", route_after_approval, {"execute_worker": "execute_worker", "report_writer": "report_writer"})
    g.add_edge("execute_worker", "report_writer")
    g.add_edge("report_writer", END)
    return g.compile(checkpointer=checkpointer or sqlite_checkpointer())


_checkpointer: SqliteSaver | None = None


def sqlite_checkpointer() -> SqliteSaver:
    """One connection per process, WAL so several pods on one volume can
    read while one writes, and a generous busy timeout."""
    global _checkpointer
    if _checkpointer is None:
        con = sqlite3.connect(settings.checkpoint_path, check_same_thread=False, timeout=30)
        con.execute("PRAGMA journal_mode=WAL")
        _checkpointer = SqliteSaver(con)
    return _checkpointer


def _identity_payload(identity: Identity) -> dict[str, Any]:
    return {"user_id": identity.user_id, "role": identity.role, "access": list(identity.access)}


def start_request(request: str, identity: Identity, thread_id: str) -> dict[str, Any]:
    """Run until the graph either finishes or pauses at the approval gate."""
    graph = build_team_graph()
    cfg = {"configurable": {"thread_id": thread_id}, "recursion_limit": 30}
    with span("team.total", logger):
        graph.invoke({"request": request, "trace_id": trace_id(), "thread_id": thread_id, "identity": _identity_payload(identity)}, config=cfg)
    return snapshot(graph, cfg)


def resume_request(thread_id: str, decision: dict[str, Any]) -> dict[str, Any]:
    """Apply a human decision. Pre-checks mirror the gate's own validation so a
    bad decision is refused before any model or graph work happens."""
    approval = db.get_approval(thread_id)
    if approval is None:
        raise LookupError(f"no approval for thread {thread_id}")
    if approval["status"] != "pending":
        raise ValueError(f"approval already {approval['status']}")
    problem = validate_decision(approval["proposal"], approval["requested_by"],
                                decision.get("user", ""), decision.get("role", ""), decision.get("decision", ""),
                                approval.get("signatures", []))
    if problem:
        db.record_audit(decision.get("user", ""), "approval_denied", {"thread_id": thread_id, "role": decision.get("role"), "reason": problem})
        APPROVAL_DECISIONS.labels(decision="denied").inc()
        raise PolicyDenied(problem)
    graph = build_team_graph()
    cfg = {"configurable": {"thread_id": thread_id}, "recursion_limit": 30}
    with span("team.resume", logger):
        try:
            graph.invoke(Command(resume=decision), config=cfg)
        except GateError as e:
            log(logger, "gate still open", thread_id=thread_id, reason=str(e))
        except business_client.BusinessApiError as e:
            log(logger, "execute failed, checkpoint retained", thread_id=thread_id, error=str(e))
    return snapshot(graph, cfg)


def retry_request(thread_id: str, actor: str = "system") -> dict[str, Any]:
    """Re-run from the last checkpoint after a crash or a failed execute.
    Nothing is re-asked of the model or the human; only the failed step runs.
    A request waiting at the approval gate is not retryable: it needs a
    decision, and re-invoking would replay the last (rejected) resume value."""
    graph = build_team_graph()
    cfg = {"configurable": {"thread_id": thread_id}, "recursion_limit": 30}
    state = graph.get_state(cfg)
    if not state.next:
        raise ValueError("nothing to retry: request has no pending step")
    if any(getattr(t, "interrupts", ()) for t in state.tasks):
        raise ValueError("request is awaiting an approval decision, not a retry")
    db.record_audit(actor, "retry_requested", {"thread_id": thread_id, "step": state.next[0]})
    with span("team.retry", logger):
        try:
            graph.invoke(None, config=cfg)
        except business_client.BusinessApiError as e:
            log(logger, "retry failed, checkpoint retained", thread_id=thread_id, error=str(e))
    return snapshot(graph, cfg)


def snapshot(graph, cfg, viewer: Identity | None = None) -> dict[str, Any]:
    """State for a caller. Evidence bodies outside the viewer's access labels
    are removed, so a request's checkpoint can never show a reader a document
    the retrieval filter would have hidden from them."""
    s = graph.get_state(cfg)
    pending = [i.value for t in s.tasks for i in getattr(t, "interrupts", ())]
    vals = {k: v for k, v in s.values.items() if k != "identity"}
    if viewer is not None and vals.get("research", {}).get("evidence"):
        allowed = set(viewer.access)
        vals["research"] = {**vals["research"], "evidence": [c for c in vals["research"]["evidence"] if c.get("access") in allowed]}
    approval = db.get_approval(cfg["configurable"]["thread_id"])
    if approval:
        vals["signatures"] = approval["signatures"]
        vals["required_approvals"] = approval["required_approvals"]
    failed_step = s.next[0] if s.next and not pending else None
    if failed_step and vals.get("status") in ("approved",):
        vals["status"] = "execute_failed"
    return {"thread_id": cfg["configurable"]["thread_id"], "paused": bool(pending), "interrupt": pending[0] if pending else None,
            "next_step": failed_step, "state": vals}
