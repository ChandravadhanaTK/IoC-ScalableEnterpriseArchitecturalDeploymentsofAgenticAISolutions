import logging
from typing import List
from fastapi import Depends, HTTPException, status
from backend.models.user import UserInDB, Role
from backend.security.auth import get_current_user

logger = logging.getLogger("enterprise_ai.security.rbac")

def require_roles(allowed_roles: List[Role]):
    def role_checker(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
        if current_user.role not in allowed_roles:
            # Audit log unauthorized access attempt (lazy import avoids circular dependency)
            try:
                from backend.monitoring.telemetry import telemetry
                telemetry.log_audit(
                    action="UNAUTHORIZED_ROLE_ACCESS_BLOCKED",
                    user_id=current_user.id,
                    role=current_user.role.value,
                    status="BLOCKED",
                    error=f"User {current_user.email} (Role: {current_user.role.value}) attempted to access restricted endpoint requiring {[r.value for r in allowed_roles]}"
                )
            except Exception as e:
                logger.warning(f"Could not log RBAC violation to telemetry: {e}")

            logger.warning(
                f"[RBAC VIOLATION] User {current_user.email} ({current_user.role}) denied access. Required: {[r.value for r in allowed_roles]}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User with role '{current_user.role}' lacks required permissions ({[r.value for r in allowed_roles]})"
            )
        return current_user
    return role_checker

# Pre-defined convenience role checks
require_customer = require_roles([Role.CUSTOMER, Role.SUPPORT_AGENT, Role.ADMIN])
require_support = require_roles([Role.SUPPORT_AGENT, Role.ADMIN])
require_admin = require_roles([Role.ADMIN])

def verify_order_ownership(user: UserInDB, order_customer_id: str) -> bool:
    """Returns True if user is authorized to inspect/action this order.
    Customers can only access their own orders. Support and Admins can access any."""
    if user.role in (Role.SUPPORT_AGENT, Role.ADMIN):
        return True
    return user.id == order_customer_id
