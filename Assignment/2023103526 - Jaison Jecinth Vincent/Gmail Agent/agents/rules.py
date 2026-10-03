"""Dynamic parsing rules: criteria (scoring) + categories (classification).

Seeded from legacy hardcodes: score.KEYWORD_PATTERNS and the 7 VALID_OUTCOMES.
"""
import re

FIELDS = {"subject_and_body", "subject", "body", "from_email", "to_email"}
MATCHES = {"regex", "contains", "exact", "corporate_domain"}

PERSONAL_DOMAINS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "rediffmail.com"}

DEFAULT_RULES: dict = {
    "version": 1,
    "threshold": 2.0,
    "criteria": [
        {"id": "sponsor_kw", "label": "Sponsorship keywords", "field": "subject_and_body", "match": "regex", "pattern": r"sponsor|partnership|funding|csr|donation|contribute", "weight": 2.0},
        {"id": "money_markers", "label": "Money markers", "field": "subject_and_body", "match": "regex", "pattern": r"₹|rs[.\s]|inr|usd|amount|budget", "weight": 1.0},
        {"id": "corp_sender", "label": "Corporate sender", "field": "from_email", "match": "corporate_domain", "pattern": "", "weight": 1.0},
    ],
    "categories": [
        {"name": "positive", "description": "They agreed or expressed willingness to sponsor.", "examples": ["We are happy to sponsor your event."]},
        {"name": "negotiation", "description": "Discussing amounts or terms of sponsorship.", "examples": ["We can sponsor Rs 10,000 if our logo is included."]},
        {"name": "completed", "description": "Sponsorship fulfilled (e.g. payment processed).", "examples": ["Payment processed."]},
        {"name": "interested_uncommitted", "description": "Positive leaning but undecided.", "examples": ["We will discuss internally."]},
        {"name": "negative", "description": "They declined to sponsor.", "examples": ["We cannot sponsor this year."]},
        {"name": "no_response", "description": "No meaningful reply from the other side.", "examples": ["No reply received."]},
        {"name": "unrelated", "description": "Not a sponsorship conversation.", "examples": ["Please fix the lab projector."]},
    ],
}


def _field_text(thread, field: str) -> str:
    if field == "subject":
        return thread.subject or ""
    if field == "body":
        return "\n".join(m.body_text or "" for m in thread.messages)
    if field == "from_email":
        return (thread.messages[0].from_email or "") if thread.messages else ""
    if field == "to_email":
        tos = []
        for m in thread.messages:
            tos.extend(m.to or [])
        return ", ".join(tos)
    return (thread.subject or "") + "\n" + "\n".join(m.body_text or "" for m in thread.messages)


def _is_corporate(email: str) -> bool:
    if not email or "@" not in email:
        return False
    domain = email.split("@")[-1].lower()
    if not domain or "." not in domain:
        return False
    if domain in PERSONAL_DOMAINS:
        return False
    for suffix in (".ac.in", ".edu", ".edu.in"):
        if domain.endswith(suffix):
            return False
    return True


def _matches(text: str, match: str, pattern: str) -> bool:
    if match == "corporate_domain":
        return _is_corporate(text)
    if match == "contains":
        return (pattern or "").lower() in (text or "").lower()
    if match == "exact":
        return (text or "").strip().lower() == (pattern or "").strip().lower()
    try:
        return re.search(pattern or "", text or "", re.IGNORECASE) is not None
    except re.error:
        return False


def match_thread(thread, rules: dict) -> tuple[float, list[str]]:
    score = 0.0
    matched: list[str] = []
    for c in rules.get("criteria", []):
        try:
            if _matches(_field_text(thread, c.get("field", "subject_and_body")), c.get("match", "regex"), c.get("pattern", "")):
                score += float(c.get("weight", 0.0))
                matched.append(c.get("id", ""))
        except Exception:
            continue
    return score, matched


