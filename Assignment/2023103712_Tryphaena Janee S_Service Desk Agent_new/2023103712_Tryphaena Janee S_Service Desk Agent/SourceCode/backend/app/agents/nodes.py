"""The agents. Each is a node in the state graph with one clear responsibility.

  guardian    Guardrail Agent  - injection screening, PII/secret redaction
  triage      Triage Agent     - LLM classification (category, intent, priority, confidence)
  knowledge   Knowledge Agent  - KB retrieval + live service-status lookup
  planner     Resolver Agent   - deterministic plan of tool calls from intent + evidence
  policy_gate Approval Gate    - RBAC/scope checks, creates human approvals (interrupt)
  executor    Executor Agent   - runs tools with retries; failures route to escalation
  escalation  Escalation Agent - ITSM incident + structured handoff package
  responder   Responder Agent  - grounded reply via LLM, output guardrail, final status
  blocked     Safety refusal   - canned reply, never calls the LLM
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

from ..config import settings
from ..db import Store
from ..llm import LLMResult, cost_usd
from ..monitoring.metrics import METRICS
from ..monitoring.tracing import Tracer
from ..security.auth import DEMO_USERS, Principal
from ..security.guardrails import check_input, check_output
from ..tools import registry
from ..tools.integrations import CATALOG, ITSM
from .graph import END, StateGraph

KB_MIN_SCORE = 2.5          # absolute BM25 score for a "confident" KB answer
UNRESOLVED_PHRASES = ("didn't work", "did not work", "still not", "still doesn't", "still does not",
                      "not fixed", "no luck", "same issue", "still broken", "doesn't help",
                      "talk to a human", "speak to a human", "real person", "technician")


@dataclass
class AgentContext:
    principal: Principal
    llm: object
    store: Store
    tracer: Tracer
    usage: dict = field(default_factory=lambda: {"input_tokens": 0, "output_tokens": 0, "cost_usd": 0.0,
                                                 "llm_calls": 0, "fallbacks": 0})

    def llm_call(self, method: str, payload) -> LLMResult:
        with self.tracer.span(f"llm.{method}", kind="llm") as attrs:
            res: LLMResult = getattr(self.llm, method)(payload)
            c = cost_usd(res.input_tokens, res.output_tokens)
            attrs.update(model=res.model, input_tokens=res.input_tokens,
                         output_tokens=res.output_tokens, cost_usd=round(c, 6), fallback=res.fallback)
        self.usage["input_tokens"] += res.input_tokens
        self.usage["output_tokens"] += res.output_tokens
        self.usage["cost_usd"] += c
        self.usage["llm_calls"] += 1
        METRICS.inc("llm_tokens_total", {"direction": "input", "model": res.model}, res.input_tokens,
                    help="LLM tokens consumed")
        METRICS.inc("llm_tokens_total", {"direction": "output", "model": res.model}, res.output_tokens)
        METRICS.inc("llm_cost_usd_total", {"model": res.model}, c, help="Estimated LLM spend (USD)")
        METRICS.observe("llm_latency_ms", res.latency_ms, {"method": method}, help="LLM call latency")
        if res.fallback:
            self.usage["fallbacks"] += 1
            METRICS.inc("llm_fallbacks_total", {"method": method}, help="Calls served by rules fallback")
        return res

    def tool(self, name: str, args: dict, approved: bool = False) -> registry.ToolResult:
        with self.tracer.span(f"tool.{name}", kind="tool") as attrs:
            res = registry.execute(name, self.principal, args, max_retries=settings.tool_max_retries,
                                   approved=approved)
            attrs.update(ok=res.ok, attempts=res.attempts, error=res.error)
        METRICS.inc("tool_calls_total", {"tool": name, "ok": str(res.ok).lower()},
                    help="Tool invocations by outcome")
        if res.error and res.error.startswith("policy:"):
            METRICS.inc("policy_denials_total", {"tool": name}, help="Tool calls denied by policy")
        if name not in ("search_kb", "check_service_status"):
            self.store.audit(self.principal.username, f"tool.{name}", None,
                             {"ok": res.ok, "args": _safe_args(args), "error": res.error,
                              "approved": approved, "trace_id": self.tracer.trace_id})
        return res


def _safe_args(args: dict) -> dict:
    return {k: v for k, v in args.items() if k not in {"handoff"}}


# ------------------------------------------------------------------------- nodes
def guardian(state: dict, ctx: AgentContext) -> str:
    verdict = check_input(state["message"], settings.max_input_chars)
    state["guardrails"] = verdict.to_dict()
    state["redacted_message"] = verdict.redacted_text
    for label in verdict.pii_found + verdict.secrets_found:
        METRICS.inc("guardrail_redactions_total", {"type": label}, help="PII/secret redactions on input")
    if not verdict.allowed:
        METRICS.inc("guardrail_blocks_total", {"reason": verdict.reason or "unknown"},
                    help="Requests blocked by input guardrails")
        ctx.store.audit(ctx.principal.username, "guardrail.block", state["ticket_id"], verdict.to_dict())
        return "blocked"
    if state.get("followup_unresolved"):
        state["failure_reason"] = "requester reported the previous answer did not resolve the issue"
        return "escalation"
    return "triage"


def triage(state: dict, ctx: AgentContext) -> str:
    text = state["redacted_message"]
    if state.get("prior_summary"):
        text = f"(Earlier in this ticket: {state['prior_summary']})\n{text}"
    res = ctx.llm_call("triage", text)
    d = res.data
    state["triage"] = {k: d.get(k) for k in ("category", "intent", "priority", "confidence", "entities",
                                             "summary")}
    state["category"], state["priority"] = d["category"], d["priority"]
    METRICS.observe("triage_confidence_pct", d["confidence"] * 100, {"category": d["category"]},
                    buckets=(10, 20, 30, 40, 50, 60, 70, 80, 90, 100), help="Triage confidence")
    return "knowledge"


def knowledge(state: dict, ctx: AgentContext) -> str:
    t = state["triage"]
    kb = ctx.tool("search_kb", {"query": state["redacted_message"], "category": t["category"]})
    state["kb_hits"] = kb.output.get("hits", []) if kb.ok else []
    service = (t.get("entities") or {}).get("service")
    if not service and t["category"] == "network" and "vpn" in state["redacted_message"].lower():
        service = "vpn"
    if service:
        st = ctx.tool("check_service_status", {"service": service})
        state["service_status"] = st.output if st.ok else None
    top = state["kb_hits"][0]["score"] if state["kb_hits"] else 0.0
    METRICS.observe("kb_top_score", top * 10, buckets=(5, 10, 20, 30, 50, 80, 120),
                    help="Top KB BM25 score x10 (retrieval quality)")
    return "planner"


def planner(state: dict, ctx: AgentContext) -> str:
    t = state["triage"]
    intent, user = t["intent"], ctx.principal.username
    kb_ok = bool(state["kb_hits"]) and state["kb_hits"][0]["score"] >= KB_MIN_SCORE
    status = state.get("service_status") or {}
    if status.get("status") in ("degraded", "outage"):
        state["status_note"] = f"Heads-up: **{status['service'].upper()} is {status['status']}** - {status['note']}"
    plan: list[dict] = []

    if intent == "security_incident":
        state["failure_reason"] = "security incident - mandatory SOC handling"
        state["priority"] = "P1"
        return "escalation"
    if intent == "incident" or t["priority"] == "P1":
        state["failure_reason"] = "multi-user incident"
        return "escalation"
    if t["confidence"] < settings.triage_min_confidence and not kb_ok:
        state["failure_reason"] = "low triage confidence and no confident KB match"
        return "escalation"

    if intent == "unlock_account":
        plan.append({"tool": "unlock_account", "args": {"username": user}})
    elif intent == "reset_password":
        plan.append({"tool": "send_password_reset", "args": {"username": user},
                     "justification": "Requester reports a forgotten/expired password"})
    elif intent == "request_software":
        sw = (t.get("entities") or {}).get("software")
        item = CATALOG.lookup(sw or "")
        if not item:
            state["failure_reason"] = f"software '{sw}' is not in the catalog - needs Security review"
            return "escalation"
        if not item["allowed"]:
            METRICS.inc("policy_denials_total", {"tool": "assign_software"})
            state["outcome"] = "policy_denied"
            state["status_note"] = (f"**{item['label']}** can't be installed: {item['reason']} [KB-0009].")
            state["kb_hits"] = []
            return "responder"
        plan.append({"tool": "assign_software", "args": {"username": user, "software": sw},
                     "justification": f"Requester asked for {item['label']} ({item['license']} license)"})
    elif intent in ("how_to", "service_status", "unknown"):
        if not kb_ok and not state.get("status_note"):
            state["failure_reason"] = "no confident knowledge-base answer"
            return "escalation"
    state["plan"] = plan
    return "policy_gate" if plan else "responder"


def policy_gate(state: dict, ctx: AgentContext) -> str:
    for step in state["plan"]:
        spec = registry.TOOLS[step["tool"]]
        try:
            registry.authorize(spec, ctx.principal, step["args"])
        except registry.ToolPolicyError as exc:
            METRICS.inc("policy_denials_total", {"tool": spec.name})
            state["outcome"] = "policy_denied"
            state["status_note"] = f"I can't do that automatically: {exc}."
            return "responder"
        if registry.needs_approval(spec, ctx.principal, step["args"]) and not step.get("approved"):
            approver = registry.approver_for(spec, ctx.principal, step["args"])
            aid = ctx.store.create_approval(
                ticket_id=state["ticket_id"], tool=spec.name, args=step["args"], risk=spec.risk,
                justification=step.get("justification", ""), requested_by=ctx.principal.username,
                ttl_minutes=settings.approval_ttl_minutes)
            step["approval_id"] = aid
            approver_name = (DEMO_USERS.get(approver, {}).get("name", approver)
                             if approver in DEMO_USERS else f"an IT {approver}")
            state["pending_approval"] = {"id": aid, "tool": spec.name, "tool_label": spec.label,
                                         "risk": spec.risk, "approver": approver,
                                         "approver_hint": approver_name}
            state["outcome"] = "approval_pending"
            METRICS.inc("approvals_requested_total", {"tool": spec.name}, help="Human approvals requested")
            ctx.store.audit(ctx.principal.username, "approval.requested", aid,
                            {"tool": spec.name, "risk": spec.risk, "approver": approver,
                             "ticket_id": state["ticket_id"]})
            return "responder"
    return "executor"


def executor(state: dict, ctx: AgentContext) -> str:
    results = state.setdefault("tool_results", [])
    for step in state["plan"]:
        if step.get("done"):
            continue
        res = ctx.tool(step["tool"], step["args"], approved=bool(step.get("approved")))
        results.append(res.to_dict())
        if not res.ok:
            state["failure_reason"] = f"{step['tool']} failed after {res.attempts} attempt(s): {res.error}"
            return "escalation"
        step["done"] = True
    state["outcome"] = "auto_resolved"
    return "responder"


def escalation(state: dict, ctx: AgentContext) -> str:
    t = state.get("triage") or {}
    category = state.get("category") or t.get("category") or "other"
    priority = state.get("priority") or t.get("priority") or "P3"
    handoff = {
        "summary": t.get("summary") or state["redacted_message"][:120],
        "reason": state.get("failure_reason", "escalation requested"),
        "triage": t,
        "kb_tried": [h["id"] for h in state.get("kb_hits", [])],
        "tools_attempted": [{"tool": r["tool"], "ok": r["ok"], "error": r["error"]}
                            for r in state.get("tool_results", [])],
        "service_status": state.get("service_status"),
        "guardrails": state.get("guardrails"),
        "requester": ctx.principal.username,
    }
    res = ctx.tool("escalate_to_human", {"ticket_id": state["ticket_id"], "category": category,
                                         "priority": priority, "summary": handoff["summary"],
                                         "handoff": handoff})
    state["handoff"] = handoff
    state["escalation"] = res.output if res.ok else {"queue": ITSM.QUEUES.get(category, "Service Desk L2"),
                                                     "external_id": None, "degraded": True}
    state["outcome"] = "escalated"
    METRICS.inc("escalations_total", {"category": category, "reason": _reason_bucket(handoff["reason"])},
                help="Escalations to human teams")
    return "responder"


def _reason_bucket(reason: str) -> str:
    for key in ("security", "incident", "confidence", "knowledge", "failed", "catalog", "did not resolve",
                "internal"):
        if key in reason:
            return key.replace(" ", "_")
    return "other"


def responder(state: dict, ctx: AgentContext) -> str:
    outcome = state.get("outcome") or "auto_resolved"
    state["outcome"] = outcome
    context = {
        "first_name": ctx.principal.name.split()[0],
        "request": state["redacted_message"],
        "outcome": outcome,
        "triage": state.get("triage"),
        "kb_hits": [{"id": h["id"], "title": h["title"], "steps": h["steps"]}
                    for h in state.get("kb_hits", [])[:2]],
        "tool_results": [{"tool": r["tool"], "ok": r["ok"], "user_message": r.get("user_message", "")}
                         for r in state.get("tool_results", []) if r.get("ok")],
        "status_note": state.get("status_note"),
        "ticket_id": state["ticket_id"],
        "priority": state.get("priority"),
    }
    if outcome == "approval_pending":
        context["approval"] = state["pending_approval"]
    if outcome == "approval_rejected":
        context["reason"] = state.get("rejection_reason", "")
    if outcome == "escalated":
        context["queue"] = (state.get("escalation") or {}).get("queue", "Service Desk L2")
        if state.get("priority") == "P1" and state.get("triage", {}).get("intent") == "security_incident":
            context["kb_hits"] = [h for h in context["kb_hits"] if h["id"] == "KB-0011"]
    if outcome == "policy_denied":
        context["kb_hits"] = []
    res = ctx.llm_call("compose", context)
    reply, leaks = check_output(res.text)
    if leaks:
        METRICS.inc("guardrail_output_redactions_total", help="Redactions applied to model output")
        state.setdefault("guardrails", {})["output_redactions"] = leaks
    state["reply"] = reply
    state["status"], state["resolution"] = {
        "auto_resolved": ("RESOLVED", "auto_resolved"),
        "approval_pending": ("AWAITING_APPROVAL", None),
        "approval_rejected": ("CLOSED", "approval_rejected"),
        "escalated": ("ESCALATED", "escalated"),
        "policy_denied": ("CLOSED", "policy_denied"),
    }.get(outcome, ("RESOLVED", outcome))
    return END


def blocked(state: dict, ctx: AgentContext) -> str:
    reason = state["guardrails"].get("reason")
    if reason == "message_too_long":
        reply = (f"That message is too long for me to process (limit {settings.max_input_chars} "
                 "characters). Please summarise the issue or attach logs to a ticket.")
    elif reason == "empty_message":
        reply = "It looks like the message was empty - what can I help you with?"
    else:
        reply = ("I can't act on that request. I only help with IT support within company policy, "
                 "and actions like resets or access changes always go through the standard approval "
                 "process. If you have a genuine IT issue, please describe it and I'll help.")
    state.update(reply=reply, outcome="blocked", status="CLOSED", resolution="blocked_by_guardrail")
    return END


def build_graph() -> StateGraph:
    return StateGraph(
        nodes={"guardian": guardian, "triage": triage, "knowledge": knowledge, "planner": planner,
               "policy_gate": policy_gate, "executor": executor, "escalation": escalation,
               "responder": responder, "blocked": blocked},
        entry="guardian", failure_node="escalation", max_steps=settings.max_graph_steps)


def is_unresolved_followup(text: str) -> bool:
    low = text.lower()
    return any(p in low for p in UNRESOLVED_PHRASES)


def now() -> float:
    return time.time()
