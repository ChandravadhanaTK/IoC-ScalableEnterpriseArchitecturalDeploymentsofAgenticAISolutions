"""
Shared State passed between all Agents in the system.
Every Agent receives this State, adds to it, and returns it.
"""
from typing import Annotated, TypedDict
from typing_extensions import NotRequired


def _merge_trace(existing: list, new: list) -> list:
    if existing is None:
        return list(new or [])
    return [*existing, *new]


class IncidentState(TypedDict, total=False):
    # User input
    report: str  # Raw incident report text written by the user

    # Output of Incident Agent
    location: str
    incident_type: str
    severity: str  # low / medium / high / critical
    people_at_risk: int

    # Output of Map Agent
    map_info: dict  # {"lat": .., "lng": .., "estimated_distance_km": ..}

    # Output of Knowledge RAG
    procedures: str  # Retrieved procedures from the knowledge base

    # Output of Resource Agent
    resources: dict  # {"ambulance_units": .., "fire_units": .., "eta_minutes": ..}

    # Output of Decision Agent
    decision: str

    # Output of Safety Checker
    safety_ok: bool
    safety_notes: str

    # Output of Evidence Verifier
    evidence_check_ok: bool
    evidence_summary: str
    unsupported_claims: str
    evidence_notes: str

    # Output of Human Approval
    approval_status: str
    approval_granted: bool
    human_approval_required: bool
    approval_note: str
    review_comments: str

    # Final output
    action_plan: str

    # Execution trace (useful for debugging and displaying in the UI)
    trace: Annotated[list, _merge_trace]
