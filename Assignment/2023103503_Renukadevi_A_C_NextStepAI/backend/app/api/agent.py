from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.db import models
from app.core.security import get_current_user
from app.agent import orchestrator

router = APIRouter(prefix="/api/agent", tags=["agent"])


class ActionRequest(BaseModel):
    action: str  # "done" | "stuck" | "skip"
    message: Optional[str] = ""


@router.post("/goals/{goal_id}/action")
def perform_action(
    goal_id: str,
    body: ActionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify goal belongs to user
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id,
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if body.action not in ("done", "stuck", "skip"):
        raise HTTPException(status_code=400, detail="action must be 'done', 'stuck', or 'skip'")

    result = orchestrator.handle_action(
        db=db,
        goal_id=goal_id,
        action=body.action,
        student_message=body.message or "",
    )
    return result


@router.get("/goals/{goal_id}/events")
def get_goal_events(
    goal_id: str,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id,
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    events = (
        db.query(models.AgentEvent)
        .filter(models.AgentEvent.goal_id == goal_id)
        .order_by(models.AgentEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "data": e.data,
            "created_at": e.created_at,
        }
        for e in events
    ]


@router.get("/dashboard")
def get_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns everything needed for the dashboard page."""
    goals = (
        db.query(models.Goal)
        .filter(models.Goal.user_id == current_user.id)
        .order_by(models.Goal.updated_at.desc())
        .all()
    )

    # Pick the primary goal: most recently updated active goal
    primary_goal = next((g for g in goals if g.status == "active"), None)

    # Get current task for primary goal
    current_task = None
    rationale = None
    agent_state_str = "idle"

    if primary_goal:
        agent_state = db.query(models.AgentState).filter(
            models.AgentState.goal_id == primary_goal.id
        ).first()

        if agent_state and agent_state.current_task_id:
            task = db.query(models.Task).filter(
                models.Task.id == agent_state.current_task_id
            ).first()
            if task:
                current_task = {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "estimated_minutes": task.estimated_minutes,
                    "difficulty": task.difficulty,
                    "status": task.status,
                }
                agent_state_str = agent_state.state

        # Get recent events for activity feed
        recent_events = (
            db.query(models.AgentEvent)
            .filter(models.AgentEvent.goal_id == primary_goal.id)
            .order_by(models.AgentEvent.created_at.desc())
            .limit(5)
            .all()
        )

    # Stats
    total_goals = len(goals)
    active_goals = sum(1 for g in goals if g.status == "active")
    completed_goals = sum(1 for g in goals if g.status == "completed")
    avg_progress = (
        sum(g.progress for g in goals if g.status == "active") / active_goals
        if active_goals > 0 else 0
    )

    # Goals summary
    goals_summary = []
    for g in goals:
        task_count = sum(len(m.tasks) for m in g.milestones)
        done_count = sum(
            sum(1 for t in m.tasks if t.status == "completed")
            for m in g.milestones
        )
        goals_summary.append({
            "id": g.id,
            "title": g.title,
            "status": g.status,
            "progress": g.progress,
            "category": g.category,
            "task_count": task_count,
            "completed_task_count": done_count,
            "created_at": g.created_at,
            "completed_at": g.completed_at,
        })

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "stats": {
            "total_goals": total_goals,
            "active_goals": active_goals,
            "completed_goals": completed_goals,
            "avg_progress": round(avg_progress, 1),
        },
        "primary_goal": {
            "id": primary_goal.id,
            "title": primary_goal.title,
            "progress": primary_goal.progress,
            "status": primary_goal.status,
            "category": primary_goal.category,
        } if primary_goal else None,
        "current_task": current_task,
        "agent_state": agent_state_str,
        "goals": goals_summary,
        "suggest_new_goal": primary_goal is None or primary_goal.status == "completed",
    }
