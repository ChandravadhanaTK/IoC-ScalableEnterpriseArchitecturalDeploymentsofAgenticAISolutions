import re
from typing import Tuple, Dict, Any, List

class SecretSanitizerGuardrail:
    """
    Active security guardrail intercepting LLM prompts and context payloads.
    Redacts AWS Keys, GitHub PATs, JWT Tokens, SSH Keys, and API Keys.
    """
    def __init__(self):
        self.patterns = [
            (r'AKIA[0-9A-Z]{16}', '[REDACTED_AWS_ACCESS_KEY]'),
            (r'ghp_[a-zA-Z0-9]{36}', '[REDACTED_GITHUB_PAT]'),
            (r'eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+', '[REDACTED_JWT_TOKEN]'),
            (r'-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA )?PRIVATE KEY-----', '[REDACTED_SSH_PRIVATE_KEY]'),
            (r'sk-[a-zA-Z0-9]{32,64}', '[REDACTED_API_KEY]'),
            (r'xox[a-zA-Z0-9_-]{10,48}', '[REDACTED_SLACK_TOKEN]')
        ]

    def sanitize(self, text: str) -> Tuple[str, int, List[str]]:
        if not isinstance(text, str):
            return text, 0, []
        
        total_scrubbed = 0
        detected_types = []
        sanitized = text
        
        for pattern, replacement in self.patterns:
            matches = re.findall(pattern, sanitized)
            if matches:
                count = len(matches)
                total_scrubbed += count
                detected_types.append(replacement.replace('[REDACTED_', '').replace(']', ''))
                sanitized = re.sub(pattern, replacement, sanitized)
                
        return sanitized, total_scrubbed, detected_types


class CompliancePolicyGuardrail:
    """
    Evaluates enterprise governance rules such as prohibited OSS licenses (AGPL/GPL)
    and enforces maximum allowable CVSS score thresholds.
    """
    def __init__(self, max_allowed_cvss: float = 9.0):
        self.max_allowed_cvss = max_allowed_cvss
        self.prohibited_licenses = ["AGPL-3.0", "GPL-3.0-only"]

    def evaluate_dependency(self, package_name: str, cvss_score: float, license_name: str = "MIT") -> Dict[str, Any]:
        violations = []
        if cvss_score > self.max_allowed_cvss:
            violations.append(f"CVSS score {cvss_score} exceeds maximum allowed baseline ({self.max_allowed_cvss})")
        if license_name in self.prohibited_licenses:
            violations.append(f"License '{license_name}' violates enterprise compliance policy")
            
        return {
            "passed": len(violations) == 0,
            "violations": violations,
            "packageName": package_name
        }
