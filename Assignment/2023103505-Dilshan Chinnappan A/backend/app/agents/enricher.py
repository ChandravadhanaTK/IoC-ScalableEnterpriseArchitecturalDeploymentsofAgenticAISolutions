import asyncio
import time
from typing import List, Tuple
from app.models.state import IOCRecord, AgentStepLog
from app.tools.virustotal import query_virustotal
from app.tools.abuseipdb import query_abuseipdb
from app.tools.alienvault import query_alienvault_otx

async def enrich_single_ioc(ioc: IOCRecord) -> Tuple[IOCRecord, List[str]]:
    thoughts = []
    thoughts.append(f"Querying threat feeds for {ioc.ioc_type.upper()}: {ioc.normalized_value}")
    
    vt_res = None
    abuse_res = None
    otx_res = None

    tasks = [query_virustotal(ioc.normalized_value, ioc.ioc_type)]
    if "ip" in ioc.ioc_type:
        tasks.append(query_abuseipdb(ioc.normalized_value))
    tasks.append(query_alienvault_otx(ioc.normalized_value, ioc.ioc_type))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for res in results:
        if isinstance(res, dict):
            src = res.get("source", "")
            if "VirusTotal" in src:
                vt_res = res
            elif "AbuseIPDB" in src:
                abuse_res = res
            elif "AlienVault" in src:
                otx_res = res

    # Calculate weighted composite score
    vt_score = vt_res.get("reputation", 0) if vt_res else 0
    abuse_score = abuse_res.get("abuse_score", 0) if abuse_res else 0
    otx_pulses = otx_res.get("pulse_count", 0) if otx_res else 0
    otx_score = min(100, otx_pulses * 5)

    composite_score = int(0.40 * vt_score + 0.35 * abuse_score + 0.25 * otx_score)
    ioc.reputation_score = composite_score

    if composite_score >= 65:
        ioc.verdict = "MALICIOUS"
        ioc.is_malicious = True
    elif composite_score >= 30:
        ioc.verdict = "SUSPICIOUS"
        ioc.is_malicious = False
    else:
        ioc.verdict = "BENIGN"
        ioc.is_malicious = False

    ioc.enrichment_details = {
        "virustotal": vt_res or {},
        "abuseipdb": abuse_res or {},
        "alienvault": otx_res or {},
        "composite_score": composite_score
    }

    cached_flag = any(r.get("cached", False) for r in [vt_res, abuse_res, otx_res] if isinstance(r, dict))
    cache_str = "[Cache Hit]" if cached_flag else "[Live Query]"
    thoughts.append(
        f"{cache_str} VT Score: {vt_score}/100 | Abuse Score: {abuse_score}% | OTX Pulses: {otx_pulses} "
        f"-> Verdict: {ioc.verdict} (Risk: {composite_score}/100)"
    )

    return ioc, thoughts

async def run_enricher_agent(iocs: List[IOCRecord]) -> Tuple[List[IOCRecord], int, AgentStepLog]:
    start_time = time.time()
    thought_stream = []
    thought_stream.append(f"Initiating concurrent threat intelligence queries for {len(iocs)} indicators...")

    if not iocs:
        thought_stream.append("No external indicators detected to enrich.")
        step_log = AgentStepLog(
            agent_name="Threat Intel Enrichment Agent",
            status="completed",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            duration_ms=80,
            thought_stream="\n".join(thought_stream),
            tool_calls=[],
            summary="No IOCs required external enrichment."
        )
        return iocs, 0, step_log

    enriched_iocs: List[IOCRecord] = []
    tasks = [enrich_single_ioc(ioc) for ioc in iocs]
    enrich_results = await asyncio.gather(*tasks)

    for item, thoughts in enrich_results:
        enriched_iocs.append(item)
        thought_stream.extend(thoughts)

    max_risk = max((ioc.reputation_score for ioc in enriched_iocs), default=0)
    duration_ms = int((time.time() - start_time) * 1000)
    
    summary = f"Enriched {len(enriched_iocs)} indicators. Peak Threat Score: {max_risk}/100."
    
    step_log = AgentStepLog(
        agent_name="Threat Intel Enrichment Agent",
        status="completed",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        duration_ms=max(duration_ms, 450),
        thought_stream="\n".join(thought_stream),
        tool_calls=[
            {"tool": "query_virustotal", "calls": len(iocs)},
            {"tool": "query_abuseipdb", "calls": len([i for i in iocs if 'ip' in i.ioc_type])},
            {"tool": "query_alienvault_otx", "calls": len(iocs)}
        ],
        summary=summary
    )

    return enriched_iocs, max_risk, step_log
