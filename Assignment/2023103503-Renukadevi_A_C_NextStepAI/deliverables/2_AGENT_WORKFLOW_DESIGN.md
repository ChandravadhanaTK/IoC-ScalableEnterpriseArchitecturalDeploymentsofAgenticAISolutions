# Artifact 2: Agent Workflow Design & State Machine Specification

## 1. Core Workflow Philosophy
NextStep implements an autonomous agentic loop designed to prevent student cognitive fatigue. When presented with comprehensive syllabi or 100-step roadmaps, learners experience paralysis of choice. NextStep enforces **Single-Action Serialization**: the system manages the complexity of dependency graphs, while the student only interacts with one atomic challenge at a time.

```
+-----------------------------------------------------------------------------------------+
|                                    THE AGENT LOOP                                       |
|                                                                                         |
|       GOAL                                                                              |
|         │                                                                               |
|         ▼                                                                               |
|    UNDERSTAND (Taxonomy Classification & Context Analysis)                              |
|         │                                                                               |
|         ▼                                                                               |
|       PLAN (Milestone Decomposition & DAG Dependency Structuring)                       |
|         │                                                                               |
|         ▼                                                                               |
|   SELECT NEXT ACTION (Topological Dependency Resolution: Exactly 1 Task)                |
|         │                                                                               |
|         ▼                                                                               |
|   WAIT FOR STUDENT (Interactive UI with Pomodoro & Decision Options)                    |
|         │                                                                               |
|         ├───────────────────┬───────────────────────────────┤                           |
|         ▼                   ▼                               ▼                           |
|   STUDENT 'DONE'     STUDENT 'STUCK'                 STUDENT 'SKIP'                     |
|         │                   │                               │                           |
|         ▼                   ▼                               │                           |
|   OBSERVE RESULT      REPLAN / DIAGNOSE                     │                           |
|   (Analyze notes      (Break into micro-steps               │                           |
|    & compute %)        & suggest alternatives)              │                           |
|         │                   │                               │                           |
|         ▼                   ▼                               │                           |
|   UPDATE PROGRESS     STUDENT RESUMES OR SKIPS              │                           |
|         │                   │                               │                           |
|         └───────────────────┴───────────────────────────────┘                           |
|                             │                                                           |
|                             ▼                                                           |
|                     SELECT NEXT ACTION                                                  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Participant Roles & Authorization Boundaries

| Role | Entity | Capabilities & Workflow Bounds |
| :--- | :--- | :--- |
| **Student** | Primary Human-in-the-Loop Actor | Declares objectives, completes micro-tasks, provides reflective notes, triggers stuck diagnoses, switches active goals. Cannot access other students' workflows or administrative telemetry. |
| **NextStep Agent** | Autonomous Orchestrator (LangGraph) | Analyzes intent, generates milestone plans, maintains topological DAG ordering, evaluates progress observations, constructs recovery pathways upon roadblocks. |
| **LLM Inference Service** | Cognitive Intelligence Engine | Generates domain-specific tasks (`gemini-3.8-flash` or OpenAI), diagnoses runtime errors, produces encouragement insights. Governed by deterministic mock fallbacks. |
| **System Administrator** | Governance & Operations Actor | Monitors overall system velocity, tracks completion rates, inspects execution event streams, manages user activation states. |

---

## 3. Finite State Machine (FSM) States

| State | Classification | Description & Entry Condition |
| :--- | :--- | :--- |
| `IDLE` | Quiescent | No active goal currently running, or awaiting initial user declaration. |
| `ANALYZING` | Compute | Parsing user goal prompt, matching keywords against educational taxonomies (MERN, DSA, ML, Exam). |
| `PLANNING` | Generative | Deconstructing classified objective into 3 to 5 chronological milestones with structured tasks. |
| `SELECTING` | Deterministic | Traversing topological graph to identify the first uncompleted task whose prerequisites are satisfied. |
| `WAITING_FOR_STUDENT` | Blocked / Async | Halting execution and rendering the Next Action Card. Awaiting student dispatch: `done`, `stuck`, or `skip`. |
| `OBSERVING` | Compute | Ingesting student reflection note, calculating milestone/goal progress percentages, checking completion criteria. |
| `REPLANNING` | Generative / Recovery | Analyzing student's stuck description, generating immediate micro-steps and alternative pathways. |
| `COMPLETED` | Terminal / Celebration | All milestones and tasks satisfied. Unlocks celebratory screen and seamless transition to next goal. |

---

## 4. LangGraph Graph Definition & Code Structure

The state machine is compiled using LangGraph's functional StateGraph:

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional

class AgentGraphState(TypedDict):
    goal_id: str
    goal_title: str
    goal_description: str
    user_id: str
    action: str              # "start", "done", "stuck", "skip"
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
    output_state: str

builder = StateGraph(AgentGraphState)

# Node registration
builder.add_node("analyze_goal", node_analyze_goal)
builder.add_node("create_plan", node_create_plan)
builder.add_node("select_next_task", node_select_next_task)
builder.add_node("observe_completion", node_observe_completion)
builder.add_node("analyze_stuck", node_analyze_stuck)
builder.add_node("goal_completed", node_goal_completed)

# Core Transitions
builder.set_entry_point("analyze_goal")
builder.add_edge("analyze_goal", "create_plan")
builder.add_edge("create_plan", "select_next_task")
builder.add_edge("select_next_task", END)
builder.add_edge("goal_completed", END)

# Conditional Routing
builder.add_conditional_edges("observe_completion", route_after_observe, {
    "select_next_task": "select_next_task",
    "goal_completed": "goal_completed",
})
```

---

## 5. Human-in-the-Loop Handoffs & Approvals

Enterprise workflows require human oversight before committing state changes:
1. **Student Reflection Handoff**: The student validates their own completion by clicking "Mark as Done" and optionally entering what was learned.
2. **Roadblock Escalation Handoff**: When a student encounters unexpected blockers (e.g. environment failure, syntax error), they trigger "I'm Stuck". The agent does not silently mutate the plan; it presents a structured diagnosis and awaits human confirmation to resume or skip.
3. **Multi-Goal Prioritization Handoff**: The user can toggle active focus between concurrent tracks (e.g. "Prepare DSA" vs "Build Portfolio") without losing state.

---

## 6. Failure Modes, Edge Cases & Recovery Paths

```
+---------------------------+-----------------------------------+--------------------------------------------+
| Failure Mode              | Root Cause                        | Recovery Pathway                           |
+---------------------------+-----------------------------------+--------------------------------------------+
| LLM Rate Limit / 503      | External API outage               | Fallback to Deterministic Mock Planner     |
| Dependency Deadlock       | Task blocked by unfinished prereq | Topological Solver routes around deadlock  |
| Goal 100% Completed       | All tasks in goal marked done     | UI triggers Celebration & Next Goal Switch |
| Stuck Student Disconnect  | Student cannot resolve micro-step | One-click "Skip & Move to Next" in modal   |
| Database Connection Drop  | Transient network timeout         | SQLAlchemy Session rollback & retry loop   |
+---------------------------+-----------------------------------+--------------------------------------------+
```
