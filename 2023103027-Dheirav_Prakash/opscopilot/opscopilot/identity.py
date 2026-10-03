"""Caller identity and the policy checks that gate data and tools.

The model never sees a credential and never decides what it is allowed to do.
Authorisation happens here, at the tool and retrieval boundary, from the
identity that came in with the request.
"""
from __future__ import annotations

from dataclasses import dataclass, field

ROLE_ACCESS = {
    # role -> document access labels the role may retrieve
    "team_lead": ["internal"],
    "shift_supervisor": ["internal"],
    "ops_manager": ["internal", "confidential"],
    "finance_controller": ["internal", "confidential"],
    "quality_lead": ["internal"],
}

# Which roles may invoke which tools. Reads are broad, writes are narrow.
TOOL_ROLES = {
    "get_shipment_status": set(ROLE_ACCESS),
    "list_at_risk_shipments": set(ROLE_ACCESS),
    "propose_reroute": {"shift_supervisor", "ops_manager"},
}

# Who can approve a reroute, by declared value. Mirrors SOP-OPS-014 section 3.
# Cold chain needs the operations manager AND the quality lead; that is two
# approvals, so `reroute_required_approvals` says how many distinct approvers
# from the set must sign before the gate opens.
def reroute_approver_roles(declared_value_inr: int, cold_chain: bool) -> set[str]:
    if cold_chain:
        return {"ops_manager", "quality_lead"}
    if declared_value_inr >= 50_000:
        return {"ops_manager"}
    return {"shift_supervisor", "ops_manager"}


def reroute_required_approvals(cold_chain: bool) -> int:
    return 2 if cold_chain else 1


@dataclass(frozen=True)
class Identity:
    user_id: str
    role: str
    access: tuple[str, ...] = field(default=())

    @classmethod
    def for_role(cls, user_id: str, role: str) -> "Identity":
        if role not in ROLE_ACCESS:
            raise PermissionError(f"unknown role {role!r}")
        return cls(user_id=user_id, role=role, access=tuple(ROLE_ACCESS[role]))

    def may_call(self, tool_name: str) -> bool:
        return self.role in TOOL_ROLES.get(tool_name, set())


class PolicyDenied(PermissionError):
    pass


def authorize_tool(identity: Identity, tool_name: str) -> None:
    if not identity.may_call(tool_name):
        raise PolicyDenied(f"role {identity.role!r} may not call {tool_name}")
