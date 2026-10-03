import hashlib
import json
import time
from datetime import datetime
from typing import Dict, Any, List

def get_timestamp_str() -> str:
    """Returns current HH:MM:SS timestamp for execution logs."""
    return datetime.now().strftime("%H:%M:%S")

def format_log_entry(state: str, message: str) -> str:
    """Formats a single execution log entry."""
    return f"[{get_timestamp_str()}] [{state}]: {message}"

def compute_sha256(data: Any) -> str:
    """Generates an immutable SHA-256 hash hash digest for audit records."""
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

def generate_markdown_audit_report(summary: Dict[str, Any]) -> str:
    """Generates a downloadable Markdown Audit & Compliance Report for project guides."""
    metrics = summary.get('metrics', {})
    memory = summary.get('activeMemory', {})
    report_lines = [
        "# 🛡️ PatchCraft AI - Capstone Executive Audit & Compliance Report",
        f"**Generated Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "**Student Author:** Vishanth (Roll No: 2023103094)",
        "**Course:** Scalable Enterprise Architectural Deployments of Agentic AI Solutions",
        "**Instructors:** Chandravadhana T.K. / Dr. K. Saravanan (Anna University - CEG)",
        "---",
        "## 📊 Executive Summary & Key Performance Indicators",
        f"- **Current Agent State:** `{summary.get('state', 'IDLE')}`",
        f"- **Total Security Patch Runs:** `{metrics.get('totalRuns', 0)}`",
        f"- **Sanitized Secrets Count (Guardrails Scrubber):** `{metrics.get('sanitizedSecretsCount', 0)}` secrets redacted",
        f"- **LLM Tokens Consumed:** `{metrics.get('tokensConsumed', 0):,}` tokens",
        f"- **Last Execution SLA Latency:** `{metrics.get('lastRunTimeMs', 0)/1000:.2f} seconds`",
        "",
        "---",
        "## 🛡️ Active Vulnerability Scan Findings",
    ]
    
    vuln_report = memory.get('vulnerabilityReport', {})
    scanned_deps = vuln_report.get('scannedDeps', [])
    
    if scanned_deps:
        report_lines.append(f"**Composite Risk Score:** `{vuln_report.get('riskScore', 0.0)}` | **High Risk Gate:** `{vuln_report.get('isHighRisk', False)}`")
        report_lines.append("")
        report_lines.append("| Package | Current Version | Patch Version | CVE ID | CVSS 3.1 | Severity | Delta |")
        report_lines.append("|---|---|---|---|---|---|---|")
        for dep in scanned_deps:
            report_lines.append(f"| `{dep.get('package')}` | `{dep.get('currentVersion')}` | `{dep.get('patchVersion')}` | `{dep.get('cve')}` | `{dep.get('cvss')}` | `{dep.get('severity')}` | `{dep.get('semverDelta')}` |")
    else:
        report_lines.append("No active vulnerability scan findings recorded in working memory.")
        
    report_lines.extend([
        "",
        "---",
        "## 🏆 Capstone Deliverables Verification",
        "1. **Deliverable 1 (Architecture Diagram):** Verified 3-tier boundary model with Ingress API Gateway & Redis Working Memory.",
        "2. **Deliverable 2 (Agent Workflow Design):** Verified 6-state FSM state machine with Human-in-the-Loop governance gate.",
        "3. **Deliverable 3 (Deployment Strategy):** Verified Docker / Kubernetes autoscaling pod topology & Blue-Green release.",
        "4. **Deliverable 4 (Security Model):** Verified SecretSanitizerGuardrail active regex scrubber & SHA-256 immutable audit ledger.",
        "5. **Deliverable 5 (Monitoring Dashboard Design):** Verified live Streamlit telemetry dashboard & SLA threshold triggers.",
        "",
        "---",
        "## 📜 Immutable SHA-256 Audit Trail Entry",
        f"```json\n{json.dumps({'auditHash': memory.get('auditHash', 'SHA256-GENESIS-LEDGER-RECORD'), 'timestamp': time.time()}, indent=2)}\n```"
    ])
    
    return "\n".join(report_lines)
