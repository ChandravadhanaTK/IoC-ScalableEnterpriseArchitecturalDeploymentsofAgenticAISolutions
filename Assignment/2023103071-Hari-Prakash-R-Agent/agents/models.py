from dataclasses import dataclass, field
from typing import List, Optional


# NOTE: these are shipped example categories for one domain (partnership
# tracking). For general-purpose parsing, pass explicit `allowed` category
# names from your rules config (see agents/rules.py + config/rules.schema.json)
# instead of relying on these globals.
VALID_OUTCOMES = {
    "positive", "negotiation", "completed",
    "interested_uncommitted", "negative", "no_response", "unrelated",
}
SUCCESS_OUTCOMES = {"positive", "negotiation", "completed"}


@dataclass
class Message:
    id: str
    from_email: Optional[str]
    to: List[str]
    date: str
    subject: str
    body_text: str

    def to_dict(self) -> dict:
        return {
            "id": self.id, "from_email": self.from_email, "to": self.to,
            "date": self.date, "subject": self.subject, "body_text": self.body_text,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Message":
        return cls(
            id=d.get("id", ""),
            from_email=d.get("from_email"),
            to=list(d.get("to") or []),
            date=d.get("date", ""),
            subject=d.get("subject", ""),
            body_text=d.get("body_text", ""),
        )


@dataclass
class Thread:
    thread_id: str
    subject: str
    messages: List[Message] = field(default_factory=list)
    first_date: str = ""
    last_date: str = ""
    direction_hint: str = "unknown"

    @property
    def full_text(self) -> str:
        return "\n\n".join(f"{m.subject}\n{m.body_text}" for m in self.messages)

    def to_dict(self) -> dict:
        return {
            "thread_id": self.thread_id, "subject": self.subject,
            "messages": [m.to_dict() for m in self.messages],
            "first_date": self.first_date, "last_date": self.last_date,
            "direction_hint": self.direction_hint,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Thread":
        return cls(
            thread_id=d.get("thread_id", ""),
            subject=d.get("subject", ""),
            messages=[Message.from_dict(m) for m in (d.get("messages") or [])],
            first_date=d.get("first_date", ""),
            last_date=d.get("last_date", ""),
            direction_hint=d.get("direction_hint", "unknown"),
        )


@dataclass
class Classification:
    thread_id: str
    outcome: str
    confidence: float
    direction: str
    event: Optional[str]
    company: Optional[str]
    company_normalized: Optional[str]
    contact_person: Optional[str]
    designation: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    amount: Optional[str]
    amount_type: Optional[str]
    in_kind_note: Optional[str]
    conversation_date: Optional[str]
    evidence: str
    evidence_message_id: Optional[str]
    parse_error: bool = False

    def to_dict(self) -> dict:
        return {
            "thread_id": self.thread_id, "outcome": self.outcome,
            "confidence": self.confidence, "direction": self.direction,
            "event": self.event, "company": self.company,
            "company_normalized": self.company_normalized,
            "contact_person": self.contact_person, "designation": self.designation,
            "email": self.email, "phone": self.phone,
            "amount": self.amount, "amount_type": self.amount_type,
            "in_kind_note": self.in_kind_note,
            "conversation_date": self.conversation_date,
            "evidence": self.evidence,
            "evidence_message_id": self.evidence_message_id,
            "parse_error": self.parse_error,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Classification":
        wanted = {k: v for k, v in cls.__dataclass_fields__.items()}
        return cls(**{k: d.get(k) for k in wanted if k in d})


def validate_classification(item: dict, index: int) -> list:
    errors = []
    if not isinstance(item, dict):
        return ["not a dict"]
    if item.get("index") is not None and item.get("index") != index:
        errors.append(f"index mismatch: {item.get('index')} != {index}")
    if item.get("outcome") not in VALID_OUTCOMES:
        errors.append("outcome not in VALID_OUTCOMES")
    conf = item.get("confidence")
    if not isinstance(conf, (int, float)) or not (0.0 <= float(conf) <= 1.0):
        errors.append("confidence must be float in 0..1")
    ev = item.get("evidence")
    if not isinstance(ev, str) or not ev.strip():
        errors.append("evidence required, non-empty")
    return errors