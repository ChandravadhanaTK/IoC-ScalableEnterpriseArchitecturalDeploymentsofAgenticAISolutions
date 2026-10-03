"""
Incident Agent
==============
Takes the user's free-text incident report and extracts structured data
using a JSON response from the LLM, then coerces values into the expected
schema so the workflow doesn't fail when the model returns a string for a
numeric field.
"""
import json
import re

from llm import get_llm


def _coerce_people_at_risk(value) -> int:
    if isinstance(value, int):
        return max(0, value)
    if isinstance(value, float):
        return max(0, int(value))
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return 0
        digits = re.findall(r"-?\d+", text)
        if digits:
            return max(0, int(digits[0]))
        if text.lower() in {"none", "unknown", "n/a", "na"}:
            return 0
    return 0


def _normalize_severity(value: str) -> str:
    if not isinstance(value, str):
        return "medium"
    text = value.strip().lower()
    if any(term in text for term in ["critical", "life-threatening", "imminent"]):
        return "critical"
    if any(term in text for term in ["high", "severe", "major", "urgent"]):
        return "high"
    if any(term in text for term in ["low", "minor", "minor injury"]):
        return "low"
    if "medium" in text or "moderate" in text:
        return "medium"
    return "medium"


def _normalize_incident_type(value: str) -> str:
    if not isinstance(value, str):
        return "other"
    text = value.strip().lower()
    if "fire" in text or "smoke" in text or "flames" in text:
        return "fire"
    if "medical" in text or "injury" in text or "burn" in text or "unconscious" in text:
        return "medical"
    if "flood" in text or "water" in text or "drowning" in text:
        return "flood"
    if "accident" in text or "collision" in text or "crash" in text:
        return "accident"
    if "chemical" in text or "hazmat" in text or "spill" in text:
        return "chemical"
    if "rescue" in text or "trapped" in text or "stuck" in text:
        return "rescue"
    return text or "other"


def _parse_incident_result(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    payload = json.loads(cleaned)

    return {
        "location": str(payload.get("location", "") or "").strip() or "unknown",
        "incident_type": _normalize_incident_type(str(payload.get("incident_type", "") or "").strip()),
        "severity": _normalize_severity(str(payload.get("severity", "") or "").strip()),
        "people_at_risk": _coerce_people_at_risk(payload.get("people_at_risk", 0)),
    }


def incident_agent(state: dict) -> dict:
    """
    Node function for LangGraph.
    Input: state containing 'report'
    Output: updated state with location, incident_type, severity, people_at_risk
    """
    llm = get_llm(temperature=0.0)

    prompt = f"""
You are a professional emergency incident analyst. Read the report below and
extract the required data accurately.
If a piece of information is not explicitly stated, infer your best estimate from context.
Return ONLY a valid JSON object with exactly these fields:
{{"location": "...", "incident_type": "...", "severity": "...", "people_at_risk": 0}}

Report:
\"\"\"{state['report']}\"\"\"
"""

    response = llm.invoke(prompt)
    result = _parse_incident_result(response.content)

    trace = state.get("trace", [])
    trace.append("Incident Agent: successfully extracted incident data")

    return {
        "location": result["location"],
        "incident_type": result["incident_type"],
        "severity": result["severity"],
        "people_at_risk": result["people_at_risk"],
        "trace": trace,
    }
