from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from app.config import settings

# RBAC Roles & Capabilities
ROLES_PERMISSIONS = {
    "tier1_analyst": ["view_incidents", "trigger_enrichment", "comment"],
    "tier2_lead": ["view_incidents", "trigger_enrichment", "comment", "approve_standard_containment", "block_ip"],
    "soc_admin": ["view_incidents", "trigger_enrichment", "comment", "approve_standard_containment", "block_ip", "quarantine_endpoint", "configure_policies"],
    "auditor": ["view_incidents", "view_audit_logs", "export_telemetry"]
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def check_permission(role: str, permission: str) -> bool:
    perms = ROLES_PERMISSIONS.get(role, [])
    return permission in perms

# Generate a default mock Analyst JWT for immediate testing
DEFAULT_ANALYST_TOKEN = create_access_token({
    "sub": "analyst-01@sentinel.sec",
    "name": "Alex Mercer (Lead SOC Analyst)",
    "role": "soc_admin"
})
