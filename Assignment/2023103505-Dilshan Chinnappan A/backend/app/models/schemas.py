from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.models.state import IncidentState, RemediationAction

class IngestAlertRequest(BaseModel):
    title: str = Field(..., example="Outbound C2 connection to suspicious IP")
    raw_alert: str = Field(..., example="Host finance-srv-02 (10.10.4.52) established TCP conn to 185.220.101.5 on port 4444")
    source: str = Field("Splunk EDR", example="Splunk EDR")
    severity_hint: Optional[str] = Field("HIGH", example="HIGH")

class IngestAlertResponse(BaseModel):
    success: bool
    incident_id: str
    message: str
    incident: IncidentState

class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., example="APPROVE")  # APPROVE, REJECT, MODIFY
    analyst_name: str = Field("Lead Analyst", example="Analyst-01")
    analyst_jwt: Optional[str] = Field("eyJhbGciOi...", example="eyJhbGci...")
    justification: str = Field("Verified C2 beaconing. Immediate containment necessary.", example="Confirmed active C2")
    modified_target: Optional[str] = None

class ApprovalDecisionResponse(BaseModel):
    success: bool
    incident_id: str
    action_status: str
    executed_action: Optional[RemediationAction] = None
    message: str

class SystemMetricsResponse(BaseModel):
    total_incidents_processed: int
    active_incidents: int
    mean_time_to_detect_seconds: float
    mean_time_to_remediate_minutes: float
    mttr_reduction_percentage: float
    cache_hit_ratio: float
    total_token_usage: int
    cost_per_incident_usd: float
    prompt_injections_blocked: int
    pii_redactions_performed: int
    automated_triage_percentage: float
    threat_feeds_active: List[str]
    system_health: str = "OPTIMAL"
