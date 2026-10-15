import json
import time

from agents import store
from agents.batching import make_batches
from agents.config import Config
from agents.llm import LLMClient, LLMError
from agents.models import Thread, Classification, validate_classification


def _org_of(cfg: Config) -> str:
    return getattr(cfg, "org_name", None) or getattr(cfg, "association_name", None) or "Example Org"


def _use_case_of(cfg: Config) -> str:
    return getattr(cfg, "use_case", None) or "general email classification"


def CLASSIFY_SYSTEM(cfg: Config) -> str:
    org = _org_of(cfg)
    use_case = _use_case_of(cfg)
    events = ", ".join(getattr(cfg, "events", None) or [])
    lines = [
        f"You analyze email threads from {org} for {use_case}.",
    ]
    if events:
        lines.append(f"Known topics include: {events}.")
    lines += [
        "",
        "Classify each thread with exactly one outcome:",
        "- positive: they agreed or expressed willingness to proceed",
        "- negotiation: they are discussing amounts or terms",
        "- completed: the matter is fulfilled (e.g. payment processed)",
        "- interested_uncommitted: positive leaning but undecided (e.g. 'will discuss internally')",
        "- negative: they declined",
        "- no_response: no meaningful reply from the other side",
        "- unrelated: not relevant to this use case",
        "",
        "direction is relative to the organization (e.g. inbound vs outbound). Preserve the value returned by the model when present; otherwise use 'unknown'.",
        "Extract every field ONLY from evidence present in the thread. Never invent names, amounts, or numbers.",
        "If a field cannot be determined, set it to null.",
        "conversation_date is the YYYY-MM-DD date of the evidence message.",
        "amount is the exact string including currency (e.g. '25,000' or 'Rs 10,000'). For in-kind support set amount=null, amount_type='in_kind' and describe it in in_kind_note.",
        "evidence is a short VERBATIM quote (<=200 chars) from the thread supporting the outcome.",
        "confidence is a number 0.0 to 1.0.",
        "",
        "Return a JSON array; one object per thread, each with an 'index' field matching the input position (0-based).",
    ]
    return "\n".join(lines)


def build_classify_prompt(threads, cfg: Config) -> str:
    payload = [t.to_dict() for t in threads]
    return "Classify each of the following email threads. Output ONLY the JSON array.\n" + json.dumps(payload, ensure_ascii=False)


def extract_json_list(text: str) -> list:
    if isinstance(text, list):
        return text
    t = text.strip()
    if t.startswith("```"):
        parts = t.split("```")
        if len(parts) >= 3:
            t = parts[1]
            if t.startswith("json"):
                t = t[4:]
    start, end = t.find("["), t.rfind("]")
    if start == -1 or end == -1:
        raise LLMError("no JSON array in model response")
    try:
        return json.loads(t[start:end + 1])
    except json.JSONDecodeError as e:
        raise LLMError(f"invalid JSON in model response: {e}") from e


