import re
from typing import Tuple, List, Dict, Any

# Suspect prompt injection patterns
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?",
    r"system\s+prompt\s+override",
    r"disregard\s+(all\s+)?rules?",
    r"act\s+as\s+(an?\s+)?admin(istrator)?",
    r"bypass\s+(approval|security|guardrails?)",
    r"reveal\s+(internal\s+)?(keys?|passwords?|prompts?|secrets?)",
    r"execute\s+unauthorized",
    r"---END\s+SYSTEM\s+PROMPT---",
    r"<script>.*?</script>",
    r"drop\s+database",
    r"grant\s+all\s+privileges",
]

# Whitelist of permissible tools
ALLOWED_TOOLS = {
    "get_order_details",
    "get_order_status",
    "get_customer_orders",
    "create_refund_request",
    "create_replacement_request",
    "create_support_ticket",
    "update_complaint_status",
    "send_customer_notification",
    "search_policies",
}

def detect_prompt_injection(text: str) -> Tuple[bool, str]:
    """Inspects text for adversarial prompt injection patterns.
    Returns (is_injected, matched_pattern_reason)."""
    if not text:
        return False, ""

    lower_text = text.lower()
    for pattern in INJECTION_PATTERNS:
        match = re.search(pattern, lower_text, re.IGNORECASE)
        if match:
            return True, f"Suspicious instruction detected: '{match.group(0)}'"

    return False, ""

def is_tool_allowed(tool_name: str) -> bool:
    """Verifies that the requested tool is explicitly whitelisted."""
    return tool_name in ALLOWED_TOOLS

def mask_sensitive_data(text: str) -> str:
    """Masks credit card numbers, email passwords, and JWT tokens in logged text."""
    if not text:
        return ""

    # Mask credit card numbers (13-16 digits)
    masked = re.sub(r"\b(?:\d[ -]*?){13,16}\b", "[MASKED_CARD_NUMBER]", text)

    # Mask JWT tokens
    masked = re.sub(r"eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+", "[MASKED_JWT_TOKEN]", masked)

    # Mask passwords in JSON/key-value
    masked = re.sub(r'("password"\s*:\s*)"[^"]+"', r'\1"[PROTECTED]"', masked, flags=re.IGNORECASE)

    return masked
