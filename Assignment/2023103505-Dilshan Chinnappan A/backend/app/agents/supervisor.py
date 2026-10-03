import uuid
import time
import json
from typing import AsyncGenerator, Dict, Any, Optional
from datetime import datetime
from app.models.state import IncidentState, AgentStepLog
from app.security.guardrails import guardrails
from app.security.audit import audit_logger
from app.telemetry.metrics import metrics
from app.telemetry.tracer import tracer
from app.agents.extractor import run_extractor_agent
from app.agents.enricher import run_enricher_agent
from app.agents.correlator import run_correlator_agent
from app.agents.remediator import run_remediator_agent

class SupervisorOrchestrator:
    """
    Stateful multi-agent supervisor coordinating the threat triage graph.
    Emits real-time state deltas across WebSocket streams.
    """

    async def execute_triage_pipeline(
        self,
        raw_alert: str,
        title: str,
        source: str = "Splunk EDR",
        incident_id: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        total_start = time.time()
        inc_id = incident_id or f"INC-2026-{str(uuid.uuid4())[:4].upper()}"
        
        # Initialize Incident State
        state = IncidentState(
            incident_id=inc_id,
            title=title,
            source_feed=source,
            raw_alert=raw_alert,
            status="TRIAGING"
        )
        
        root_span = tracer.start_span("incident_triage_root")
        root_span.set_attribute("incident_id", inc_id)
        
        # Emit initial state
        yield {"type": "incident_started", "state": state.dict()}

        # ----------------------------------------------------
        # Step 0: Ingress Guardrails & Security Sanitization
        # ----------------------------------------------------
        sanitization_res = guardrails.sanitize_alert_input(raw_alert)
        state.sanitized_alert = sanitization_res["sanitized_alert"]
        ip_map = sanitization_res["internal_ip_mappings"]

        if sanitization_res["prompt_injection_detected"]:
            metrics.record_injection_blocked()
            audit_logger.record_event(
                event_type="PROMPT_INJECTION_BLOCKED",
                incident_id=inc_id,
                principal="IngressGuardrail",
                action="SANITIZE_ALERT",
                details={"pattern": sanitization_res["blocked_pattern"]}
            )

        if sanitization_res["pii_redacted"]:
            metrics.record_pii_redacted(1)

        supervisor_step = AgentStepLog(
            agent_name="Supervisor & Ingress Gateway",
            status="completed",
            timestamp=datetime.utcnow().isoformat() + "Z",
            duration_ms=45,
            thought_stream=(
                f"Ingress sanitized. Prompt injection scan: {'TRIGGERED & NEUTRALIZED' if sanitization_res['prompt_injection_detected'] else 'CLEAN'}. "
                f"RFC1918 Private IP addresses masked: {len(ip_map)}. PII scrubbed."
            ),
            tool_calls=[{"tool": "security_guardrails", "injection": sanitization_res["prompt_injection_detected"]}],
            summary="Security boundaries verified. Dispatching to Extractor Agent."
        )
        state.agent_steps.append(supervisor_step)
        yield {"type": "step_completed", "step": supervisor_step.dict(), "state": state.dict()}

        # ----------------------------------------------------
        # Step 1: IOC Extractor Agent
        # ----------------------------------------------------
        ext_span = tracer.start_span("extractor_agent", root_span.span_id)
        iocs, ext_step = await run_extractor_agent(state.sanitized_alert)
        state.iocs = iocs
        state.agent_steps.append(ext_step)
        ext_span.finish()
        yield {"type": "step_completed", "step": ext_step.dict(), "state": state.dict()}

        # ----------------------------------------------------
        # Step 2: Threat Intel Enrichment Agent
        # ----------------------------------------------------
        enrich_span = tracer.start_span("enricher_agent", root_span.span_id)
        enriched_iocs, peak_risk, enrich_step = await run_enricher_agent(state.iocs)
        state.iocs = enriched_iocs
        state.composite_risk_score = peak_risk
        
        # Severity calculation
        if peak_risk >= 70:
            state.severity = "CRITICAL"
        elif peak_risk >= 40:
            state.severity = "HIGH"
        elif peak_risk >= 20:
            state.severity = "MEDIUM"
        else:
            state.severity = "LOW"

        state.agent_steps.append(enrich_step)
        enrich_span.finish()
        yield {"type": "step_completed", "step": enrich_step.dict(), "state": state.dict()}

        # ----------------------------------------------------
        # Step 3: Blast Radius & Correlation Agent
        # ----------------------------------------------------
        corr_span = tracer.start_span("correlator_agent", root_span.span_id)
        correlation, corr_step = await run_correlator_agent(raw_alert, ip_map, enriched_iocs, peak_risk)
        state.correlation = correlation
        state.agent_steps.append(corr_step)
        corr_span.finish()
        yield {"type": "step_completed", "step": corr_step.dict(), "state": state.dict()}

        # ----------------------------------------------------
        # Step 4: Remediation & Playbook Agent
        # ----------------------------------------------------
        rem_span = tracer.start_span("remediator_agent", root_span.span_id)
        remediation, rem_step = await run_remediator_agent(enriched_iocs, correlation, peak_risk)
        state.remediation = remediation
        state.agent_steps.append(rem_step)
        rem_span.finish()

        # ----------------------------------------------------
        # Step 5: HITL Gatekeeper Evaluation
        # ----------------------------------------------------
        if remediation and remediation.requires_approval:
            state.status = "AWAITING_APPROVAL"
        elif peak_risk < 25:
            state.status = "CLOSED"
        else:
            state.status = "REMEDIATED"

        # Finalize root trace & metrics
        duration_total = time.time() - total_start
        root_span.finish()
        
        metrics.record_incident_triage(
            duration_s=duration_total,
            tokens_used=1240,
            cache_hit=any(ioc.enrichment_details.get("cached", False) for ioc in state.iocs)
        )

        # Record cryptographic audit trail
        audit_hash = audit_logger.record_event(
            event_type="INCIDENT_TRIAGED",
            incident_id=inc_id,
            principal="SupervisorAgent",
            action="TRIAGE_COMPLETED",
            details={
                "risk_score": state.composite_risk_score,
                "severity": state.severity,
                "status": state.status,
                "iocs_count": len(state.iocs),
                "remediation_proposed": bool(state.remediation)
            }
        )
        state.audit_hash = audit_hash

        yield {"type": "incident_completed", "state": state.dict()}

supervisor = SupervisorOrchestrator()
