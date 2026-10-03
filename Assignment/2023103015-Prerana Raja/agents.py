import itertools, time, uuid
from . import tools
from .monitoring import metrics
from .security import audit, is_injection, redact_pii


def classify(text: str) -> str:
    """Swap this rule-based classifier for an LLM call in production."""
    t = text.lower()
    if "password" in t and any(w in t for w in ("reset", "forgot", "locked", "change")):
        return "password_reset"
    if any(w in t for w in ("how do i", "how to", "setup", "set up", "connect")):
        return "how_to"
    if any(w in t for w in ("down", "not working", "error", "crash", "outage", "broken")):
        return "incident"
    return "unknown"


class Orchestrator:
    def __init__(self):
        self.pending = {}

    def handle(self, identity, message: str):
        start = time.perf_counter()
        trace = ["RECEIVED"]
        user = identity["user"]

        if is_injection(message):
            audit("blocked_injection", user=user)
            return self._finish("BLOCKED", start, trace,
                                reply="Request blocked by security guardrails.")

        clean = redact_pii(message)
        intent = classify(clean)
        trace.append(f"TRIAGED:{intent}")
        audit("triaged", user=user, intent=intent, message=clean)

        try:
            if intent == "how_to":
                article = tools.kb_search(clean)
                if article:
                    return self._finish("RESOLVED", start, trace, reply=article)
                return self._escalate(user, clean, start, trace, "No KB article found")
            if intent == "incident":
                ticket = tools.create_ticket(user, clean, priority="P2")
                return self._finish("RESOLVED", start, trace,
                                    reply=f"Incident logged as {ticket['ticket_id']}.", ticket=ticket)
            if intent == "password_reset":
                aid = uuid.uuid4().hex[:8]
                self.pending[aid] = {"user": user}
                trace.append("AWAITING_APPROVAL")
                audit("approval_requested", approval_id=aid, user=user)
                return self._finish("AWAITING_APPROVAL", start, trace, approval_id=aid,
                                    reply="Password reset needs IT admin approval.")
        except tools.ToolError as e:
            return self._escalate(user, clean, start, trace, f"Tool failure: {e}")
        return self._escalate(user, clean, start, trace, "Unrecognised request")

    def decide(self, approval_id, approve: bool, admin: str):
        req = self.pending.pop(approval_id, None)
        if not req:
            return None
        start = time.perf_counter()
        trace = ["AWAITING_APPROVAL"]
        audit("approval_decision", approval_id=approval_id, admin=admin, approve=approve)
        metrics.approvals["approved" if approve else "rejected"] += 1
        if not approve:
            return self._finish("REJECTED", start, trace, reply="Request rejected by IT admin.")
        try:
            msg = tools.reset_password(req["user"])
            return self._finish("DONE", start, trace, reply=msg)
        except tools.ToolError as e:
            return self._escalate(req["user"], "password reset", start, trace, str(e))

    def _escalate(self, user, text, start, trace, reason):
        audit("escalated", user=user, reason=reason)
        return self._finish("ESCALATED", start, trace,
                            reply="Handed off to a human agent.", reason=reason)

    def _finish(self, state, start, trace, **extra):
        trace.append(state)
        metrics.record(state, (time.perf_counter() - start) * 1000)
        return {"state": state, "trace": trace, **extra}


orchestrator = Orchestrator()
