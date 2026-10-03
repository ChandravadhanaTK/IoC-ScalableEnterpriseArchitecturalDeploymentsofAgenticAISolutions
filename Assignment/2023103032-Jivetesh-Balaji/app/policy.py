from .database import add_audit

ROLE_PERMISSIONS = {
    "EMPLOYEE": {
        "search_knowledge",
        "create_ticket",
        "view_own_ticket",
        "view_own_asset",
    },
    "IT_SUPPORT": {
        "search_knowledge",
        "create_ticket",
        "view_own_ticket",
        "view_any_ticket",
        "view_own_asset",
        "view_any_asset",
        "reset_password",
    },
    "ADMIN": {
        "search_knowledge",
        "create_ticket",
        "view_own_ticket",
        "view_any_ticket",
        "view_own_asset",
        "view_any_asset",
        "reset_password",
        "delete_account",
    },
}

HIGH_RISK = {"reset_password", "delete_account"}


def authorize(user_id: str, role: str, action: str) -> dict:
    role = role.upper()
    allowed = action in ROLE_PERMISSIONS.get(role, set())
    approval_required = allowed and action in HIGH_RISK

    add_audit(
        user_id,
        role,
        action,
        "ALLOWED" if allowed else "DENIED",
        f"approval_required={approval_required}",
    )

    return {
        "allowed": allowed,
        "approval_required": approval_required,
    }
