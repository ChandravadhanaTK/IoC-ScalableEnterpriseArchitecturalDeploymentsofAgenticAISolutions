"""Input and output guardrails.

Input side (runs BEFORE any model call):
  * length limit
  * prompt-injection / jailbreak heuristics (scored, not just matched)
  * PII + secret redaction, so raw personal data never reaches the LLM or logs

Output side (runs AFTER the model, BEFORE the user sees text):
  * secrets / credential leak filter
  * redaction of any PII the model echoed back

Heuristics are intentionally transparent and unit-tested. In production put a
managed classifier (e.g. a moderation endpoint) in front of these as a second
layer; the interface (`InputVerdict`) stays the same.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

INJECTION_PATTERNS: list[tuple[str, float]] = [
    (r"ignore (all |any |the )?(previous|prior|above|earlier) (instructions|rules|prompts?)", 0.9),
    (r"disregard (your|all|the) (rules|instructions|guidelines|policy)", 0.9),
    (r"(reveal|print|show|repeat|output) (me )?(your|the) (system|hidden|initial) (prompt|instructions)", 0.9),
    (r"\byou are now\b", 0.5),
    (r"\b(developer|dan|god|jailbreak) mode\b", 0.8),
    (r"pretend (to be|you are) (an? )?(admin|administrator|approver|root)", 0.8),
    (r"(skip|bypass|without) (the )?(approval|verification|manager sign-?off)", 0.7),
    (r"act as (an? )?(admin|administrator|approver)", 0.6),
    (r"</?(system|assistant|tool)>", 0.7),
    (r"(grant|give) me (domain )?admin (rights|access|privileges)", 0.6),
    (r"base64[:\s]+[A-Za-z0-9+/=]{40,}", 0.5),
]
INJECTION_BLOCK_THRESHOLD = 0.7

PII_PATTERNS: dict[str, str] = {
    "EMAIL": r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
    "CARD": r"\b(?:\d[ -]?){13,19}\b",
    "AADHAAR": r"\b\d{4}[ -]?\d{4}[ -]?\d{4}\b",
    "PAN": r"\b[A-Z]{5}\d{4}[A-Z]\b",
    "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
    "PHONE": r"(?<!\d)(?:\+?\d{1,3}[ -]?)?(?:\d[ -]?){9}\d(?!\d)",
}
SECRET_PATTERNS: dict[str, str] = {
    "PASSWORD": r"(?i)\b(password|passwd|pwd|passcode)\s*(is|=|:)\s*\S+",
    "API_KEY": r"\b(sk|pk|rk)[-_][A-Za-z0-9_-]{16,}\b",
    "AWS_KEY": r"\bAKIA[0-9A-Z]{16}\b",
    "JWT": r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b",
    "PRIVATE_KEY": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
}


@dataclass
class InputVerdict:
    allowed: bool
    redacted_text: str
    injection_score: float = 0.0
    injection_signals: list[str] = field(default_factory=list)
    pii_found: list[str] = field(default_factory=list)
    secrets_found: list[str] = field(default_factory=list)
    reason: str | None = None

    def to_dict(self) -> dict:
        return {
            "allowed": self.allowed,
            "injection_score": round(self.injection_score, 2),
            "injection_signals": self.injection_signals,
            "pii_found": self.pii_found,
            "secrets_found": self.secrets_found,
            "reason": self.reason,
        }


def _luhn_ok(digits: str) -> bool:
    nums = [int(d) for d in digits if d.isdigit()]
    if not 13 <= len(nums) <= 19:
        return False
    total = 0
    for i, n in enumerate(reversed(nums)):
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0


def injection_score(text: str) -> tuple[float, list[str]]:
    lowered = text.lower()
    score, signals = 0.0, []
    for pattern, weight in INJECTION_PATTERNS:
        if re.search(pattern, lowered):
            signals.append(pattern)
            # Combine like independent probabilities so multiple weak signals add up.
            score = 1 - (1 - score) * (1 - weight)
    return score, signals


def redact(text: str) -> tuple[str, list[str], list[str]]:
    pii, secrets = [], []
    out = text
    for label, pattern in SECRET_PATTERNS.items():
        if re.search(pattern, out):
            secrets.append(label)
            out = re.sub(pattern, f"[REDACTED_{label}]", out)
    for label, pattern in PII_PATTERNS.items():
        def _sub(m: re.Match, label=label) -> str:
            if label == "CARD" and not _luhn_ok(m.group(0)):
                return m.group(0)
            pii.append(label)
            return f"[{label}]"
        out = re.sub(pattern, _sub, out)
    return out, sorted(set(pii)), sorted(set(secrets))


def check_input(text: str, max_chars: int) -> InputVerdict:
    if not text or not text.strip():
        return InputVerdict(False, "", reason="empty_message")
    if len(text) > max_chars:
        return InputVerdict(False, "", reason="message_too_long")
    score, signals = injection_score(text)
    redacted, pii, secrets = redact(text)
    allowed = score < INJECTION_BLOCK_THRESHOLD
    return InputVerdict(
        allowed=allowed,
        redacted_text=redacted,
        injection_score=score,
        injection_signals=signals,
        pii_found=pii,
        secrets_found=secrets,
        reason=None if allowed else "prompt_injection_suspected",
    )


def check_output(text: str) -> tuple[str, list[str]]:
    """Scrub anything credential-like or personal from model output."""
    cleaned, pii, secrets = redact(text)
    return cleaned, sorted(set(pii + secrets))
