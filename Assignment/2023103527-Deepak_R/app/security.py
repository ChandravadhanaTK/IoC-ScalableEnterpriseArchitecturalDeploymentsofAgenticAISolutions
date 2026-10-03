import os, re
from fastapi import Header, HTTPException

INJECTION = re.compile(
    r"(ignore (all|previous|prior)|system prompt|act as|you are now|<script|drop table)", re.I)


def load_keys():
    raw = os.getenv("API_KEYS", "key-submit:submitter,key-officer:officer,key-admin:admin")
    return dict(p.split(":") for p in raw.split(",") if ":" in p)


def mask(value: str) -> str:
    return value[:2] + "*" * max(len(value) - 4, 0) + value[-2:]


def require(*roles):
    def dep(x_api_key: str = Header(default="")):
        role = load_keys().get(x_api_key)
        if not role:
            raise HTTPException(401, "invalid or missing API key")
        if role not in roles:
            raise HTTPException(403, f"role '{role}' not permitted")
        return role
    return dep
