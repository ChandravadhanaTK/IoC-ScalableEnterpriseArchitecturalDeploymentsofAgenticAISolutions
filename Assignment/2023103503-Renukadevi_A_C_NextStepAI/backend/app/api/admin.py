from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.db import models
from app.core.security import get_current_user, require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
def list_users(
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "goal_count": len(u.goals),
        }
        for u in users
    ]


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.get("/monitoring")
def get_monitoring(
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(models.User).count()
    total_goals = db.query(models.Goal).count()
    active_goals = db.query(models.Goal).filter(models.Goal.status == "active").count()
    completed_goals = db.query(models.Goal).filter(models.Goal.status == "completed").count()
    total_tasks = db.query(models.Task).count()
    completed_tasks = db.query(models.Task).filter(models.Task.status == "completed").count()
    total_events = db.query(models.AgentEvent).count()

    recent_events = (
        db.query(models.AgentEvent)
        .order_by(models.AgentEvent.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "overview": {
            "total_users": total_users,
            "total_goals": total_goals,
            "active_goals": active_goals,
            "completed_goals": completed_goals,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "task_completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0,
            "total_agent_events": total_events,
        },
        "recent_events": [
            {
                "id": e.id,
                "goal_id": e.goal_id,
                "event_type": e.event_type,
                "created_at": e.created_at,
            }
            for e in recent_events
        ],
    }


@router.get("/audit-logs")
def get_audit_logs(
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    logs = (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "created_at": l.created_at,
        }
        for l in logs
    ]


@router.get("/goals")
def list_all_goals(
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    query = db.query(models.Goal)
    if user_id:
        query = query.filter(models.Goal.user_id == user_id)
    if status:
        query = query.filter(models.Goal.status == status)
    goals = query.order_by(models.Goal.created_at.desc()).limit(200).all()

    return [
        {
            "id": g.id,
            "user_id": g.user_id,
            "title": g.title,
            "status": g.status,
            "progress": g.progress,
            "category": g.category,
            "created_at": g.created_at,
        }
        for g in goals
    ]
