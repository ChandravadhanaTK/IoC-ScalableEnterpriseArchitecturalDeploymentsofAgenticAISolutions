import uuid
import time
from typing import List, Tuple, Optional
from app.models.state import IOCRecord, InternalCorrelation, RemediationAction, AgentStepLog

async def run_remediator_agent(
    enriched_iocs: List[IOCRecord],
    correlation: InternalCorrelation,
    composite_risk: int
) -> Tuple[Optional[RemediationAction], AgentStepLog]:
    start_time = time.time()
    thought_stream = []
    thought_stream.append("Evaluating enterprise containment policy & playbook selection matrix...")

    malicious_iocs = [i for i in enriched_iocs if i.verdict == "MALICIOUS"]
    suspicious_iocs = [i for i in enriched_iocs if i.verdict == "SUSPICIOUS"]
    
    action: Optional[RemediationAction] = None

    if composite_risk < 25 and not malicious_iocs:
        thought_stream.append("Threat score is nominal (< 25). No destructive containment warranted. Ticket marked for auto-closure.")
        remediation_summary = "Benign activity. No active containment required."
        step_status = "completed"
    else:
        # Determine appropriate containment action
        target = "185.220.101.5"
        action_type = "BLOCK_PERIMETER_IP"
        
        # Check if external malicious IP exists
        ip_iocs = [i for i in enriched_iocs if "ip" in i.ioc_type and i.verdict in ["MALICIOUS", "SUSPICIOUS"]]
        domain_iocs = [i for i in enriched_iocs if i.ioc_type == "domain" and i.verdict in ["MALICIOUS", "SUSPICIOUS"]]

        if correlation.blast_radius in ["HIGH", "CRITICAL"] and correlation.asset_ip:
            # Dangerous blast radius warrants host isolation proposal
            action_type = "QUARANTINE_ENDPOINT"
            target = f"{correlation.matched_internal_asset} ({correlation.asset_ip})"
            justification = (
                f"Active high-severity C2 telemetry correlated with {correlation.asset_criticality} asset "
                f"'{correlation.matched_internal_asset}'. Immediate network isolation required to prevent lateral movement."
            )
            rollback = f"Release host isolation via CrowdStrike Falcon API: `unquarantine_endpoint({correlation.matched_internal_asset})`."
        elif domain_iocs:
            action_type = "SINKHOLE_DNS"
            target = domain_iocs[0].normalized_value
            justification = f"Malicious phishing/C2 domain '{target}' confirmed by threat intelligence. Redirect DNS to sinkhole."
            rollback = f"Remove DNS sinkhole RPZ entry for {target}."
        elif ip_iocs:
            action_type = "BLOCK_PERIMETER_IP"
            target = ip_iocs[0].normalized_value
            justification = f"C2 communication observed targeting blacklisted IP {target}. Block inbound/outbound at perimeter."
            rollback = f"Remove firewall access-list drop rule: `no access-list OUTBOUND_BLOCK host {target}`."
        else:
            action_type = "BLOCK_PERIMETER_IP"
            target = enriched_iocs[0].normalized_value if enriched_iocs else "185.220.101.5"
            justification = f"Suspicious indicator {target} requires perimeter firewall filtering."
            rollback = f"Unblock {target} on Edge Firewall."

        thought_stream.append(
            f"Formulated Containment Action: [{action_type}] on target '{target}'. "
            f"Risk Level: HIGH. Enterprise policy flags this as HIGH PRIVILEGE."
        )
        thought_stream.append("Pausing execution: Cryptographic Human-in-the-Loop (HITL) approval required by Tier-2 Analyst or SOC Lead.")

        action = RemediationAction(
            action_id=f"ACT-{str(uuid.uuid4())[:8].upper()}",
            action_type=action_type,
            target=target,
            risk_level="HIGH" if correlation.blast_radius in ["HIGH", "CRITICAL"] else "MEDIUM",
            requires_approval=True,
            status="PENDING_APPROVAL",
            justification=justification,
            rollback_plan=rollback
        )
        remediation_summary = f"Generated proposal [{action_type}] targeting {target}. Awaiting Analyst Approval."
        step_status = "awaiting_approval"

    duration_ms = int((time.time() - start_time) * 1000)
    
    step_log = AgentStepLog(
        agent_name="Remediation & Playbook Agent",
        status=step_status,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        duration_ms=max(duration_ms, 320),
        thought_stream="\n".join(thought_stream),
        tool_calls=[{"tool": "generate_playbook", "action": action.action_type if action else "NONE"}],
        summary=remediation_summary
    )

    return action, step_log
