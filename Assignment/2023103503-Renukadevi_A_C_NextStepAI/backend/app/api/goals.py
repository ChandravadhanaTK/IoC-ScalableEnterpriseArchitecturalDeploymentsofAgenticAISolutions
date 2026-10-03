from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.db.session import get_db
from app.db import models
from app.core.security import get_current_user
from app.agent import orchestrator

router = APIRouter(prefix="/api/goals", tags=["goals"])


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "general"
    target_date: Optional[datetime] = None


class GoalOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    status: str
    progress: float
    created_at: datetime
    completed_at: Optional[datetime]
    milestone_count: int = 0
    task_count: int = 0
    completed_task_count: int = 0

    class Config:
        from_attributes = True


def _goal_to_out(goal: models.Goal) -> dict:
    task_count = sum(len(m.tasks) for m in goal.milestones)
    completed_task_count = sum(
        sum(1 for t in m.tasks if t.status == "completed")
        for m in goal.milestones
    )
    return {
        "id": goal.id,
        "title": goal.title,
        "description": goal.description,
        "category": goal.category,
        "status": goal.status,
        "progress": goal.progress,
        "created_at": goal.created_at,
        "completed_at": goal.completed_at,
        "milestone_count": len(goal.milestones),
        "task_count": task_count,
        "completed_task_count": completed_task_count,
    }


@router.get("", response_model=List[GoalOut])
def list_goals(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goals = (
        db.query(models.Goal)
        .filter(models.Goal.user_id == current_user.id)
        .order_by(models.Goal.created_at.desc())
        .all()
    )
    return [_goal_to_out(g) for g in goals]


@router.post("", status_code=201)
def create_goal(
    body: GoalCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = models.Goal(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        status="active",
        target_date=body.target_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    # Initialize the goal: generate plan and select first task
    result = orchestrator.initialize_goal(db, goal.id)
    db.refresh(goal)

    return {
        "goal": _goal_to_out(goal),
        "agent": result,
    }


@router.get("/{goal_id}")
def get_goal(
    goal_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id,
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Get current agent state
    agent_state = db.query(models.AgentState).filter(
        models.AgentState.goal_id == goal_id
    ).first()

    # Get current task
    current_task = None
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

    # Build milestones with tasks
    milestones = []
    for milestone in goal.milestones:
        tasks = []
        for task in milestone.tasks:
            tasks.append({
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "difficulty": task.difficulty,
                "estimated_minutes": task.estimated_minutes,
                "order_index": task.order_index,
                "completed_at": task.completed_at,
            })
        milestones.append({
            "id": milestone.id,
            "title": milestone.title,
            "description": milestone.description,
            "status": milestone.status,
            "order_index": milestone.order_index,
            "tasks": tasks,
        })

    return {
        "goal": _goal_to_out(goal),
        "milestones": milestones,
        "agent_state": {
            "state": agent_state.state if agent_state else "idle",
            "current_task": current_task,
            "iteration": agent_state.iteration if agent_state else 0,
        },
    }


@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id,
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
