import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.state import IncidentState, AgentStepLog, IOCRecord, InternalCorrelation, RemediationAction
from app.models.schemas import (
    IngestAlertRequest,
    IngestAlertResponse,
    ApprovalDecisionRequest,
    ApprovalDecisionResponse,
    SystemMetricsResponse
)
from app.security.guardrails import guardrails
from app.security.auth import verify_token, DEFAULT_ANALYST_TOKEN
from app.security.audit import audit_logger
from app.telemetry.metrics import metrics
from app.telemetry.tracer import tracer
from app.tools.containment import execute_containment_action
from app.agents.supervisor import supervisor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Agentic AI Assistant for Threat Intelligence & SOC Triage"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev and preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Active Incidents Store
INCIDENTS_STORE: Dict[str, IncidentState] = {}

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()

def seed_initial_incidents():
    """Seeds realistic SOC incidents for immediate hands-on verification."""
    # Seed 1: Cobalt Strike C2 (Awaiting Approval)
    inc1 = IncidentState(
        incident_id="INC-2026-0891",
        created_at="2026-10-03T11:15:00Z",
        title="Cobalt Strike C2 Beaconing from Payroll Host",
        source_feed="Splunk Enterprise Security",
        raw_alert="Outbound HTTPS beaconing observed to 185.220.101.5 on port 4444 from host SRV-04-PAYROLL (10.10.4.12). Repeated beacon intervals detected.",
        sanitized_alert="Outbound HTTPS beaconing observed to 185.220.101.5 on port 4444 from host SRV-04-PAYROLL ([INTERNAL_HOST_1]). Repeated beacon intervals detected.",
        severity="HIGH",
        composite_risk_score=88,
        status="AWAITING_APPROVAL",
        iocs=[
            IOCRecord(
                id="ioc-01",
                ioc_type="ipv4",
                raw_value="185.220.101.5",
                normalized_value="185.220.101.5",
                defanged_value="185[.]220[.]101[.]5",
                reputation_score=88,
                is_malicious=True,
                verdict="MALICIOUS",
                enrichment_details={
                    "virustotal": {"reputation": 88, "verdict": "MALICIOUS", "malicious_votes": 64, "total_votes": 72, "tags": ["cobalt-strike", "c2-beacon"]},
                    "abuseipdb": {"abuse_score": 100, "country": "DE", "isp": "Zwiebelfreunde e.V."},
                    "alienvault": {"pulse_count": 28, "adversary": "APT29 / Cozy Bear", "malware_families": ["Cobalt Strike"]}
                }
            )
        ],
        correlation=InternalCorrelation(
            matched_internal_asset="SRV-04-PAYROLL",
            asset_ip="10.10.4.12",
            asset_criticality="HIGH",
            department="Human Resources / Payroll",
            mitre_tactic="Command and Control",
            mitre_technique_id="T1071.001",
            mitre_technique_name="Application Layer Protocol: Web Protocols",
            blast_radius="HIGH",
            affected_endpoints_count=1
        ),
        remediation=RemediationAction(
            action_id="ACT-891A",
            action_type="QUARANTINE_ENDPOINT",
            target="SRV-04-PAYROLL (10.10.4.12)",
            risk_level="HIGH",
            requires_approval=True,
            status="PENDING_APPROVAL",
            justification="Active Cobalt Strike C2 connection identified on high-criticality payroll server. Immediate host isolation required.",
            rollback_plan="Issue CrowdStrike API command unquarantine_host(SRV-04-PAYROLL)."
        ),
        agent_steps=[
            AgentStepLog(
                agent_name="Supervisor & Ingress Gateway",
                status="completed",
                timestamp="2026-10-03T11:15:01Z",
                duration_ms=42,
                thought_stream="Alert ingested. Ingress sanitization verified. RFC1918 IPs masked.",
                tool_calls=[],
                summary="Ingress sanitized. Dispatched to Extractor."
            ),
            AgentStepLog(
                agent_name="IOC Extractor & Normalizer",
                status="completed",
                timestamp="2026-10-03T11:15:02Z",
                duration_ms=310,
                thought_stream="Regex pattern match: Extracted IPv4 185.220.101.5. De-fanged to 185[.]220[.]101[.]5.",
                tool_calls=[{"tool": "regex_ioc_parser", "found": 1}],
                summary="Extracted 1 IPv4 indicator."
            ),
            AgentStepLog(
                agent_name="Threat Intel Enrichment Agent",
                status="completed",
                timestamp="2026-10-03T11:15:03Z",
                duration_ms=520,
                thought_stream="Concurrent queries: VirusTotal score 88/100 (64 malicious votes). AbuseIPDB confidence 100%. AlienVault 28 pulses linked to APT29 / Cozy Bear.",
                tool_calls=[{"tool": "query_virustotal"}, {"tool": "query_abuseipdb"}, {"tool": "query_alienvault_otx"}],
                summary="High-confidence malicious C2 beacon confirmed. Risk: 88/100."
            ),
            AgentStepLog(
                agent_name="Blast Radius & Correlation Agent",
                status="completed",
                timestamp="2026-10-03T11:15:04Z",
                duration_ms=410,
                thought_stream="Correlated with CMDB. SRV-04-PAYROLL holds sensitive employee compensation records. Mapped to MITRE ATT&CK T1071.001.",
                tool_calls=[{"tool": "check_internal_siem"}],
                summary="Correlated with critical payroll asset. Blast radius: HIGH."
            ),
            AgentStepLog(
                agent_name="Remediation & Playbook Agent",
                status="awaiting_approval",
                timestamp="2026-10-03T11:15:05Z",
                duration_ms=350,
                thought_stream="Formulated QUARANTINE_ENDPOINT proposal for SRV-04-PAYROLL. High-privilege action enqueued for human analyst sign-off.",
                tool_calls=[{"tool": "generate_playbook"}],
                summary="Proposal created. Awaiting cryptographic HITL approval."
            )
        ],
        audit_hash="a6c8e5473f1d2e99b418fa901234cdef567890abcdef1234567890abcdef1234"
    )

    # Seed 2: Phishing URL Campaign (Remediated)
    inc2 = IncidentState(
        incident_id="INC-2026-0892",
        created_at="2026-10-03T10:30:00Z",
        title="Spearphishing Email with Credential Harvester",
        source_feed="Microsoft Defender for Office 365",
        raw_alert="Inbound email to analyst-dept containing link to malicious-payload-drop.org with fake Microsoft login portal.",
        sanitized_alert="Inbound email containing link to malicious-payload-drop.org with fake Microsoft login portal.",
        severity="HIGH",
        composite_risk_score=82,
        status="REMEDIATED",
        iocs=[
            IOCRecord(
                id="ioc-02",
                ioc_type="domain",
                raw_value="malicious-payload-drop.org",
                normalized_value="malicious-payload-drop.org",
                defanged_value="malicious-payload-drop[.]org",
                reputation_score=82,
                is_malicious=True,
                verdict="MALICIOUS",
                enrichment_details={
                    "virustotal": {"reputation": 82, "verdict": "MALICIOUS", "malicious_votes": 51, "total_votes": 68},
                    "alienvault": {"pulse_count": 19, "adversary": "Storm-0558", "malware_families": ["AiTM Phishing"]}
                }
            )
        ],
        correlation=InternalCorrelation(
            matched_internal_asset="Corporate Email Gateway",
            asset_ip="172.16.50.8",
            asset_criticality="MEDIUM",
            department="Enterprise Messaging",
            mitre_tactic="Initial Access",
            mitre_technique_id="T1566.002",
            mitre_technique_name="Spearphishing Link",
            blast_radius="MEDIUM",
            affected_endpoints_count=1
        ),
        remediation=RemediationAction(
            action_id="ACT-892B",
            action_type="SINKHOLE_DNS",
            target="malicious-payload-drop.org",
            risk_level="MEDIUM",
            requires_approval=True,
            status="EXECUTED",
            justification="Confirmed active credential harvester targeting corporate accounts.",
            rollback_plan="Remove RPZ sinkhole entry.",
            approved_by="Lead Analyst (Alex Mercer)",
            approval_timestamp="2026-10-03T10:35:12Z"
        ),
        audit_hash="b7f9a1234567890abcdef1234567890abcdef1234567890abcdef1234567890a"
    )

    INCIDENTS_STORE[inc1.incident_id] = inc1
    INCIDENTS_STORE[inc2.incident_id] = inc2

