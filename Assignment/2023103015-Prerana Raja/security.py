import json, os, re, time
from fastapi import Header, HTTPException

# Keys come from env (secrets never hard-coded in production). Demo defaults for local use only.
API_KEYS = {
    os.getenv("EMPLOYEE_KEY", "employee-demo-key"): ("alice", "employee"),
    os.getenv("ADMIN_KEY", "admin-demo-key"): ("bob", "it_admin"),
}
AUDIT_FILE = os.getenv("AUDIT_FILE", "audit.jsonl")

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE = re.compile(r"\b\+?\d[\d\s-]{8,13}\d\b")
INJECTION = re.compile(
    r"ignore (all |any )?(previous|prior) instructions|reveal (the )?system prompt|"
    r"you are now|disregard (your )?rules|bypass (security|approval)", re.I)


def redact_pii(text: str) -> str:
    return PHONE.sub("[PHONE]", EMAIL.sub("[EMAIL]", text))


def is_injection(text: str) -> bool:
    return bool(INJECTION.search(text))


def authenticate(x_api_key: str = Header(default="")):
    if x_api_key not in API_KEYS:
        raise HTTPException(401, "Invalid API key")
    user, role = API_KEYS[x_api_key]
    return {"user": user, "role": role}


def require_admin(identity=None):
    if not identity or identity["role"] != "it_admin":
        raise HTTPException(403, "it_admin role required")


def audit(event: str, **fields):
    rec = {"ts": time.time(), "event": event, **fields}
    with open(AUDIT_FILE, "a") as f:
        f.write(json.dumps(rec) + "\n")


def read_audit(limit=100):
    if not os.path.exists(AUDIT_FILE):
        return []
    with open(AUDIT_FILE) as f:
        return [json.loads(l) for l in f.readlines()[-limit:]]