def _as_list(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for v in data.values():
            if isinstance(v, list):
                return v
    raise LLMError("model response is neither a JSON array nor an object wrapping one")


def _classification_from_item(item, thread: Thread) -> Classification:
    return Classification(
        thread_id=thread.thread_id,
        outcome=item.get("outcome"),
        confidence=float(item.get("confidence") or 0.0),
        direction=item.get("direction") or "unknown",
        event=item.get("event"),
        company=item.get("company"),
        company_normalized=item.get("company_normalized"),
        contact_person=item.get("contact_person"),
        designation=item.get("designation"),
        email=item.get("email"),
        phone=item.get("phone"),
        amount=item.get("amount"),
        amount_type=item.get("amount_type"),
        in_kind_note=item.get("in_kind_note"),
        conversation_date=item.get("conversation_date"),
        evidence=item.get("evidence") or "",
        evidence_message_id=item.get("evidence_message_id"),
    )


VALID_OUTCOMES = {
    "positive", "negotiation", "completed",
    "interested_uncommitted", "negative", "no_response", "unrelated",
}


def validate_classification(item: dict, index: int, allowed=None) -> list:
    errors = []
    if not isinstance(item, dict):
        return ["not a dict"]
    if item.get("index") is not None and item.get("index") != index:
        errors.append(f"index mismatch: {item.get('index')} != {index}")
    valid_outcomes = allowed if allowed is not None else VALID_OUTCOMES
    if item.get("outcome") not in valid_outcomes:
        errors.append("outcome not in VALID_OUTCOMES")
    conf = item.get("confidence")
    if not isinstance(conf, (int, float)) or not (0.0 <= float(conf) <= 1.0):
        errors.append("confidence must be float in 0..1")
    ev = item.get("evidence")
    if not isinstance(ev, str) or not ev.strip():
        errors.append("evidence required, non-empty")
    return errors


def parse_batch(text, threads, cfg, allowed=None):
    data = _as_list(extract_json_list(text))
    valid, problems = [], []
    for item in data:
        if not isinstance(item, dict):
            problems.append({"index": None, "errors": ["not a dict"], "item": item})
            continue
        idx = item.get("index")
        if not isinstance(idx, int) or not (0 <= idx < len(threads)):
            problems.append({"index": idx, "errors": ["index out of range"], "item": item})
            continue
        errs = validate_classification(item, idx, allowed=allowed)
        if errs:
            problems.append({"index": idx, "errors": errs, "item": item})
            continue
        valid.append(_classification_from_item(item, threads[idx]))
    return valid, problems


def classify_batch(client: LLMClient, threads, cfg: Config = None, rules: dict = None):
    if cfg is None:
        cfg = Config()
    allowed = None
    if rules is not None:
        allowed = {c["name"] for c in rules.get("categories", [])}
        system = CLASSIFY_SYSTEM_DYNAMIC(cfg, rules.get("categories", []))
    else:
        system = CLASSIFY_SYSTEM(cfg)
    prompt = build_classify_prompt(threads, cfg)
    for attempt in range(cfg.classify_retries + 1):
        text = client.generate(prompt, system=system)
        try:
            valid, problems = parse_batch(text, threads, cfg, allowed=allowed)
        except (LLMError, json.JSONDecodeError) as e:
            problems = [{"index": None, "errors": [str(e)], "item": None}]
            valid = []
        if not problems:
            return valid, []
    return [], problems


def classify_all(client: LLMClient, threads, cfg: Config, checkpoint_path, problems_path, rules: dict = None):
    existing = store.load_classifications(checkpoint_path)
    problems = store.load_json(problems_path, default=[]) or []
    remaining = [t for t in threads if t.thread_id not in existing]
    for batch in make_batches(remaining, cfg):
        valid, batch_problems = classify_batch(client, batch, cfg, rules=rules)
        for c in valid:
            existing[c.thread_id] = c
        problems.extend(batch_problems)
        store.save_classifications(existing, checkpoint_path)
        store.save_json(problems, problems_path)
        time.sleep(0.5)
    return existing


def broad_system(cfg: Config) -> str:
    return (
        f"You flag email threads that might concern {_use_case_of(cfg)} "
        f"for {_org_of(cfg)}, even if they never use the obvious keywords.\n"
        "Return a JSON array of the 0-based indexes to flag. Return [] if none."
    )


def broad_pass(client: LLMClient, threads, cfg: Config) -> set:
    payload = [
        {"index": i, "email": (t.subject + ": " + t.full_text)[:cfg.broad_max_chars]}
        for i, t in enumerate(threads)
    ]
    prompt = "Here are email threads. Return the indexes that are relevant. Output ONLY the JSON array.\n" + json.dumps(payload, ensure_ascii=False)
    text = client.generate(prompt, system=broad_system(cfg))
    data = _as_list(extract_json_list(text))
    flagged = set()
    for i in data:
        if isinstance(i, int) and 0 <= i < len(threads):
            flagged.add(threads[i].thread_id)
    return flagged


def CLASSIFY_SYSTEM_DYNAMIC(cfg, categories: list[dict]) -> str:
    from agents.rules import build_system_prompt
    return build_system_prompt(_org_of(cfg), _use_case_of(cfg), categories)
