import hashlib
import mailbox
import re
import email.utils

from agents.models import Message, Thread


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _extract_body(message) -> str:
    for part in message.walk():
        ctype = part.get_content_type()
        if ctype == "text/plain":
            try:
                payload = part.get_payload(decode=True) or b""
                return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
            except Exception:
                continue
    for part in message.walk():
        if part.get_content_type() == "text/html":
            try:
                payload = part.get_payload(decode=True) or b""
                return _strip_html(payload.decode(part.get_content_charset() or "utf-8", errors="replace"))
            except Exception:
                continue
    return ""


def _message_id(message, fallback: str) -> str:
    mid = message.get("Message-ID")
    if mid:
        return mid.strip().strip("<>")
    return fallback


def _refs(message) -> list:
    out = []
    for header in ("References", "In-Reply-To"):
        raw = message.get(header)
        if raw:
            for token in re.split(r"[,\s]+", raw):
                token = token.strip().strip("<>")
                if token:
                    out.append(token)
    return out


def _parsed(message, index: int) -> dict:
    subject = message.get("Subject", "")
    date_str = message.get("Date")
    try:
        dt = email.utils.parsedate_to_datetime(date_str)
        date_iso = dt.isoformat()
    except Exception:
        date_iso = f"1970-01-01T00:00:00+00:00"
    mid = _message_id(message, f"i{index}")
    return {
        "message_id": mid,
        "from": message.get("From"),
        "to": message.get("To", ""),
        "date": date_iso,
        "subject": subject,
        "body": _extract_body(message),
        "refs": _refs(message),
    }


def _group_threads(parsed: list, own_addresses) -> list:
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent.get(parent[x], x)
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    for p in parsed:
        for ref in p["refs"]:
            union(p["message_id"], ref)

    groups = {}
    for p in parsed:
        groups.setdefault(find(p["message_id"]), []).append(p)

    threads = []
    for msgs in groups.values():
        msgs.sort(key=lambda p: p["date"])
        own = own_addresses or []
        msgs_outbound = [m for m in msgs if any(o in (m["from"] or "") for o in own)]
        if own and len(msgs_outbound) == len(msgs):
            hint = "outbound"
        elif own and len(msgs_outbound) > 0:
            hint = "mixed"
        elif own:
            hint = "inbound"
        else:
            hint = "unknown"
        message_models = [
            Message(
                id=p["message_id"],
                from_email=p["from"],
                to=[t.strip(", ") for t in p["to"].split(",") if t.strip()] if p["to"] else [],
                date=p["date"],
                subject=p["subject"],
                body_text=p["body"],
            )
            for p in msgs
        ]
        threads.append(Thread(
            thread_id=msgs[0]["message_id"],
            subject=msgs[0]["subject"],
            messages=message_models,
            first_date=msgs[0]["date"],
            last_date=msgs[-1]["date"],
            direction_hint=hint,
        ))
    threads.sort(key=lambda t: t.first_date)
    return threads


def import_mbox(path: str, own_addresses=None) -> list:
    box = mailbox.mbox(path)
    parsed = [_parsed(m, i) for i, m in enumerate(box)]
    return _group_threads(parsed, own_addresses)