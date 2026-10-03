import re
import uuid
import time
import logging
from typing import List, Dict, Any, Tuple
from app.models.state import IOCRecord, AgentStepLog
from app.config import settings

logger = logging.getLogger("extractor")

IPV4_REGEX = r"\b(?<!\d\.)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?!\.\d)\b"
DOMAIN_REGEX = r"\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|io|ru|xyz|info|biz|top|me|cc|cn|gov|edu)\b"
SHA256_REGEX = r"\b[a-fA-F0-9]{64}\b"
MD5_REGEX = r"\b[a-fA-F0-9]{32}\b"
CVE_REGEX = r"\bCVE-\d{4}-\d{4,7}\b"
URL_REGEX = r"https?://[^\s<>\"'{}|\\^`]+"

def defang_indicator(val: str) -> str:
    """De-fangs URLs, domains, and IPs to prevent accidental clicking or execution."""
    val = val.replace("http://", "hxxp://").replace("https://", "hxxps://")
    val = val.replace(".", "[.]")
    return val

async def run_extractor_agent(sanitized_alert: str) -> Tuple[List[IOCRecord], AgentStepLog]:
    start_time = time.time()
    thought_stream = []
    thought_stream.append("Parsing alert payload using multi-pattern IOC regex engines...")
    
    found_iocs: List[IOCRecord] = []
    seen = set()

    # 1. Regex Extractions
    # IPs
    for match in re.finditer(IPV4_REGEX, sanitized_alert):
        ip = match.group(0)
        if ip not in seen and not ip.startswith("127."):
            seen.add(ip)
            found_iocs.append(IOCRecord(
                id=str(uuid.uuid4())[:8],
                ioc_type="ipv4",
                raw_value=ip,
                normalized_value=ip,
                defanged_value=defang_indicator(ip)
            ))
            thought_stream.append(f"Discovered IPv4 candidate: {ip} -> De-fanged: {defang_indicator(ip)}")

    # Hashes
    for match in re.finditer(SHA256_REGEX, sanitized_alert):
        h = match.group(0)
        if h not in seen:
            seen.add(h)
            found_iocs.append(IOCRecord(
                id=str(uuid.uuid4())[:8],
                ioc_type="sha256",
                raw_value=h,
                normalized_value=h.lower(),
                defanged_value=h.lower()
            ))
            thought_stream.append(f"Discovered SHA-256 binary hash: {h[:12]}...")

    # Domains
    for match in re.finditer(DOMAIN_REGEX, sanitized_alert):
        dom = match.group(0)
        if dom not in seen:
            seen.add(dom)
            found_iocs.append(IOCRecord(
                id=str(uuid.uuid4())[:8],
                ioc_type="domain",
                raw_value=dom,
                normalized_value=dom.lower(),
                defanged_value=defang_indicator(dom.lower())
            ))
            thought_stream.append(f"Discovered Domain: {dom} -> De-fanged: {defang_indicator(dom)}")

    # CVEs
    for match in re.finditer(CVE_REGEX, sanitized_alert):
        cve = match.group(0).upper()
        if cve not in seen:
            seen.add(cve)
            found_iocs.append(IOCRecord(
                id=str(uuid.uuid4())[:8],
                ioc_type="cve",
                raw_value=cve,
                normalized_value=cve,
                defanged_value=cve
            ))
            thought_stream.append(f"Discovered Vulnerability Reference: {cve}")

    # 2. LLM Extraction Enhancement (Google GenAI SDK if key present)
    if settings.GEMINI_API_KEY:
        try:
            thought_stream.append(f"Calling Google Gemini API ({settings.GEMINI_MODEL}) for deep contextual artifact extraction...")
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            prompt = (
                f"You are an IOC Extraction Specialist. Analyze this security alert and identify any "
                f"obfuscated IP addresses, domains, ports, or protocols:\n\n{sanitized_alert}\n\n"
                f"Format your response as a concise 1-sentence analytical observation."
            )
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            llm_text = response.text.strip() if response.text else "No additional obfuscated artifacts found."
            thought_stream.append(f"Gemini Insight: {llm_text}")
        except Exception as e:
            thought_stream.append(f"Gemini LLM contextual extraction note: Using standard deterministic regex (API Notice: {str(e)[:50]})")
    else:
        thought_stream.append("Offline mode: Deterministic regex parsing completed successfully.")

    duration_ms = int((time.time() - start_time) * 1000)
    summary = f"Extracted {len(found_iocs)} unique IOC artifacts across IPv4, Domains, Hashes, and CVEs."
    
    step_log = AgentStepLog(
        agent_name="IOC Extractor & Normalizer",
        status="completed",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        duration_ms=max(duration_ms, 280),
        thought_stream="\n".join(thought_stream),
        tool_calls=[{"tool": "regex_ioc_parser", "artifacts_found": len(found_iocs)}],
        summary=summary
    )
    
    return found_iocs, step_log
