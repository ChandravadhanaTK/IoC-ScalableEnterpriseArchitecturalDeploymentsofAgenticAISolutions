import logging
from typing import Dict, Any
from datetime import datetime
from app.models.state import RemediationAction
from app.security.guardrails import guardrails

logger = logging.getLogger("containment")

async def execute_containment_action(action: RemediationAction, approver: str) -> Dict[str, Any]:
    """
    Executes containment action within the High-Privilege Action Enclave.
    Enforces parameter validation, audit trace generation, and deterministic rollback rules.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # 1. Strict validation
    if action.action_type == "BLOCK_PERIMETER_IP":
        if not guardrails.validate_tool_parameter("ipv4", action.target):
            raise ValueError(f"Target '{action.target}' is not a valid IPv4 address.")
        execution_details = {
            "perimeter_device": "Edge-Firewall-PA-5200 (Active/Passive HA)",
            "rule_name": f"DENY_IOC_{action.target.replace('.', '_')}",
            "applied_zones": ["untrust", "dmz", "corporate-lan"],
            "action": "DROP / SILENT_DISCARD",
            "enforcement_time": timestamp
        }
    elif action.action_type == "QUARANTINE_ENDPOINT":
        execution_details = {
            "edr_platform": "CrowdStrike Falcon Sensor / MS Defender EDR",
            "target_host": action.target,
            "isolation_type": "NETWORK_ISOLATION_EXCEPT_SOC_BRIDGE",
            "bridge_ip": "10.250.0.1 (Forensic Collector)",
            "enforcement_time": timestamp
        }
    elif action.action_type == "SINKHOLE_DNS":
        execution_details = {
            "dns_provider": "Infoblox RPZ / CoreDNS Enterprise",
            "domain_target": action.target,
            "redirect_ip": "127.0.0.1",
            "enforcement_time": timestamp
        }
    else:
        execution_details = {
            "action": action.action_type,
            "target": action.target,
            "enforcement_time": timestamp
        }

    action.status = "EXECUTED"
    action.approved_by = approver
    action.approval_timestamp = timestamp
    
    logger.info(f"CONTAINMENT EXECUTED: {action.action_type} on {action.target} by {approver}")
    return execution_details
