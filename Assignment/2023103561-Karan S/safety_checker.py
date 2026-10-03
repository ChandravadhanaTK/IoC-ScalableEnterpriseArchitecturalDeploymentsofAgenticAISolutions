"""
Safety Checker
==============
A final guardrail layer before producing the action plan. Verifies the
decision is proportional to the severity (e.g. a "critical" incident
should not be handled with a single unit only). If an issue is found,
it flags it instead of stopping the system.
"""
from llm import get_llm


def safety_checker(state: dict) -> dict:
    trace = state.get("trace", [])
    severity = state.get("severity", "medium").lower()
    resources = state.get("resources", {})

    issues = []

    # Explicit deterministic safety rules - faster and more reliable than
    # relying on the LLM alone
    if severity == "critical" and resources.get("ambulance_units", 0) < 2:
        issues.append("Insufficient ambulance units for a critical severity incident")

    if state.get("people_at_risk", 0) > 5 and resources.get("ambulance_units", 0) < 2:
        issues.append("Number of people at risk is high relative to dispatched ambulance units")

    if "fire" in state.get("incident_type", "") and severity in {"high", "critical"} and resources.get("fire_units", 0) < 1:
        issues.append("High-severity fire incident requires at least one fire truck")

    if state.get("people_at_risk", 0) > 10 and resources.get("total_units", 0) < 3:
        issues.append("More response units are required for a large-scale incident")

    if not resources.get("available", True):
        issues.append("Dispatch resources are not currently available")

    safety_ok = len(issues) == 0

    # Additional LLM-based review of the decision text itself (optional,
    # but adds a second safety layer)
    llm = get_llm(temperature=0.0)
    review_prompt = f"""
Review the following decision from a safety standpoint only, and answer with
one word: "safe" or "unsafe", plus a very short reason if unsafe.

Decision:
{state.get('decision')}
"""
    review = llm.invoke(review_prompt).content.strip()

    if "unsafe" in review.lower():
        safety_ok = False
        issues.append(f"AI review: {review}")

    safety_notes = "Everything checks out and complies with protocol." if safety_ok else " | ".join(issues)

    trace.append(
        f"Safety Checker: {'verification passed' if safety_ok else 'issues detected and flagged'}"
    )

    return {"safety_ok": safety_ok, "safety_notes": safety_notes, "trace": trace}
