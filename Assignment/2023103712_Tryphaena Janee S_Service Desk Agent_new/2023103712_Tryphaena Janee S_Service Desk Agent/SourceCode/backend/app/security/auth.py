"""Identity and authorization.

Production: tokens come from the corporate IdP (OIDC / Entra ID / Okta) and
roles map from IdP groups. Development: a demo login issues an HS256 JWT for
one of the seeded personas below so every role can be exercised locally.

Authorization is role-based (RBAC) with explicit permission strings, checked
both at the API edge AND again inside the agent tool layer (defense in depth),
so a compromised or confused agent can never exceed the caller's rights.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import jwt

from ..config import settings

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "employee": {"chat", "tickets:read:own", "feedback"},
    "technician": {"chat", "tickets:read:own", "tickets:read:all", "traces:read", "metrics:read",
                   "feedback"},
    "approver": {"chat", "tickets:read:own", "tickets:read:all", "approvals:decide",
                 "approvals:read", "traces:read", "feedback"},
    "admin": {"chat", "tickets:read:own", "tickets:read:all", "approvals:decide", "approvals:read",
              "traces:read", "metrics:read", "audit:read", "feedback"},
}

# Seeded personas for local demos. `manager` drives software-approval routing.
DEMO_USERS: dict[str, dict] = {
    "alice": {"name": "Alice Kumar", "role": "employee", "dept": "Finance", "manager": "maya"},
    "bob": {"name": "Bob Fernandes", "role": "employee", "dept": "Sales", "manager": "maya"},
    "tina": {"name": "Tina Rao", "role": "technician", "dept": "IT Ops", "manager": "admin"},
    "maya": {"name": "Maya Iyer", "role": "approver", "dept": "Finance", "manager": "admin"},
    "admin": {"name": "Sam Admin", "role": "admin", "dept": "IT Security", "manager": None},
}


class AuthError(Exception):
    pass


class PermissionDenied(Exception):
    pass


@dataclass(frozen=True)
class Principal:
    username: str
    name: str
    role: str
    dept: str

    @property
    def permissions(self) -> set[str]:
        return ROLE_PERMISSIONS.get(self.role, set())

    def can(self, permission: str) -> bool:
        return permission in self.permissions

    def require(self, permission: str) -> None:
        if not self.can(permission):
            raise PermissionDenied(f"role '{self.role}' lacks permission '{permission}'")


def issue_token(username: str) -> str:
    user = DEMO_USERS.get(username)
    if not user:
        raise AuthError("unknown user")
    now = int(time.time())
    claims = {
        "sub": username,
        "name": user["name"],
        "role": user["role"],
        "dept": user["dept"],
        "iat": now,
        "exp": now + settings.jwt_ttl_minutes * 60,
        "iss": "it-service-desk-agent",
        "aud": "servicedesk-api",
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm="HS256")


def verify_token(token: str) -> Principal:
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"],
                            audience="servicedesk-api", issuer="it-service-desk-agent")
    except jwt.PyJWTError as exc:
        raise AuthError(f"invalid token: {exc}") from exc
    if claims.get("role") not in ROLE_PERMISSIONS:
        raise AuthError("unknown role")
    return Principal(username=claims["sub"], name=claims.get("name", claims["sub"]),
                     role=claims["role"], dept=claims.get("dept", ""))


def principal_for(username: str) -> Principal:
    """Build a Principal directly (used by tests, seeding and the approval resume path)."""
    u = DEMO_USERS[username]
    return Principal(username=username, name=u["name"], role=u["role"], dept=u["dept"])
