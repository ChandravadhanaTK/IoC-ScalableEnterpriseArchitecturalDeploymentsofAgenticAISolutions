"""Application service layer - framework-independent use cases.

The HTTP layer (main.py) is a thin adapter over this class, which keeps the
business logic unit-testable without a web server and portable to other
channels (Teams bot, Slack app, email ingestion).
"""
from __future__ import annotations

import logging
import time

from .agents.nodes import AgentContext, build_graph, is_unresolved_followup
from .db import Store
from .llm import build_llm
from .monitoring.metrics import METRICS
from .monitoring.tracing import Tracer
from .security.auth import DEMO_USERS, PermissionDenied, Principal, principal_for
from .tools import registry

log = logging.getLogger("servicedesk.service")


class NotFound(Exception):
    pass


class Conflict(Exception):
    pass


class ServiceDesk:
    def __init__(self, store: Store, llm=None):
        self.store = store
        self.llm = llm or build_llm()
        self.graph = build_graph()

    # ----------------------------------------------------------------- chat flow
    def handle_message(self, principal: Principal, message: str, ticket_id: str | None = None) -> dict:
        principal.require("chat")
        t0 = time.perf_counter()
        if ticket_id:
            ticket = self._ticket_for(principal, ticket_id)
            prev = ticket["state"]
            if ticket["status"] == "AWAITING_APPROVAL":
                self.store.add_message(ticket_id, "user", message)
                reply = ("This request is still waiting for approval "
                         f"({prev.get('pending_approval', {}).get('id', '')}). I'll update you as soon as "
                         "the approver decides.")
                self.store.add_message(ticket_id, "assistant", reply)
                return self._response(ticket_id, prev, reply, None)
            state = self._fresh_state(ticket_id, principal, message)
            state["prior_summary"] = (prev.get("triage") or {}).get("summary")
            state["category"], state["priority"] = prev.get("category"), prev.get("priority")
            state["triage"] = prev.get("triage")
            state["kb_hits"] = prev.get("kb_hits", [])
            state["followup_unresolved"] = is_unresolved_followup(message)
            state["turn"] = prev.get("turn", 1) + 1
        else:
            state = {}
            ticket_id = self.store.create_ticket(principal.username, state)
            state = self._fresh_state(ticket_id, principal, message)
            self.store.audit(principal.username, "ticket.created", ticket_id, {})

        tracer = Tracer()
        ctx = AgentContext(principal=principal, llm=self.llm, store=self.store, tracer=tracer)
        state["trace_id"] = tracer.trace_id
        # Store only the redacted text in the transcript; raw text never persists.
        state = self.graph.run(state, ctx)
        self.store.add_message(ticket_id, "user", state.get("redacted_message") or "[blocked message]")
        self.store.add_message(ticket_id, "assistant", state["reply"])
        self._persist(ticket_id, state, ctx, tracer)
        METRICS.observe("request_latency_ms", (time.perf_counter() - t0) * 1000, {"route": "chat"},
                        help="End-to-end chat latency")
        return self._response(ticket_id, state, state["reply"], tracer.trace_id)

    def _fresh_state(self, ticket_id: str, principal: Principal, message: str) -> dict:
        return {"ticket_id": ticket_id, "requester": principal.username, "message": message,
                "turn": 1, "history": [], "errors": [], "plan": [], "tool_results": []}

    def _persist(self, ticket_id: str, state: dict, ctx: AgentContext, tracer: Tracer) -> None:
        state.pop("message", None)  # raw (unredacted) input is never persisted
        outcome = state.get("outcome", "unknown")
        self.store.save_ticket(ticket_id, state=state, status=state.get("status", "OPEN"),
                               category=state.get("category"), priority=state.get("priority"),
                               resolution=state.get("resolution"),
                               summary=(state.get("triage") or {}).get("summary")
                               or (state.get("redacted_message") or "")[:90])
        self.store.save_trace(trace_id=tracer.trace_id, ticket_id=ticket_id, spans=tracer.spans,
                              total_ms=tracer.total_ms, input_tokens=ctx.usage["input_tokens"],
                              output_tokens=ctx.usage["output_tokens"], cost_usd=ctx.usage["cost_usd"],
                              outcome=outcome)
        METRICS.inc("tickets_outcome_total", {"outcome": outcome,
                                              "category": state.get("category") or "none"},
                    help="Agent run outcomes")

    @staticmethod
    def _response(ticket_id: str, state: dict, reply: str, trace_id: str | None) -> dict:
        return {
            "ticket_id": ticket_id,
            "trace_id": trace_id,
            "reply": reply,
            "status": state.get("status"),
            "outcome": state.get("outcome"),
            "category": state.get("category"),
            "priority": state.get("priority"),
            "confidence": (state.get("triage") or {}).get("confidence"),
            "approval": state.get("pending_approval") if state.get("status") == "AWAITING_APPROVAL" else None,
            "kb": [{"id": h["id"], "title": h["title"]} for h in state.get("kb_hits", [])[:3]],
            "guardrails": state.get("guardrails"),
            "path": [h["node"] for h in state.get("history", [])],
        }

    # -------------------------------------------------------------------- tickets
    def _ticket_for(self, principal: Principal, ticket_id: str) -> dict:
        t = self.store.get_ticket(ticket_id)
        if not t:
            raise NotFound("ticket not found")
        if t["requester"] != principal.username and not principal.can("tickets:read:all"):
            raise NotFound("ticket not found")  # don't leak existence of others' tickets
        return t

    def list_tickets(self, principal: Principal, scope: str = "mine") -> list[dict]:
        if scope == "all":
            principal.require("tickets:read:all")
            return self.store.list_tickets()
        return self.store.list_tickets(requester=principal.username)

    def get_ticket(self, principal: Principal, ticket_id: str) -> dict:
        t = self._ticket_for(principal, ticket_id)
        t["messages"] = self.store.get_messages(ticket_id)
        t["traces"] = self.store.traces_for_ticket(ticket_id)
        st = t.pop("state")
        t["triage"] = st.get("triage")
        t["path"] = [h["node"] for h in st.get("history", [])]
        t["approval"] = st.get("pending_approval")
        t["handoff"] = st.get("handoff") if principal.can("tickets:read:all") else None
        return t

    def feedback(self, principal: Principal, ticket_id: str, rating: int) -> None:
        principal.require("feedback")
        t = self._ticket_for(principal, ticket_id)
        if t["requester"] != principal.username:
            raise PermissionDenied("only the requester can rate a ticket")
        if not 1 <= rating <= 5:
            raise ValueError("rating must be 1-5")
        self.store.set_csat(ticket_id, rating)
        METRICS.observe("csat_score", rating, buckets=(1, 2, 3, 4, 5), help="Requester satisfaction 1-5")
        self.store.audit(principal.username, "ticket.feedback", ticket_id, {"rating": rating})

    # ------------------------------------------------------------------ approvals
    def list_approvals(self, principal: Principal, status: str | None = "PENDING") -> list[dict]:
        principal.require("approvals:read")
        self._expire_stale()
        items = self.store.list_approvals(status)
        for a in items:
            spec = registry.TOOLS.get(a["tool"])
            a["tool_label"] = spec.label if spec else a["tool"]
            a["requester_name"] = DEMO_USERS.get(a["requested_by"], {}).get("name", a["requested_by"])
            a["can_decide"] = self._can_decide(principal, a)
        return items

    def _can_decide(self, principal: Principal, approval: dict) -> bool:
        if not principal.can("approvals:decide") or approval["status"] != "PENDING":
            return False
        if approval["requested_by"] == principal.username:
            return False  # separation of duties: nobody approves their own request
        return True

    def _expire_stale(self) -> None:
        now = time.time()
        for a in self.store.list_approvals("PENDING"):
            if a["expires_at"] < now and self.store.decide_approval(
                    a["id"], status="EXPIRED", decided_by="system", reason="approval window elapsed"):
                self.store.audit("system", "approval.expired", a["id"], {})
                METRICS.inc("approvals_decided_total", {"decision": "expired"})

    def decide_approval(self, principal: Principal, approval_id: str, approve: bool, reason: str = "") -> dict:
        principal.require("approvals:decide")
        a = self.store.get_approval(approval_id)
        if not a:
            raise NotFound("approval not found")
        if a["requested_by"] == principal.username:
            raise PermissionDenied("separation of duties: you cannot approve your own request")
        if a["expires_at"] < time.time():
            self.store.decide_approval(approval_id, status="EXPIRED", decided_by="system",
                                       reason="approval window elapsed")
            raise Conflict("approval expired")
        status = "APPROVED" if approve else "REJECTED"
        if not self.store.decide_approval(approval_id, status=status, decided_by=principal.username,
                                          reason=reason):
            raise Conflict("approval already decided")
        METRICS.inc("approvals_decided_total", {"decision": status.lower()}, help="Approval decisions")
        METRICS.observe("approval_wait_minutes", (time.time() - a["created_at"]) / 60,
                        buckets=(1, 5, 15, 30, 60, 120, 240), help="Time waiting for human approval")
        self.store.audit(principal.username, f"approval.{status.lower()}", approval_id,
                         {"tool": a["tool"], "ticket_id": a["ticket_id"], "reason": reason})
        return self._resume_after_decision(a, approve, reason, principal)

    def _resume_after_decision(self, approval: dict, approve: bool, reason: str,
                               approver: Principal) -> dict:
        ticket = self.store.get_ticket(approval["ticket_id"])
        state = ticket["state"]
        requester = principal_for(ticket["requester"])
        tracer = Tracer()
        ctx = AgentContext(principal=requester, llm=self.llm, store=self.store, tracer=tracer)
        state["trace_id"] = tracer.trace_id
        state.pop("pending_approval", None)
        if approve:
            for step in state.get("plan", []):
                if step.get("approval_id") == approval["id"]:
                    step["approved"] = True
                    step["approved_by"] = approver.username
            state["outcome"] = None
            start = "policy_gate"  # re-check remaining steps, then execute
        else:
            state["outcome"] = "approval_rejected"
            state["rejection_reason"] = reason
            start = "responder"
        state = self.graph.run(state, ctx, start=start)
        self.store.add_message(ticket["id"], "assistant", state["reply"])
        self._persist(ticket["id"], state, ctx, tracer)
        return self._response(ticket["id"], state, state["reply"], tracer.trace_id)

    # -------------------------------------------------------------- observability
    def get_trace(self, principal: Principal, trace_id: str) -> dict:
        tr = self.store.get_trace(trace_id)
        if not tr:
            raise NotFound("trace not found")
        if not principal.can("traces:read"):
            self._ticket_for(principal, tr["ticket_id"])  # requesters may view their own traces
        return tr

    def metrics_summary(self, principal: Principal, hours: int = 24) -> dict:
        principal.require("metrics:read")
        from .monitoring.dashboard import build_summary
        return build_summary(self.store, self.llm, hours)

    def audit_log(self, principal: Principal, limit: int = 200) -> dict:
        principal.require("audit:read")
        return {"entries": self.store.list_audit(limit), "integrity": self.store.verify_audit_chain()}