# Run seed on module load
seed_initial_incidents()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "active_incidents": len(INCIDENTS_STORE),
        "engine": "FastAPI + LangGraph Multi-Agent",
        "model_tier": settings.GEMINI_MODEL
    }

@app.get("/api/incidents")
async def get_all_incidents() -> List[IncidentState]:
    return list(INCIDENTS_STORE.values())

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str) -> IncidentState:
    inc = INCIDENTS_STORE.get(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@app.post("/api/incidents/ingest", response_model=IngestAlertResponse)
async def ingest_alert(req: IngestAlertRequest):
    """
    Ingests an alert, executes the LangGraph agent pipeline,
    and streams events via WebSocket.
    """
    final_state = None
    async for event in supervisor.execute_triage_pipeline(
        raw_alert=req.raw_alert,
        title=req.title,
        source=req.source
    ):
        await ws_manager.broadcast(event)
        if event["type"] in ["incident_completed", "step_completed"]:
            final_state = event["state"]

    if final_state:
        inc_obj = IncidentState(**final_state)
        INCIDENTS_STORE[inc_obj.incident_id] = inc_obj
        return IngestAlertResponse(
            success=True,
            incident_id=inc_obj.incident_id,
            message="Alert triaged successfully by Multi-Agent team.",
            incident=inc_obj
        )

    raise HTTPException(status_code=500, detail="Triage pipeline failed to produce state.")

@app.post("/api/incidents/{incident_id}/approve", response_model=ApprovalDecisionResponse)
async def submit_approval_decision(incident_id: str, req: ApprovalDecisionRequest):
    """
    Processes Human-in-the-Loop approval/rejection for containment proposals.
    """
    inc = INCIDENTS_STORE.get(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if not inc.remediation:
        raise HTTPException(status_code=400, detail="No pending remediation action on this incident.")

    action = inc.remediation

    if req.decision.upper() == "APPROVE":
        exec_details = await execute_containment_action(action, approver=req.analyst_name)
        inc.status = "REMEDIATED"
        action.status = "EXECUTED"
        action.analyst_note = req.justification

        audit_hash = audit_logger.record_event(
            event_type="CONTAINMENT_APPROVED_AND_EXECUTED",
            incident_id=incident_id,
            principal=req.analyst_name,
            action=action.action_type,
            details={
                "target": action.target,
                "justification": req.justification,
                "execution_result": exec_details
            }
        )
        inc.audit_hash = audit_hash

        # Broadcast update
        await ws_manager.broadcast({
            "type": "incident_updated",
            "state": inc.dict(),
            "message": f"Action {action.action_type} approved and executed by {req.analyst_name}."
        })

        return ApprovalDecisionResponse(
            success=True,
            incident_id=incident_id,
            action_status="EXECUTED",
            executed_action=action,
            message=f"Action {action.action_type} executed on {action.target}."
        )

    else:
        inc.status = "CLOSED"
        action.status = "REJECTED"
        action.analyst_note = req.justification

        audit_logger.record_event(
            event_type="CONTAINMENT_REJECTED",
            incident_id=incident_id,
            principal=req.analyst_name,
            action="REJECT_ACTION",
            details={"action_id": action.action_id, "justification": req.justification}
        )

        await ws_manager.broadcast({
            "type": "incident_updated",
            "state": inc.dict(),
            "message": f"Action rejected by {req.analyst_name}. Incident marked closed."
        })

        return ApprovalDecisionResponse(
            success=True,
            incident_id=incident_id,
            action_status="REJECTED",
            executed_action=action,
            message="Remediation proposal rejected by analyst."
        )

@app.get("/api/metrics", response_model=SystemMetricsResponse)
async def get_system_metrics():
    return metrics.get_snapshot()

@app.get("/api/audit-logs")
async def get_audit_logs():
    return audit_logger.get_recent_entries(limit=50)

@app.get("/api/spans")
async def get_distributed_spans():
    return tracer.get_spans(limit=30)

@app.get("/api/auth/token")
async def get_mock_analyst_token():
    return {"token": DEFAULT_ANALYST_TOKEN, "role": "soc_admin", "user": "Alex Mercer"}

@app.websocket("/ws/incidents")
async def websocket_incidents_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial snapshot of all incidents upon connection
        await websocket.send_json({
            "type": "snapshot",
            "incidents": [inc.dict() for inc in INCIDENTS_STORE.values()]
        })
        while True:
            # Keep connection alive & handle incoming pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
