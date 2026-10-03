"""
Evidence Verifier
=================
Checks the decision against the incident evidence, location data, available
resources, and referenced procedures to detect unsupported claims and prevent
hallucinations.
"""
import json
import re

from llm import get_llm


def _parse_json_response(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: try to extract the first JSON-like object block
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

    return {}


def evidence_verifier(state: dict) -> dict:
    llm = get_llm(temperature=0.0)
    trace = state.get("trace", [])

    prompt = f"""
You are an emergency verification officer. Review the proposed coordination
decision below and determine whether every recommendation is supported by the
incident evidence, the available resources, the location information, and the
approved procedures.

Return ONLY a JSON object with exactly these fields:
{{
  "evidence_check_ok": true|false,
  "evidence_summary": "...",
  "unsupported_claims": "...",
  "evidence_notes": "..."
}}

If the decision contains claims that cannot be supported from the provided
information, set evidence_check_ok to false and describe the unsupported claims.
If it is fully supported, set evidence_check_ok to true and provide a short
support summary.

Decision:
{state.get('decision')}

Incident data:
location: {state.get('location')}
incident_type: {state.get('incident_type')}
severity: {state.get('severity')}
people_at_risk: {state.get('people_at_risk')}
map_info: {state.get('map_info')}
resources: {state.get('resources')}

Approved procedures:
{state.get('procedures')}
"""

    response = llm.invoke(prompt)
    review = _parse_json_response(response.content)

    evidence_check_ok = bool(review.get("evidence_check_ok", False))
    evidence_summary = str(review.get("evidence_summary", "")).strip()
    unsupported_claims = str(review.get("unsupported_claims", "")).strip()
    evidence_notes = str(review.get("evidence_notes", "")).strip()

    if not evidence_summary:
        if evidence_check_ok:
            evidence_summary = "Decision appears supported by the available evidence."
        else:
            evidence_summary = "Could not clearly verify the decision against the evidence."

    if not evidence_notes and not evidence_check_ok:
        evidence_notes = "Evidence review detected unsupported or unclear claims."

    trace.append(
        f"Evidence Verifier: {'supported' if evidence_check_ok else 'unsupported/hallucination detected'}"
    )

    return {
        "evidence_check_ok": evidence_check_ok,
        "evidence_summary": evidence_summary,
        "unsupported_claims": unsupported_claims,
        "evidence_notes": evidence_notes,
        "trace": trace,
    }
