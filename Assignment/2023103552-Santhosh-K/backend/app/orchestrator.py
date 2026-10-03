"""Bounded workflow coordinator.

The functions map 1:1 to LangGraph nodes. This implementation stays runnable without a
model key; a production deployment can compile these nodes with StateGraph and persist
its checkpoint state in PostgreSQL.
"""
from time import perf_counter
from typing import Any

from .agents import classify, investigate, response_for, trace
from .config import MAX_WORKFLOW_STEPS
from .store import audit, order_for_customer, policy_for


def run_workflow(customer: dict, order_id: str, message: str) -> dict[str, Any]:
    started = perf_counter()
    traces: list[dict] = []

    def add(agent: str, outcome: str, **details: Any) -> None:
        if len(traces) >= MAX_WORKFLOW_STEPS:
            raise RuntimeError("Workflow step budget exhausted")
        traces.append(trace(agent, outcome, **details))

    classification = classify(message)
    add("Query Classifier", "classified", **classification)
    if classification["unsafe"]:
        reason = "The request contained instructions that must be reviewed safely."
        return _result("ESCALATED", classification, None, reason, traces, started)
    if classification["issue_type"] == "unknown":
        return _result("ESCALATED", classification, None, "We could not confidently classify this request.", traces, started)

    # Tool access is server-side and customer scoped; a model cannot choose another customer ID.
    order = order_for_customer(order_id, customer["id"])
    policy = policy_for(classification["issue_type"])
    add("Information Retrieval", "retrieved", order_found=bool(order), policy_found=bool(policy))
    audit(customer["id"], "tool.order_policy_lookup", metadata={"order_id": order_id, "success": bool(order and policy)})

    finding = investigate(order, policy)
    add("Investigation", "checked", **finding)
    if finding.get("needs_information"):
        return _result("NEEDS_INFORMATION", classification, None, finding["reason"], traces, started)
    if finding.get("escalate"):
        return _result("ESCALATED", classification, None, finding["reason"], traces, started)

    action = classification["requested_action"]
    # Replacements and refunds always terminate at a human-gated state.
    sensitive = action in {"replacement", "refund"}
    status = "PENDING_APPROVAL" if sensitive else "RESOLVED"
    add("Resolution", "proposal_created", action=action, requires_human_approval=sensitive)
    return _result(status, classification, action, finding["reason"], traces, started)


def _result(status: str, classification: dict, action: str | None, reason: str, traces: list[dict], started: float) -> dict[str, Any]:
    traces.append(trace("Response Generator", "response_prepared", status=status))
    return {
        "status": status,
        "issue_type": classification["issue_type"],
        "proposed_action": action,
        "customer_response": response_for(status, action, reason),
        "traces": traces,
        "workflow_duration_ms": round((perf_counter() - started) * 1000, 2),
    }
