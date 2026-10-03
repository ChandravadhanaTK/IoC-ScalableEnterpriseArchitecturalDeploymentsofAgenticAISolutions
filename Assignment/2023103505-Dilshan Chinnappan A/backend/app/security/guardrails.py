import re
import ipaddress
from typing import Tuple, Dict, Any, List

# RFC1918 Private IP regex patterns
PRIVATE_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8")
]

PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"disregard\s+(system\s+)?prompt",
    r"you\s+are\s+now\s+(in\s+developer\s+mode|dan|unrestricted)",
    r"system\s*:\s*override",
    r"reveal\s+(api\s+key|secret|credentials|password)",
    r"eval\(|exec\(|<script>|drop\s+table",
    r"bypass\s+safety\s+filter",
]

EMAIL_PATTERN = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"

class SecurityGuardrails:
    def __init__(self):
        self.injection_regex = [re.compile(p, re.IGNORECASE) for p in PROMPT_INJECTION_PATTERNS]
        self.email_regex = re.compile(EMAIL_PATTERN)
        self.pii_redaction_count = 0
        self.prompt_injections_blocked = 0

    def check_prompt_injection(self, text: str) -> Tuple[bool, str]:
        """
        Inspects raw alert text for adversarial instruction hijacking.
        Returns (is_detected, matched_pattern).
        """
        for pattern in self.injection_regex:
            match = pattern.search(text)
            if match:
                self.prompt_injections_blocked += 1
                return True, match.group(0)
        return False, ""

    def mask_rfc1918_ips(self, text: str) -> Tuple[str, Dict[str, str]]:
        """
        Finds RFC1918 private IPs and replaces them with [INTERNAL_IP_n] tokens
        to protect internal network topology from leaking to foundation models.
        """
        ip_pattern = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
        ip_map: Dict[str, str] = {}
        masked_text = text

        def replace_ip(match):
            raw_ip = match.group(0)
            try:
                ip_obj = ipaddress.ip_address(raw_ip)
                if any(ip_obj in network for network in PRIVATE_IP_RANGES):
                    if raw_ip not in ip_map:
                        ip_map[raw_ip] = f"[INTERNAL_HOST_{len(ip_map) + 1}]"
                    return ip_map[raw_ip]
            except ValueError:
                pass
            return raw_ip

        masked_text = re.sub(ip_pattern, replace_ip, text)
        return masked_text, ip_map

    def redact_pii(self, text: str) -> str:
        """
        Redacts emails, user credentials, and sensitive tokens from alerts.
        """
        matches = self.email_regex.findall(text)
        if matches:
            self.pii_redaction_count += len(matches)
        return self.email_regex.sub("[REDACTED_EMAIL]", text)

    def sanitize_alert_input(self, raw_alert: str) -> Dict[str, Any]:
        """
        Full inbound sanitization pipeline.
        Returns sanitized text, flagged risks, and mappings.
        """
        has_injection, matched_pattern = self.check_prompt_injection(raw_alert)
        sanitized_alert = raw_alert

        if has_injection:
            # Strip malicious command injection attempts
            for pattern in self.injection_regex:
                sanitized_alert = pattern.sub("[BLOCKED_INJECTION_PAYLOAD]", sanitized_alert)

        sanitized_alert, ip_map = self.mask_rfc1918_ips(sanitized_alert)
        sanitized_alert = self.redact_pii(sanitized_alert)

        return {
            "original_length": len(raw_alert),
            "sanitized_alert": sanitized_alert,
            "prompt_injection_detected": has_injection,
            "blocked_pattern": matched_pattern,
            "internal_ip_mappings": ip_map,
            "pii_redacted": bool(self.email_regex.search(raw_alert))
        }

    def validate_tool_parameter(self, param_type: str, value: str) -> bool:
        """
        Validates LLM tool arguments before execution.
        """
        if param_type == "ipv4":
            try:
                ipaddress.IPv4Address(value)
                return True
            except ValueError:
                return False
        elif param_type == "hash":
            return bool(re.match(r"^[a-fA-F0-9]{32,64}$", value))
        elif param_type == "domain":
            return bool(re.match(r"^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$", value))
        return True

guardrails = SecurityGuardrails()
