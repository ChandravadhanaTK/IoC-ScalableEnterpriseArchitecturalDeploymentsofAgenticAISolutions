from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class IOCRecord(BaseModel):
    id: str
    ioc_type: str  # ipv4, ipv6, domain, url, sha256, md5, cve
    raw_value: str
    normalized_value: str
    defanged_value: str
    reputation_score: int = 0  # 0-100
    is_malicious: bool = False
    verdict: str = "BENIGN"  # BENIGN, SUSPICIOUS, MALICIOUS, UNKNOWN
    enrichment_details: Dict[str, Any] = Field(default_factory=dict)

class ThreatFeedResult(BaseModel):
    source: str
    reputation: int = 0
    malicious_votes: int = 0
    total_votes: int = 0
    categories: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    cached: bool = False

class InternalCorrelation(BaseModel):
    matched_internal_asset: Optional[str] = None
    asset_ip: Optional[str] = None
    asset_criticality: str = "MEDIUM"  # LOW, MEDIUM, HIGH, MISSION_CRITICAL
    department: Optional[str] = None
    mitre_tactic: str = "Initial Access"
    mitre_technique_id: str = "T1190"
    mitre_technique_name: str = "Exploit Public-Facing Application"
    blast_radius: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    affected_endpoints_count: int = 1

class RemediationAction(BaseModel):
    action_id: str
    action_type: str  # BLOCK_PERIMETER_IP, QUARANTINE_ENDPOINT, SINKHOLE_DNS, REVOKE_CREDENTIALS, NOTIFY_SOC
    target: str
    risk_level: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    requires_approval: bool = True
    status: str = "PENDING_APPROVAL"  # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED
    justification: str = ""
    rollback_plan: str = ""
    analyst_note: Optional[str] = None
    approved_by: Optional[str] = None
    approval_timestamp: Optional[str] = None

class AgentStepLog(BaseModel):
    agent_name: str  # Supervisor, Extractor, Enricher, Correlator, Remediator
    status: str  # completed, in_progress, awaiting_approval, error
    timestamp: str
    duration_ms: int
    thought_stream: str
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    summary: str

class IncidentState(BaseModel):
    incident_id: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    title: str
    source_feed: str = "SIEM-Splunk"
    raw_alert: str
    sanitized_alert: str = ""
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    composite_risk_score: int = 0  # 0-100
    status: str = "TRIAGING"  # INGESTED, TRIAGING, AWAITING_APPROVAL, REMEDIATED, CLOSED
    iocs: List[IOCRecord] = Field(default_factory=list)
    correlation: Optional[InternalCorrelation] = None
    remediation: Optional[RemediationAction] = None
    agent_steps: List[AgentStepLog] = Field(default_factory=list)
    audit_hash: str = ""
