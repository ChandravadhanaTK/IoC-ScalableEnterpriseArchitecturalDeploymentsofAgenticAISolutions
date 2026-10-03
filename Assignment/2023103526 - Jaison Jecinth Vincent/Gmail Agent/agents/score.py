import re

from agents.config import Config
from agents.models import Thread


# NOTE: example keyword set for one domain. Prefer dynamic rules via
# agents/rules.py::match_thread + candidate_threads_with_rules for
# general-purpose parsing; these legacy helpers remain for backwards compat.
KEYWORD_PATTERNS = [
    r"sponsor", r"partnership", r"funding", r"contribute", r"support",
    r"csr", r"corporate relations", r"donation",
    r"₹", r"rs[.\s]", r"inr", r"usd", r"amount", r"budget",
]

PERSONAL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "live.com", "rediffmail.com",
}


def keyword_hits(text: str) -> list:
    lowered = text.lower()
    return [p for p in KEYWORD_PATTERNS if re.search(p, lowered)]


def domain_score(email_addr) -> float:
    if not email_addr or "@" not in email_addr:
        return 0.0
    domain = email_addr.split("@")[-1].lower()
    if not domain or "." not in domain:
        return 0.0
    if domain in PERSONAL_DOMAINS:
        return 0.0
    for suffix in (".ac.in", ".edu", ".edu.in"):
        if domain.endswith(suffix):
            return 0.0
    return 1.0


def score_thread(thread: Thread, cfg: Config) -> float:
    text = thread.subject + "\n" + thread.full_text
    kw_score = cfg.score_keyword_weight * len(keyword_hits(text))
    dom_score = 0.0
    if thread.direction_hint in ("inbound", "mixed"):
        for m in thread.messages:
            ds = domain_score(m.from_email)
            if ds > dom_score:
                dom_score = ds
    return kw_score + cfg.score_domain_weight * dom_score


def candidate_threads(threads, cfg):
    result = {}
    for t in threads:
        s = score_thread(t, cfg)
        if s >= cfg.candidate_threshold:
            result[t.thread_id] = s
    return result


def candidate_threads_with_rules(threads, rules: dict) -> dict:
    """Score with dynamic rules. Returns {thread_id: {'score': float, 'matched': [...]}}."""
    from agents.rules import match_thread
    out = {}
    threshold = float(rules.get("threshold", 2.0))
    for t in threads:
        s, matched = match_thread(t, rules)
        if s >= threshold:
            out[t.thread_id] = {"score": s, "matched": matched}
    return out