"""Tool registry: the ONLY way agents can affect enterprise systems.

Each tool declares:
  * risk level          low | medium | high
  * requires_approval   whether a human approver must sign off first
  * approver            who approves (role or the requester's manager)
  * allowed_roles       which caller roles may trigger it at all
  * self_only           the target user must be the requester (no acting on others)

`execute()` re-checks all of this at call time (defense in depth), validates
arguments, enforces retries with backoff, and returns a uniform ToolResult.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Callable

from ..security.auth import DEMO_USERS, Principal
from .integrations import CATALOG, IDP, ITSM_CLIENT, STATUS, IntegrationError
from .kb import KB


@dataclass
class ToolSpec:
    name: str
    label: str
    description: str
    risk: str
    requires_approval: bool
    approver: str  # "none" | "manager" | role name
    allowed_roles: set[str]
    self_only: bool
    fn: Callable[[Principal, dict], dict]
    required_args: tuple[str, ...] = field(default_factory=tuple)


@dataclass
class ToolResult:
    tool: str
    ok: bool
    output: dict
    user_message: str = ""
    error: str | None = None
    attempts: int = 1
    latency_ms: float = 0.0

    def to_dict(self) -> dict:
        return self.__dict__.copy()


ALL_ROLES = {"employee", "technician", "approver", "admin"}


# ------------------------------------------------------------------ implementations
def _search_kb(p: Principal, a: dict) -> dict:
    return {"hits": KB.search(a["query"], k=3, category=a.get("category"))}


def _status(p: Principal, a: dict) -> dict:
    return STATUS.get(a["service"])


def _unlock(p: Principal, a: dict) -> dict:
    out = IDP.unlock_account(a["username"])
    out["user_message"] = ("Your account has been **unlocked**. If it locks again, update any saved "
                           "passwords on your phone (mail, Wi-Fi) [KB-0002].")
    return out


def _reset(p: Principal, a: dict) -> dict:
    out = IDP.send_password_reset(a["username"])
    out["user_message"] = (f"A one-time **password reset link** was sent to your {out['channel']}. "
                           f"It expires in {out['link_expires_minutes']} minutes [KB-0003].")
    return out


def _software(p: Principal, a: dict) -> dict:
    out = CATALOG.assign(a["username"], a["software"])
    out["user_message"] = (f"**{out['software']}** has been assigned to you and will install via "
                           f"{out['deployment']} within about {out['eta_minutes']} minutes.")
    return out


def _escalate(p: Principal, a: dict) -> dict:
    return ITSM_CLIENT.create_incident(ticket_id=a["ticket_id"], category=a["category"],
                                       priority=a["priority"], summary=a["summary"],
                                       handoff=a.get("handoff", {}))


TOOLS: dict[str, ToolSpec] = {t.name: t for t in [
    ToolSpec("search_kb", "Search knowledge base", "BM25 search over approved KB articles",
             "low", False, "none", ALL_ROLES, False, _search_kb, ("query",)),
    ToolSpec("check_service_status", "Check service status", "Read current health of a service",
             "low", False, "none", ALL_ROLES, False, _status, ("service",)),
    ToolSpec("unlock_account", "Unlock account", "Unlock the requester's own directory account",
             "medium", False, "none", ALL_ROLES, True, _unlock, ("username",)),
    ToolSpec("send_password_reset", "Password reset", "Send a one-time reset link to the "
             "requester's registered recovery channel", "high", True, "technician", ALL_ROLES, True,
             _reset, ("username",)),
    ToolSpec("assign_software", "Software assignment", "Assign catalog software to the requester",
             "high", True, "manager", ALL_ROLES, True, _software, ("username", "software")),
    ToolSpec("escalate_to_human", "Escalate to human", "Create an ITSM incident with a handoff package",
             "low", False, "none", ALL_ROLES, False, _escalate,
             ("ticket_id", "category", "priority", "summary")),
]}


class ToolPolicyError(Exception):
    pass


def approver_for(spec: ToolSpec, requester: Principal, args: dict) -> str:
    """Return the username/role label that must approve. Paid software -> manager; free -> none."""
    if spec.name == "assign_software":
        item = CATALOG.lookup(args.get("software", ""))
        if item and item["license"] == "free":
            return "none"
        return DEMO_USERS.get(requester.username, {}).get("manager") or "approver"
    return spec.approver


def needs_approval(spec: ToolSpec, requester: Principal, args: dict) -> bool:
    return spec.requires_approval and approver_for(spec, requester, args) != "none"


def authorize(spec: ToolSpec, requester: Principal, args: dict) -> None:
    if requester.role not in spec.allowed_roles:
        raise ToolPolicyError(f"role {requester.role} may not use {spec.name}")
    missing = [a for a in spec.required_args if not args.get(a)]
    if missing:
        raise ToolPolicyError(f"missing arguments for {spec.name}: {missing}")
    if spec.self_only and args.get("username") != requester.username:
        raise ToolPolicyError(f"{spec.name} may only target the requester's own account")


def execute(name: str, requester: Principal, args: dict, *, max_retries: int,
            approved: bool = False) -> ToolResult:
    spec = TOOLS.get(name)
    if spec is None:
        return ToolResult(name, False, {}, error="unknown tool")
    try:
        authorize(spec, requester, args)
        if needs_approval(spec, requester, args) and not approved:
            raise ToolPolicyError(f"{name} requires approval")
    except ToolPolicyError as exc:
        return ToolResult(name, False, {}, error=f"policy: {exc}")

    t0 = time.perf_counter()
    last_err = None
    for attempt in range(1, max_retries + 2):
        try:
            out = spec.fn(requester, args)
            msg = out.pop("user_message", "") if isinstance(out, dict) else ""
            return ToolResult(name, True, out, user_message=msg, attempts=attempt,
                              latency_ms=(time.perf_counter() - t0) * 1000)
        except IntegrationError as exc:
            last_err = str(exc)
            time.sleep(0.05 * 2 ** (attempt - 1))  # short backoff (kept small for interactive use)
    return ToolResult(name, False, {}, error=last_err, attempts=max_retries + 1,
                      latency_ms=(time.perf_counter() - t0) * 1000)
