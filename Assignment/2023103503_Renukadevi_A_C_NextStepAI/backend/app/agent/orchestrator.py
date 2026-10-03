"""
Agent orchestrator — bridges the FastAPI routes with the LangGraph agent.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Optional

from app.db import models
from app.agent.graph import new_goal_graph, action_graph
from app.agent.llm_service import llm


def _get_or_create_agent_state(db: Session, goal_id: str) -> models.AgentState:
    state = db.query(models.AgentState).filter(
        models.AgentState.goal_id == goal_id
    ).first()
    if not state:
        state = models.AgentState(goal_id=goal_id, state="idle")
        db.add(state)
        db.flush()
    return state


def _get_pending_tasks(db: Session, goal_id: str) -> list:
    milestones = (
        db.query(models.Milestone)
        .filter(models.Milestone.goal_id == goal_id)
        .order_by(models.Milestone.order_index)
        .all()
    )
    pending = []
    for milestone in milestones:
        if milestone.status == "completed":
            continue
        tasks = (
            db.query(models.Task)
            .filter(models.Task.milestone_id == milestone.id)
            .order_by(models.Task.order_index)
            .all()
        )
        for task in tasks:
            if task.status in ("pending", "in_progress"):
                pending.append({
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "estimated_minutes": task.estimated_minutes,
                    "difficulty": task.difficulty,
                    "milestone_title": milestone.title,
                    "status": task.status,
                })
    return pending


def _get_completed_tasks(db: Session, goal_id: str) -> list:
    milestones = (
        db.query(models.Milestone)
        .filter(models.Milestone.goal_id == goal_id)
        .all()
    )
    completed = []
    for milestone in milestones:
        tasks = (
            db.query(models.Task)
            .filter(models.Task.milestone_id == milestone.id)
            .all()
        )
        for task in tasks:
            if task.status == "completed":
                completed.append({
                    "id": task.id,
                    "title": task.title,
                    "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                })
    return completed


def _log_event(db: Session, goal_id: str, event_type: str, data: dict):
    event = models.AgentEvent(goal_id=goal_id, event_type=event_type, data=data)
    db.add(event)


def _update_goal_progress(db: Session, goal: models.Goal):
    """Recalculate and persist goal progress."""
    total_tasks = 0
    done_tasks = 0
    for milestone in goal.milestones:
        for task in milestone.tasks:
            total_tasks += 1
            if task.status == "completed":
                done_tasks += 1

    if total_tasks == 0:
        goal.progress = 0.0
    else:
        goal.progress = round((done_tasks / total_tasks) * 100, 1)

    if done_tasks == total_tasks and total_tasks > 0:
        goal.status = "completed"
        goal.completed_at = datetime.now(timezone.utc)

    # Update milestones
    for milestone in goal.milestones:
        tasks = milestone.tasks
        if all(t.status == "completed" for t in tasks) and tasks:
            milestone.status = "completed"
            milestone.completed_at = datetime.now(timezone.utc)
        elif any(t.status == "in_progress" for t in tasks):
            milestone.status = "in_progress"


def initialize_goal(db: Session, goal_id: str) -> dict:
    """
    Called when a new goal is created. Generates the plan and selects first task.
    """
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    agent_state = _get_or_create_agent_state(db, goal_id)

    pending_tasks = _get_pending_tasks(db, goal_id)
    completed_tasks = _get_completed_tasks(db, goal_id)

    # If no milestones yet, generate plan via LLM
    if not goal.milestones:
        plan = llm().generate_plan(goal.title, goal.description or "")
        _log_event(db, goal_id, "plan_generated", {"plan": plan})

        # Persist milestones and tasks from plan
        for mi_data in plan.get("milestones", []):
            milestone = models.Milestone(
                goal_id=goal_id,
                title=mi_data["title"],
                description=mi_data.get("description", ""),
                order_index=mi_data.get("order_index", 0),
            )
            db.add(milestone)
            db.flush()
            for t_data in mi_data.get("tasks", []):
                task = models.Task(
                    milestone_id=milestone.id,
                    title=t_data["title"],
                    description=t_data.get("description", ""),
                    order_index=t_data.get("order_index", 0),
                    estimated_minutes=t_data.get("estimated_minutes", 30),
                    difficulty=t_data.get("difficulty", "medium"),
                )
                db.add(task)
        db.flush()
        pending_tasks = _get_pending_tasks(db, goal_id)

    # Select first task
    result = llm().select_next_task(goal.title, completed_tasks, pending_tasks)
    next_task_id = result.get("task_id")

    # Mark task as in_progress
    if next_task_id:
        task = db.query(models.Task).filter(models.Task.id == next_task_id).first()
        if task:
            task.status = "in_progress"
            task.started_at = datetime.now(timezone.utc)
            agent_state.current_task_id = next_task_id

    agent_state.state = "waiting_for_student"
    agent_state.iteration = 1
    agent_state.last_action = "initialized"

    _log_event(db, goal_id, "goal_initialized", {
        "next_task_id": next_task_id,
        "rationale": result.get("rationale", ""),
    })

    db.commit()

    # Refresh relationships
    db.refresh(goal)
    pending_tasks = _get_pending_tasks(db, goal_id)

    return {
        "state": "waiting_for_student",
        "next_task_id": next_task_id,
        "rationale": result.get("rationale", ""),
        "pending_count": len(pending_tasks),
    }


def handle_action(
    db: Session,
    goal_id: str,
    action: str,  # "done" | "stuck" | "skip"
    student_message: str = "",
) -> dict:
    """
    Handle a student action on the current task.
    """
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if goal:
        goal.updated_at = datetime.now(timezone.utc)
    agent_state = _get_or_create_agent_state(db, goal_id)
    current_task_id = agent_state.current_task_id

    current_task = None
    if current_task_id:
        current_task = db.query(models.Task).filter(models.Task.id == current_task_id).first()

    current_task_title = current_task.title if current_task else "current task"

    if action == "done":
        # Mark task completed
        if current_task:
            current_task.status = "completed"
            current_task.completed_at = datetime.now(timezone.utc)
            _update_goal_progress(db, goal)

        _log_event(db, goal_id, "task_completed", {
            "task_id": current_task_id,
            "task_title": current_task_title,
            "message": student_message,
        })

        # Observe progress
        observation = llm().observe_progress(current_task_title, student_message)

        # Select next task
        completed_tasks = _get_completed_tasks(db, goal_id)
        pending_tasks = _get_pending_tasks(db, goal_id)

        if not pending_tasks:
            agent_state.state = "completed"
            agent_state.current_task_id = None
            db.commit()
            return {
                "action": "done",
                "observation": observation,
                "goal_completed": True,
                "next_task_id": None,
                "rationale": "🎉 You've completed all tasks in this goal! Outstanding work!",
            }

        next_result = llm().select_next_task(goal.title, completed_tasks, pending_tasks)
        next_task_id = next_result.get("task_id")

        if next_task_id:
            next_task = db.query(models.Task).filter(models.Task.id == next_task_id).first()
            if next_task:
                next_task.status = "in_progress"
                next_task.started_at = datetime.now(timezone.utc)
                agent_state.current_task_id = next_task_id

        agent_state.state = "waiting_for_student"
        agent_state.iteration += 1
        agent_state.last_action = "done"
        db.commit()

        return {
            "action": "done",
            "observation": observation,
            "goal_completed": False,
            "next_task_id": next_task_id,
            "rationale": next_result.get("rationale", ""),
        }

    elif action == "stuck":
        # 1. Capture the roadblock in long-term memory for personalization
        if goal and goal.user_id:
            mem = models.MemoryItem(
                user_id=goal.user_id,
                memory_type="roadblock",
                content=f"Roadblock on '{current_task_title}': {student_message or 'Stuck on task'}",
                confidence=0.95,
            )
            db.add(mem)

        # 2. Log event
        _log_event(db, goal_id, "roadblock_captured", {
            "task_id": current_task_id,
            "task_title": current_task_title,
            "roadblock": student_message or "General difficulty",
        })

        # 3. Use LLM to diagnose roadblock and formulate a 15-min doable micro-step
        adapted_data = llm().adapt_step_for_roadblock(
            current_task_title,
            student_message or "General difficulty",
            goal.title,
        )

        adapted_task_data = adapted_data.get("adapted_task", {})
        checklist_items = adapted_data.get("checklist", [])
        checklist_str = "\n".join(f"- {c}" for c in checklist_items)

        unblocker_desc = (
            f"🎯 **Unblocker Micro-Step for:** {current_task_title}\n\n"
            f"💡 **Diagnosis:** {adapted_data.get('diagnosis', '')}\n\n"
            f"{adapted_task_data.get('description', '')}\n\n"
            f"📋 **Immediate Checklist:**\n{checklist_str}\n\n"
            f"✨ *Why this works:* {adapted_data.get('rationale', '')}"
        )

        # 4. Insert the new adapted unblocker task as in_progress
        target_milestone_id = current_task.milestone_id if current_task else (goal.milestones[0].id if goal.milestones else None)
        target_order = current_task.order_index if current_task else 0

        # Push the blocked task and subsequent tasks down in order_index
        if current_task:
            current_task.status = "pending"
            current_task.order_index = target_order + 1

        new_task = models.Task(
            milestone_id=target_milestone_id,
            title=f"[Unblocker] {adapted_task_data.get('title', 'Resolve Roadblock: Minimal Working Step')}",
            description=unblocker_desc,
            order_index=target_order,
            estimated_minutes=adapted_task_data.get("estimated_minutes", 15),
            difficulty="easy",
            status="in_progress",
            started_at=datetime.now(timezone.utc),
        )
        db.add(new_task)
        db.flush()

        # 5. Move agent state directly to the new unblocker task
        agent_state.current_task_id = new_task.id
        agent_state.state = "waiting_for_student"
        agent_state.last_action = "adapted_roadblock"
        agent_state.iteration += 1

        _log_event(db, goal_id, "step_adapted", {
            "original_task_id": current_task_id,
            "original_task_title": current_task_title,
            "new_task_id": new_task.id,
            "new_task_title": new_task.title,
            "diagnosis": adapted_data.get("diagnosis", ""),
        })

        db.commit()

        return {
            "action": "stuck_adapted",
            "stuck_analysis": adapted_data,
            "new_task": {
                "id": new_task.id,
                "title": new_task.title,
                "description": new_task.description,
                "estimated_minutes": new_task.estimated_minutes,
                "difficulty": new_task.difficulty,
                "status": "in_progress",
            },
            "message": f"Roadblock captured! The agent adapted your plan into a doable 15-minute step: {new_task.title}",
        }

    elif action == "skip":
        if current_task:
            current_task.status = "skipped"
            _update_goal_progress(db, goal)

        _log_event(db, goal_id, "task_skipped", {
            "task_id": current_task_id,
            "task_title": current_task_title,
        })

        completed_tasks = _get_completed_tasks(db, goal_id)
        pending_tasks = _get_pending_tasks(db, goal_id)

        if not pending_tasks:
            agent_state.state = "completed"
            agent_state.current_task_id = None
            db.commit()
            return {
                "action": "skip",
                "goal_completed": True,
                "next_task_id": None,
                "rationale": "All tasks done or skipped!",
            }

        next_result = llm().select_next_task(goal.title, completed_tasks, pending_tasks)
        next_task_id = next_result.get("task_id")

        if next_task_id:
            next_task = db.query(models.Task).filter(models.Task.id == next_task_id).first()
            if next_task:
                next_task.status = "in_progress"
                next_task.started_at = datetime.now(timezone.utc)
                agent_state.current_task_id = next_task_id

        agent_state.state = "waiting_for_student"
        agent_state.last_action = "skip"
        db.commit()

        return {
            "action": "skip",
            "goal_completed": False,
            "next_task_id": next_task_id,
            "rationale": next_result.get("rationale", ""),
        }

    return {"error": f"Unknown action: {action}"}
