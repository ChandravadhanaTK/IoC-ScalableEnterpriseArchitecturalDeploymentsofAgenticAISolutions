"""
Resource Agent
==============
In a real system, this Agent would integrate with an actual dispatch
tracking system (an external API or database) for ambulances/fire trucks.
Here we simulate realistic behavior based on severity and incident_type,
so the system works end-to-end without any external dependency that could fail.
"""
import random


def resource_agent(state: dict) -> dict:
    """
    Node function for LangGraph.
    Input: state containing 'incident_type', 'severity', 'people_at_risk'
    Output: updated state with 'resources'
    """
    incident_type = state.get("incident_type", "").lower()
    severity = state.get("severity", "medium").lower()
    people_at_risk = state.get("people_at_risk", 0)
    trace = state.get("trace", [])

    needs_fire_truck = "fire" in incident_type
    needs_ambulance = any(term in incident_type for term in ["fire", "medical", "accident", "rescue", "chemical"])
    needs_rescue = any(term in incident_type for term in ["fire", "accident", "rescue", "chemical"])

    severity_map = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    base_units = severity_map.get(severity, 2)
    if people_at_risk > 5:
        base_units += 1
    if people_at_risk > 15:
        base_units += 1

    ambulance_units = base_units if needs_ambulance else 0
    fire_units = max(1, base_units) if needs_fire_truck else 0
    rescue_units = 1 if needs_rescue and severity in {"high", "critical"} else 0

    resources = {
        "ambulance_units": ambulance_units,
        "fire_units": fire_units,
        "rescue_units": rescue_units,
        "total_units": ambulance_units + fire_units + rescue_units,
        "available": True,
        "eta_minutes": random.choice([4, 6, 8, 10]),
    }

    dispatched = [f"{ambulance_units} ambulance(s)" if ambulance_units else None,
                  f"{fire_units} fire truck(s)" if fire_units else None,
                  f"{rescue_units} rescue unit(s)" if rescue_units else None]
    dispatched_text = ", ".join([item for item in dispatched if item])

    trace.append(f"Resource Agent: dispatched {dispatched_text}")

    return {"resources": resources, "trace": trace}
