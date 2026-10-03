"""Narrow, deterministic agent nodes. Their output is advisory; policy checks control actions."""
from datetime import datetime, timezone
from typing import Any

INJECTION_MARKERS = ("ignore previous", "system prompt", "developer message", "reveal your instructions", "bypass policy")


def classify(message: str) -> dict[str, Any]:
    normalized = message.lower()
    if any(marker in normalized for marker in INJECTION_MARKERS):
        return {"issue_type": "unsafe_request", "requested_action": "escalate", "priority": "high", "unsafe": True}
    if any(term in normalized for term in ("damaged", "broken", "cracked", "screen")):
        action = "replacement" if "replacement" in normalized or "replace" in normalized else "refund" if "refund" in normalized else "replacement"
        return {"issue_type": "damaged_product", "requested_action": action, "priority": "high", "unsafe": False}
    if any(term in normalized for term in ("late", "delay", "not delivered", "where is")):
        return {"issue_type": "delivery_delay", "requested_action": "status_update", "priority": "normal", "unsafe": False}
    return {"issue_type": "unknown", "requested_action": "escalate", "priority": "normal", "unsafe": False}


def investigate(order: dict | None, policy: dict | None) -> dict[str, Any]:
    if not order:
        return {"eligible": False, "reason": "We could not find that order for this account.", "needs_information": True}
    if not policy:
        return {"eligible": False, "reason": "No applicable policy was found.", "escalate": True}
    if order["purchased_days_ago"] > policy["window_days"]:
        return {"eligible": False, "reason": f"The report is outside the {policy['window_days']}-day policy window.", "escalate": True}
    if policy["requires_evidence"] and not order["evidence_received"]:
        return {"eligible": False, "reason": "Please upload clear photos of the damage so we can continue.", "needs_information": True}
    return {"eligible": True, "reason": "Order ownership, delivery date, evidence, and policy eligibility were verified."}


def response_for(status: str, action: str | None, reason: str) -> str:
    if status == "PENDING_APPROVAL":
        return f"We verified your request and proposed a {action}. An authorised support manager must approve it before we can finalise the outcome."
    if status == "NEEDS_INFORMATION":
        return f"We need one more detail before continuing: {reason}"
    if status == "ESCALATED":
        return f"Your case has been routed to a support specialist for review. {reason}"
    if status == "RESOLVED":
        return f"Your request is complete. {reason}"
    return f"Your request was not approved. {reason}"


def trace(agent: str, outcome: str, **details: Any) -> dict[str, Any]:
    return {"agent": agent, "outcome": outcome, "timestamp": datetime.now(timezone.utc), "details": details}
