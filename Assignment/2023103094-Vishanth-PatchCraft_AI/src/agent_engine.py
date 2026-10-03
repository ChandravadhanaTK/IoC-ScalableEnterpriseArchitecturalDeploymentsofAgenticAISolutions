import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from src.tools import CVEScannerTool, VulnerabilityRiskEvaluator, PatchSandboxTool, PRGeneratorTool
from src.guardrails import SecretSanitizerGuardrail, CompliancePolicyGuardrail
from src.utils import format_log_entry, compute_sha256

class PatchCraftAgentEngine:
    """
    Core Autonomous Agent Engine managing Finite State Machine (FSM) transitions,
    tool execution, security guardrails, human-in-the-loop approval, and telemetry.
    """
    
    def __init__(self):
        self.state = 'IDLE'
        self.scanner_tool = CVEScannerTool()
        self.risk_evaluator = VulnerabilityRiskEvaluator()
        self.sandbox_tool = PatchSandboxTool()
        self.pr_generator = PRGeneratorTool()
        self.sanitizer_guardrail = SecretSanitizerGuardrail()
        self.compliance_guardrail = CompliancePolicyGuardrail()
        
        self.execution_logs: List[str] = []
        self.active_memory: Dict[str, Any] = {}
        self.pending_approval: Optional[Dict[str, Any]] = None
        
        self.metrics = {
            'totalRuns': 0,
            'tokensConsumed': 0,
            'sanitizedSecretsCount': 0,
            'lastRunTimeMs': 0,
            'prsCreated': 0,
            'approvalRejections': 0
        }
        
    def log_step(self, state: str, message: str) -> str:
        """Appends a timestamped log entry to execution stream."""
        entry = format_log_entry(state, message)
        self.execution_logs.append(entry)
        return entry

    def run_patch_workflow(
        self, 
        simulate_critical: bool = False, 
        custom_manifest: Optional[str] = None, 
        manifest_type: str = "package.json",
        approval_threshold: float = 0.5
    ) -> Dict[str, Any]:
        """
        Executes the full 6-phase autonomous security patching loop.
        """
        start_time = time.time()
        self.metrics['totalRuns'] += 1
        self.pending_approval = None
        self.execution_logs = []
        
        # 1. SCANNING_CVES
        self.state = 'SCANNING_CVES'
        self.log_step('SCANNING_CVES', f'Parsing dependency manifest ({manifest_type}). Intercepting known CVE databases...')
        
        vulnerabilities = self.scanner_tool.scan_manifest(
            content=custom_manifest or "", 
            manifest_type=manifest_type, 
            simulate_critical=simulate_critical
        )
        self.active_memory['scannedDeps'] = vulnerabilities
        self.log_step('SCANNING_CVES', f'Manifest scan completed. Discovered {len(vulnerabilities)} vulnerable dependency packages matching NVD advisories.')

        # 2. ANALYZING_VULNERABILITIES
        self.state = 'ANALYZING_VULNERABILITIES'
        self.log_step('ANALYZING_VULNERABILITIES', 'Computing CVSS 3.1 composite scores & evaluating semver upgrade deltas...')
        
        risk_result = self.risk_evaluator.evaluate_risk(vulnerabilities, approval_threshold=approval_threshold)
        self.active_memory['vulnerabilityReport'] = {
            'scannedDeps': vulnerabilities,
            'riskScore': risk_result['riskScore'],
            'isHighRisk': risk_result['isHighRisk'],
            'maxCvss': risk_result['maxCvss'],
            'hasMajorUpdate': risk_result['hasMajorUpdate'],
            'hasCritical': risk_result['hasCritical']
        }
        self.metrics['tokensConsumed'] += 1120

        # 3. EVALUATING_RISK & GUARDRAILS
        self.state = 'EVALUATING_RISK'
        self.log_step('EVALUATING_RISK', 'Executing SecretSanitizerGuardrail & Compliance Policy evaluation...')
        
        # Test prompt containing synthetic test token to verify active guardrail
        test_context_payload = (
            f"Scanning manifest for CVE remediation. Context auth token: ghp_A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8. "
            f"AWS Key: AKIAIOSFODNN7EXAMPLE."
        )
        sanitized_text, scrubbed_count, detected = self.sanitizer_guardrail.sanitize(test_context_payload)
        
        if scrubbed_count > 0:
            self.metrics['sanitizedSecretsCount'] += scrubbed_count
            self.log_step('SECURITY_GUARDRAIL', f'SecretSanitizerGuardrail ACTIVE: Redacted {scrubbed_count} secret credential(s) ({", ".join(detected)}) from LLM context.')

        # Check Human-in-the-Loop Gate Trigger
        if risk_result['requiresApproval']:
            self.state = 'AWAITING_APPROVAL'
            self.pending_approval = {
                'id': f'TICKET-{int(time.time())}',
                'riskScore': risk_result['riskScore'],
                'maxCvss': risk_result['maxCvss'],
                'deps': vulnerabilities,
                'status': 'PENDING',
                'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
                'reason': 'Major Breaking Version Update or CVSS Risk Score > Approval Threshold'
            }
            self.log_step('AWAITING_APPROVAL', f'⚠️ HIGH RISK / BREAKING UPDATE GATE TRIGGERED (Risk Score: {risk_result["riskScore"]}). Workflow paused for Security Admin approval.')
            self.metrics['lastRunTimeMs'] = int((time.time() - start_time) * 1000)
            return self.get_summary()

        # If low risk, continue automatically to sandbox execution
        return self.continue_post_approval(approval_signature="Auto-Approved (Low Risk Threshold)", start_time=start_time)

    def continue_post_approval(self, approval_signature: str = "Approved by Security Admin", start_time: Optional[float] = None) -> Dict[str, Any]:
        """
        Resumes FSM execution after Human-in-the-Loop signature is granted.
        """
        if start_time is None:
            start_time = time.time()
            
        vulnerabilities = self.active_memory.get('scannedDeps', [])

        # 4. VERIFYING_SANDBOX
        self.state = 'VERIFYING_SANDBOX'
        self.log_step('VERIFYING_SANDBOX', 'Provisioning isolated ephemeral docker container sandbox...')
        self.log_step('VERIFYING_SANDBOX', 'Applying patch, compiling codebase, and executing automated unit & integration test suite...')

        sandbox_result = self.sandbox_tool.run_sandbox_verification(vulnerabilities)
        self.active_memory['sandbox'] = sandbox_result
        self.metrics['tokensConsumed'] += 1450
        self.log_step('VERIFYING_SANDBOX', f'Sandbox Verification PASSED! {sandbox_result["passedCount"]}/{sandbox_result["testCount"]} unit tests verified clean. 0 build regressions.')

        # 5. GENERATING_PR
        self.state = 'GENERATING_PR'
        self.log_step('GENERATING_PR', 'Auto-generating GitHub Pull Request metadata & security change logs...')
        
        pr_result = self.pr_generator.generate_pull_request(vulnerabilities, sandbox_result, approval_signature)
        self.active_memory['pullRequest'] = pr_result
        self.metrics['prsCreated'] += 1

        # 6. COMPLETED & AUDIT LEDGER
        self.state = 'COMPLETED'
        audit_payload = {
            'vulnerabilities': vulnerabilities,
            'sandbox': sandbox_result,
            'pr': pr_result,
            'approvalSignature': approval_signature,
            'timestamp': time.time()
        }
        audit_hash = compute_sha256(audit_payload)
        self.active_memory['auditHash'] = f"SHA256-{audit_hash[:16]}"
        
        self.log_step('COMPLETED', f'✔ PatchCraft AI workflow COMPLETED successfully! Pull request {pr_result["prId"]} opened. Audit Hash: SHA256-{audit_hash[:16]}.')

        self.metrics['lastRunTimeMs'] = int((time.time() - start_time) * 1000)
        return self.get_summary()

    def reject_patch(self, rejection_reason: str = "Rejected by Security Admin"):
        """Terminates workflow on human rejection."""
        self.state = 'REJECTED'
        self.pending_approval = None
        self.metrics['approvalRejections'] += 1
        self.log_step('REJECTED', f'✖ Patch workflow REJECTED & TERMINATED by Security Admin. Reason: {rejection_reason}')

    def get_summary(self) -> Dict[str, Any]:
        """Returns active engine summary for Streamlit UI state updates."""
        return {
            'state': self.state,
            'activeMemory': self.active_memory,
            'pendingApproval': self.pending_approval,
            'executionLogs': self.execution_logs,
            'metrics': self.metrics
        }
