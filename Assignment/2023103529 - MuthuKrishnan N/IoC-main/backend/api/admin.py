import uuid
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from backend.models.user import (
    UserInDB,
    UserResponse,
    AdminUserCreate,
    UserRoleUpdate,
    UserStatusUpdate,
    Role
)
from backend.models.audit import AuditLog
from backend.database.repository import repo
from backend.security.auth import get_password_hash
from backend.security.rbac import require_admin
from backend.monitoring.metrics import metrics_aggregator
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.api.admin")
router = APIRouter(prefix="/api/admin", tags=["Admin Monitoring"])

@router.get("/metrics")
async def get_metrics(current_user: UserInDB = Depends(require_admin)):
    """Returns aggregated executive metrics across all operational dimensions."""
    return metrics_aggregator.get_dashboard_metrics()

@router.get("/agent-metrics")
async def get_agent_metrics(current_user: UserInDB = Depends(require_admin)):
    """Returns telemetry breakdowns per individual agent."""
    return metrics_aggregator.get_agent_metrics_breakdown()

@router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(
    limit: int = Query(100, le=500),
    status: Optional[str] = None,
    action: Optional[str] = None,
    current_user: UserInDB = Depends(require_admin)
):
    """Returns immutable enterprise audit records."""
    query = {}
    if status:
        query["status"] = status
    if action:
        query["action"] = action

    logs = repo.audit_logs.find(query=query, sort_key="timestamp", sort_desc=True, limit=limit)
    return [AuditLog(**l) for l in logs]

# ==============================================================================
# ADMIN USER MANAGEMENT (Required by Requirement 15)
# ==============================================================================

@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: UserInDB = Depends(require_admin)):
    """Admin endpoint to list all platform users."""
    users = repo.users.find({}, sort_key="created_at", sort_desc=True)
    return [
        UserResponse(
            id=u["id"],
            name=u["name"],
            email=u["email"],
            role=u["role"],
            is_active=u.get("is_active", True),
            created_at=u.get("created_at") or datetime.utcnow()
        )
        for u in users
    ]

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    payload: AdminUserCreate,
    current_user: UserInDB = Depends(require_admin)
):
    """Admin creates a privileged user (e.g. Support Agent or Admin)."""
    existing = repo.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )

    prefix = "SUP" if payload.role == Role.SUPPORT_AGENT else "ADM" if payload.role == Role.ADMIN else "CUS"
    user_id = f"{prefix}-{uuid.uuid4().hex[:6].upper()}"
    hashed_pwd = get_password_hash(payload.password)

    new_user = UserInDB(
        id=user_id,
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        role=payload.role,
        is_active=True,
        password_hash=hashed_pwd,
        created_at=datetime.utcnow()
    )

    repo.users.insert_one(new_user.model_dump())

    telemetry.log_audit(
        action="ADMIN_CREATE_USER",
        user_id=current_user.id,
        role=current_user.role.value,
        status="SUCCESS",
        result=f"Admin {current_user.email} created user {new_user.email} with role {new_user.role.value}"
    )

    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    current_user: UserInDB = Depends(require_admin)
):
    """Admin endpoint to change a user's role (e.g. Promote Customer -> Support Agent)."""
    target = repo.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    old_role = target.get("role")
    new_role = payload.role

    repo.users.update_one({"id": user_id}, {"role": new_role.value})

    telemetry.log_audit(
        action="ADMIN_ROLE_CHANGE",
        user_id=current_user.id,
        role=current_user.role.value,
        status="SUCCESS",
        result=f"Admin {current_user.email} changed role of user {target.get('email')} from {old_role} to {new_role.value}"
    )

    updated = repo.users.find_one({"id": user_id})
    return UserResponse(
        id=updated["id"],
        name=updated["name"],
        email=updated["email"],
        role=updated["role"],
        is_active=updated.get("is_active", True),
        created_at=updated.get("created_at") or datetime.utcnow()
    )

@router.patch("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    current_user: UserInDB = Depends(require_admin)
):
    """Admin endpoint to activate or deactivate a user account."""
    target = repo.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    repo.users.update_one({"id": user_id}, {"is_active": payload.is_active})

    action_name = "ADMIN_ACTIVATE_USER" if payload.is_active else "ADMIN_DEACTIVATE_USER"
    telemetry.log_audit(
        action=action_name,
        user_id=current_user.id,
        role=current_user.role.value,
        status="SUCCESS",
        result=f"Admin {current_user.email} set active={payload.is_active} for user {target.get('email')}"
    )

    updated = repo.users.find_one({"id": user_id})
    return UserResponse(
        id=updated["id"],
        name=updated["name"],
        email=updated["email"],
        role=updated["role"],
        is_active=updated.get("is_active", True),
        created_at=updated.get("created_at") or datetime.utcnow()
    )