def validate_rules(data: dict) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["rules must be an object"]
    version = data.get("version")
    if isinstance(version, bool) or not isinstance(version, int) or version < 1:
        errors.append("version must be an integer >= 1")
    threshold = data.get("threshold")
    if isinstance(threshold, bool) or not isinstance(threshold, (int, float)) or float(threshold) < 0:
        errors.append("threshold must be a number >= 0")
    if not isinstance(data.get("criteria"), list):
        errors.append("criteria must be a list")
        return errors
    if not isinstance(data.get("categories"), list) or len(data.get("categories", [])) < 1:
        errors.append("at least one category is required")
    seen_ids: set[str] = set()
    for c in data.get("criteria", []):
        if not isinstance(c, dict):
            errors.append("each criterion must be an object")
            continue
        cid = c.get("id", "")
        if not cid or not re.match(r"^[a-z0-9_]+$", str(cid)):
            errors.append(f"criterion id must match ^[a-z0-9_]+$: {cid!r}")
        if cid in seen_ids:
            errors.append(f"duplicate criterion id: {cid}")
        seen_ids.add(cid)
        if c.get("field") not in FIELDS:
            errors.append(f"criterion {cid}: unknown field {c.get('field')!r}")
        if c.get("match") not in MATCHES:
            errors.append(f"criterion {cid}: unknown match {c.get('match')!r}")
        if c.get("match") == "regex":
            try:
                re.compile(c.get("pattern", "") or "")
            except re.error as e:
                errors.append(f"criterion {cid}: bad regex: {e}")
        if c.get("match") in ("regex", "contains", "exact"):
            pattern = c.get("pattern", "")
            if not isinstance(pattern, str) or not pattern.strip():
                errors.append(f"criterion {cid}: pattern must be non-empty for match {c.get('match')!r}")
        try:
            w = float(c.get("weight", 0.0))
            if w < 0:
                errors.append(f"criterion {cid}: weight must be >= 0")
        except (TypeError, ValueError):
            errors.append(f"criterion {cid}: weight must be a number")
    seen_names: set[str] = set()
    for cat in data.get("categories", []):
        if not isinstance(cat, dict):
            errors.append("each category must be an object")
            continue
        name = (cat.get("name") or "").strip()
        if not name or not re.match(r"^[a-z0-9_]+$", name):
            errors.append(f"category name must match ^[a-z0-9_]+$: {name!r}")
        if name in seen_names:
            errors.append(f"duplicate category name: {name}")
        seen_names.add(name)
        if not (cat.get("description") or "").strip():
            errors.append(f"category {name}: description is required")
    for key in ("api_key", "apikey", "secret", "token"):
        blob = str(data)
        if key in blob.lower():
            errors.append(f"rules must not contain secrets (found {key!r})")
            break
    return errors


def build_system_prompt(association: str, use_case_or_categories=None, categories=None) -> str:
    """Generic classifier prompt. New signature: (org, use_case, categories).

    Legacy 2-arg form build_system_prompt(org, categories) is still accepted.
    """
    if categories is None and isinstance(use_case_or_categories, list):
        use_case = "general email classification"
        cats = use_case_or_categories
    else:
        use_case = use_case_or_categories or "general email classification"
        cats = categories or []
    lines = [f"You analyze email threads from {association} for {use_case}.", ""]
    lines.append("Classify each thread with exactly one outcome:")
    for cat in cats:
        lines.append(f"- {cat['name']}: {cat.get('description', '')}")
    lines += [
        "",
        "Extract every field ONLY from evidence present in the thread. Never invent names, amounts, or numbers.",
        "If a field cannot be determined, set it to null.",
        "evidence is a short VERBATIM quote (<=200 chars) from the thread supporting the outcome.",
        "confidence is a number 0.0 to 1.0.",
        "Return a JSON array; one object per thread, each with an 'index' field matching the input position (0-based).",
    ]
    return "\n".join(lines)
