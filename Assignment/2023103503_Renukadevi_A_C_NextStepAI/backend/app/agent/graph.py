"""
NextStep Agent — LangGraph state machine.

States:
  idle → analyzing → planning → selecting → waiting_for_student → observing → [selecting | replanning | completed]

The graph is invoked per user action, NOT as a long-running process.
State is persisted in AgentState DB table between calls.
"""
from typing import TypedDict, Optional, List, Any
from langgraph.graph import StateGraph, END

from app.agent.llm_service import llm


class AgentGraphState(TypedDict):
    """LangGraph state schema."""
    goal_id: str
    goal_title: str
    goal_description: str
    user_id: str
    action: str              # "start", "done", "stuck", "skip", "replan"
    student_message: str
    current_task_id: Optional[str]
    current_task_title: str
    completed_tasks: List[dict]
    pending_tasks: List[dict]
    plan_data: dict
    next_task_id: Optional[str]
    next_task_rationale: str
    observation: dict
    stuck_analysis: dict
    output_state: str        # final state to persist
    output: dict             # what to return to the API


# ─── Node implementations ────────────────────────────────────────────────────

def node_analyze_goal(state: AgentGraphState) -> AgentGraphState:
    """Analyze the goal and transition to planning."""
    return {**state, "output_state": "analyzing"}


def node_create_plan(state: AgentGraphState) -> AgentGraphState:
    """Call LLM to generate milestone/task plan."""
    plan = llm().generate_plan(state["goal_title"], state["goal_description"])
    return {
        **state,
        "plan_data": plan,
        "output_state": "planning",
        "output": {"plan": plan},
    }


def node_select_next_task(state: AgentGraphState) -> AgentGraphState:
    """Select the single best next task for the student."""
    result = llm().select_next_task(
        state["goal_title"],
        state["completed_tasks"],
        state["pending_tasks"],
    )
    return {
        **state,
        "next_task_id": result.get("task_id"),
        "next_task_rationale": result.get("rationale", ""),
        "output_state": "waiting_for_student",
        "output": {
            "next_task_id": result.get("task_id"),
            "rationale": result.get("rationale", ""),
        },
    }


def node_observe_completion(state: AgentGraphState) -> AgentGraphState:
    """Observe the student's completion report and provide feedback."""
    observation = llm().observe_progress(
        state["current_task_title"],
        state["student_message"],
    )
    return {
        **state,
        "observation": observation,
        "output_state": "observing",
        "output": {"observation": observation},
    }


def node_analyze_stuck(state: AgentGraphState) -> AgentGraphState:
    """Help the student get unstuck."""
    analysis = llm().analyze_stuck(
        state["current_task_title"],
        state["student_message"],
    )
    return {
        **state,
        "stuck_analysis": analysis,
        "output_state": "replanning",
        "output": {"stuck_analysis": analysis},
    }


def node_goal_completed(state: AgentGraphState) -> AgentGraphState:
    return {
        **state,
        "output_state": "completed",
        "output": {"message": "🎉 Goal completed! Outstanding work!"},
    }


# ─── Routing functions ────────────────────────────────────────────────────────

def route_from_action(state: AgentGraphState) -> str:
    action = state.get("action", "")
    if action == "start":
        return "select_next_task"
    if action == "done":
        return "observe_completion"
    if action == "stuck":
        return "analyze_stuck"
    if action == "skip":
        return "select_next_task"
    if action == "replan":
        return "select_next_task"
    return END


def route_after_observe(state: AgentGraphState) -> str:
    if not state.get("pending_tasks"):
        return "goal_completed"
    return "select_next_task"


def route_after_stuck(state: AgentGraphState) -> str:
    return END  # Return stuck analysis to the user; they decide next action


# ─── Build the graph ─────────────────────────────────────────────────────────

def build_agent_graph():
    builder = StateGraph(AgentGraphState)

    builder.add_node("analyze_goal", node_analyze_goal)
    builder.add_node("create_plan", node_create_plan)
    builder.add_node("select_next_task", node_select_next_task)
    builder.add_node("observe_completion", node_observe_completion)
    builder.add_node("analyze_stuck", node_analyze_stuck)
    builder.add_node("goal_completed", node_goal_completed)

    # Entry: analyze_goal → create_plan for new goals, else route by action
    builder.set_entry_point("analyze_goal")
    builder.add_edge("analyze_goal", "create_plan")
    builder.add_edge("create_plan", "select_next_task")
    builder.add_edge("select_next_task", END)
    builder.add_edge("goal_completed", END)

    # observe → route to next task or completed
    builder.add_conditional_edges("observe_completion", route_after_observe, {
        "select_next_task": "select_next_task",
        "goal_completed": "goal_completed",
    })

    builder.add_conditional_edges("analyze_stuck", route_after_stuck, {
        END: END,
    })

    return builder.compile()


def build_action_graph():
    """Lightweight graph for mid-task actions (done/stuck/skip)."""
    builder = StateGraph(AgentGraphState)

    builder.add_node("route_action", lambda s: s)
    builder.add_node("observe_completion", node_observe_completion)
    builder.add_node("analyze_stuck", node_analyze_stuck)
    builder.add_node("select_next_task", node_select_next_task)
    builder.add_node("goal_completed", node_goal_completed)

    builder.set_entry_point("route_action")
    builder.add_conditional_edges("route_action", route_from_action, {
        "select_next_task": "select_next_task",
        "observe_completion": "observe_completion",
        "analyze_stuck": "analyze_stuck",
        END: END,
    })

    builder.add_conditional_edges("observe_completion", route_after_observe, {
        "select_next_task": "select_next_task",
        "goal_completed": "goal_completed",
    })
    builder.add_edge("select_next_task", END)
    builder.add_edge("analyze_stuck", END)
    builder.add_edge("goal_completed", END)

    return builder.compile()


# Module-level compiled graphs
new_goal_graph = build_agent_graph()
action_graph = build_action_graph()
