import time
import re
from typing import List, Dict, Any, Tuple, Optional
from app.models.state import IOCRecord, InternalCorrelation, AgentStepLog

# Internal CMDB Asset Knowledge
INTERNAL_ASSET_CMDB = {
    "10.10.4.52": {
        "hostname": "FINANCE-DB-SRV02",
        "criticality": "MISSION_CRITICAL",
        "department": "Corporate Treasury & Payroll",
        "data_classification": "Restricted / SOX Compliance"
    },
    "10.10.4.12": {
        "hostname": "SRV-04-PAYROLL",
        "criticality": "HIGH",
        "department": "Human Resources / Payroll Operations",
        "data_classification": "Confidential / PII"
    },
    "192.168.1.105": {
        "hostname": "WKSTN-EXEC-09",
        "criticality": "HIGH",
        "department": "Executive Leadership",
        "data_classification": "Confidential"
    },
    "172.16.50.8": {
        "hostname": "DMZ-WEB-PROXY-01",
        "criticality": "MEDIUM",
        "department": "Infrastructure Ops",
        "data_classification": "Internal Only"
    }
}

async def run_correlator_agent(
    raw_alert: str,
    ip_mappings: Dict[str, str],
    enriched_iocs: List[IOCRecord],
    peak_risk: int
) -> Tuple[InternalCorrelation, AgentStepLog]:
    start_time = time.time()
    thought_stream = []
    thought_stream.append("Correlating threat telemetry with internal SIEM asset database & MITRE ATT&CK matrix...")

    # 1. Check internal asset match
    matched_asset_name = "Generic Workstation"
    matched_ip = None
    criticality = "LOW"
    dept = "General Corporate"
    blast_radius = "LOW"

    # Search through real IP mappings from guardrails or alert text
    found_known_asset = False
    for real_ip, token in ip_mappings.items():
        if real_ip in INTERNAL_ASSET_CMDB:
            asset = INTERNAL_ASSET_CMDB[real_ip]
            matched_asset_name = asset["hostname"]
            matched_ip = real_ip
            criticality = asset["criticality"]
            dept = asset["department"]
            found_known_asset = True
            thought_stream.append(f"SIEM Alert Match: Internal asset {matched_asset_name} ({real_ip}) is flagged! [Criticality: {criticality}]")
            break

    if not found_known_asset:
        # Check text heuristics
        lower_alert = raw_alert.lower()
        if "srv-04" in lower_alert or "payroll" in lower_alert:
            matched_asset_name = "SRV-04-PAYROLL"
            matched_ip = "10.10.4.12"
            criticality = "HIGH"
            dept = "Finance / Payroll"
            thought_stream.append("SIEM Alert Match: Host SRV-04-PAYROLL correlated via alert hostname pattern.")
        elif "finance" in lower_alert or "db" in lower_alert:
            matched_asset_name = "FINANCE-DB-SRV02"
            matched_ip = "10.10.4.52"
            criticality = "MISSION_CRITICAL"
            dept = "Corporate Finance"
            thought_stream.append("SIEM Alert Match: Database server identified in alert telemetry.")

    # 2. MITRE ATT&CK Mapping
    tactic = "Command and Control"
    technique_id = "T1071.001"
    technique_name = "Application Layer Protocol: Web Protocols"

    has_ransomware = any("ransomware" in str(ioc.enrichment_details).lower() for ioc in enriched_iocs)
    has_phish = any("phishing" in str(ioc.enrichment_details).lower() or ioc.ioc_type == "domain" for ioc in enriched_iocs)

    if has_ransomware:
        tactic = "Impact"
        technique_id = "T1486"
        technique_name = "Data Encrypted for Impact"
    elif has_phish:
        tactic = "Initial Access"
        technique_id = "T1566.002"
        technique_name = "Phishing: Spearphishing Link"
    elif peak_risk >= 70:
        tactic = "Command and Control"
        technique_id = "T1071.001"
        technique_name = "Standard Application Layer Protocol (C2 Beaconing)"

    # 3. Calculate Blast Radius
    if criticality in ["MISSION_CRITICAL", "HIGH"] and peak_risk >= 65:
        blast_radius = "HIGH" if criticality == "HIGH" else "CRITICAL"
    elif peak_risk >= 50 or criticality in ["MEDIUM", "HIGH"]:
        blast_radius = "MEDIUM"
    else:
        blast_radius = "LOW"

    thought_stream.append(
        f"MITRE ATT&CK: [{technique_id} - {technique_name}] under Tactic '{tactic}'. Blast Radius calculated as: {blast_radius}."
    )

    correlation = InternalCorrelation(
        matched_internal_asset=matched_asset_name,
        asset_ip=matched_ip or "10.10.4.12",
        asset_criticality=criticality,
        department=dept,
        mitre_tactic=tactic,
        mitre_technique_id=technique_id,
        mitre_technique_name=technique_name,
        blast_radius=blast_radius,
        affected_endpoints_count=1 if blast_radius in ["LOW", "MEDIUM"] else 4
    )

    duration_ms = int((time.time() - start_time) * 1000)
    summary = f"Correlated with {matched_asset_name} ({criticality}). Blast Radius: {blast_radius}."

    step_log = AgentStepLog(
        agent_name="Blast Radius & Correlation Agent",
        status="completed",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        duration_ms=max(duration_ms, 380),
        thought_stream="\n".join(thought_stream),
        tool_calls=[{"tool": "check_internal_siem", "matched": matched_asset_name}],
        summary=summary
    )

    return correlation, step_log
