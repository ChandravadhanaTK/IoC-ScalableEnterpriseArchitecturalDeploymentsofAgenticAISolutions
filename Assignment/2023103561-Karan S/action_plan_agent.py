"""
Action Plan Agent
==================
Last step in the graph. Takes the decision + safety notes and produces
a final, formatted action plan ready to display/print/send to field teams.
"""


def action_plan_agent(state: dict) -> dict:
    trace = state.get("trace", [])

    if state.get("approval_granted"):
        status_icon = "🟢"
    elif state.get("safety_ok") and state.get("evidence_check_ok"):
        status_icon = "🟡"
    else:
        status_icon = "🔴"

    authorization_status = (
        "AUTHORIZED for deployment." if state.get("approval_granted") else
        "NOT AUTHORIZED until human approval is granted."
    )

    plan = f"""
{status_icon} Incident Action Plan
{'=' * 40}

Location: {state.get('location')}
Incident type: {state.get('incident_type')}
Severity: {state.get('severity')}
People at risk: {state.get('people_at_risk')}

Dispatched resources: {state.get('resources')}

Executive decision:
{state.get('decision')}

Safety check status: {state.get('safety_notes')}
Evidence verification: {state.get('evidence_summary')}
Unsupported claims: {state.get('unsupported_claims') or 'None detected.'}
Evidence note: {state.get('evidence_notes')}

Human approval status: {state.get('approval_status')}
Approval note: {state.get('approval_note')}
Review comments: {state.get('review_comments') or 'No comments provided.'}

Authorization: {authorization_status}
"""

    trace.append("Action Plan Agent: final plan ready")

    return {"action_plan": plan.strip(), "trace": trace}
