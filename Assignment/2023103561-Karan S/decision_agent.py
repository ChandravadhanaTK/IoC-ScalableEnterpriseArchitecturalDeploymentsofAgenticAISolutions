"""
Decision Agent
==============
Combines the outputs of Map Agent + Knowledge RAG + Resource Agent
and produces a clear initial coordination decision.
"""
from llm import get_llm


def decision_agent(state: dict) -> dict:
    llm = get_llm(temperature=0.2)
    trace = state.get("trace", [])

    prompt = f"""
You are an emergency coordination officer. Based on the information below,
write a clear, concise coordination decision (5 bullet points max):

Incident type: {state.get('incident_type')}
Severity: {state.get('severity')}
People at risk: {state.get('people_at_risk')}
Location info: {state.get('map_info')}
Available resources: {state.get('resources')}

Reference approved procedures:
{state.get('procedures')}

Write the decision in English, as clear and direct actionable bullet points.
"""

    response = llm.invoke(prompt)
    decision_text = response.content

    trace.append("Decision Agent: initial decision formed")

    return {"decision": decision_text, "trace": trace}
