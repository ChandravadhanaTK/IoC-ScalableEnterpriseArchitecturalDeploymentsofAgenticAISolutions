"""LangGraph workflow for ResearchPilot.

Defines the full research pipeline as a compiled StateGraph with:
- SQLite checkpointer for persistence across Streamlit reruns
- interrupt() at two human approval checkpoints
- Deterministic routing via conditional edges
- Retry logic with exponential backoff
- Trace event logging at every node
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Literal

from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import interrupt, Command

from graph.state import ResearchState
from utils.config import get_settings, DATA_DIR
from utils.logging import get_logger
from utils.trace import create_trace_event, mirror_trace_event

logger = get_logger(__name__)

# Maximum retries per node
MAX_RETRIES = 3
# Maximum survey revisions
MAX_SURVEY_REVISIONS = 3

# SQLite database for checkpoints
CHECKPOINT_DB = DATA_DIR / "checkpoints.db"


def _get_thread_id(state: ResearchState) -> str:
    """Extract thread_id from state, defaulting to 'default'."""
    return state.get("thread_id", "default")


def _append_trace(
    state: ResearchState,
    agent: str,
    action: str,
    status: str = "ok",
    detail: str = "",
) -> dict[str, Any]:
    """Create a trace event and mirror it to disk.

    Args:
        state: Current graph state.
        agent: Name of the agent.
        action: Action description.
        status: Event status.
        detail: Additional detail.

    Returns:
        Trace event dict for state update.
    """
    event = create_trace_event(agent, action, status, detail)
    thread_id = _get_thread_id(state)
    mirror_trace_event(thread_id, event)
    return event.model_dump()


# ── Node Functions ──────────────────────────────────────────────────


def supervisor_plan(state: ResearchState) -> dict[str, Any]:
    """Supervisor planning node: analyze question, extract keywords, create plan."""
    from agents.supervisor import supervisor_plan_node

    try:
        result = supervisor_plan_node(state)
        if result.get("phase") == "error":
            detail = "; ".join(result.get("errors", [])[-1:]) or "unknown error"
            trace = _append_trace(state, "supervisor", "plan_failed", "error", detail)
        elif result.get("clarification_question"):
            trace = _append_trace(state, "supervisor", "clarification_requested", "ok", result["clarification_question"])
        else:
            trace = _append_trace(state, "supervisor", "plan_created", "ok", "Research plan generated")
        result.setdefault("trace", [])
        result["trace"].append(trace)
        return result
    except Exception as e:
        logger.error("Supervisor failed: %s", e)
        trace = _append_trace(state, "supervisor", "plan_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Supervisor error: {e}"],
            "phase": "error",
            "trace": [trace],
        }


def search(state: ResearchState) -> dict[str, Any]:
    """Paper search node: search APIs and rank candidates."""
    from agents.search_agent import NoPapersFoundError, search_node
    from utils.llm import LLMConfigError

    try:
        result = search_node(state)
        trace = _append_trace(
            state, "search_agent", "search_complete", "ok",
            f"Found {len(result.get('candidate_papers', []))} papers"
        )
        result.setdefault("trace", [])
        result["trace"].append(trace)
        return result
    except (NoPapersFoundError, LLMConfigError) as e:
        # Retrying cannot help (nothing found / bad API key or model)
        logger.error("Search failed (not retryable): %s", e)
        trace = _append_trace(state, "search_agent", "search_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Search error: {e}"],
            "phase": "error",
            "trace": [trace],
        }
    except Exception as e:
        logger.error("Search failed: %s", e)
        trace = _append_trace(state, "search_agent", "search_failed", "error", str(e))
        retries = state.get("retries", 0) + 1
        return {
            "errors": state.get("errors", []) + [f"Search error: {e}"],
            "retries": retries,
            "phase": "search_retry" if retries < MAX_RETRIES else "error",
            "trace": [trace],
        }


def human_approval_1(state: ResearchState) -> dict[str, Any]:
    """Checkpoint 1: User selects papers to approve.

    Uses LangGraph interrupt() to pause execution and wait for user input.
    The user selects which papers to keep from the candidate list.
    """
    candidates = state.get("candidate_papers", [])
    trace = _append_trace(
        state, "checkpoint", "human_approval_1", "waiting",
        f"Waiting for user to approve from {len(candidates)} candidates"
    )

    # Interrupt and wait for user approval
    # The resume value will be a dict with 'approved_paper_ids' and optionally 'uploaded_pdfs'
    approval = interrupt({
        "type": "paper_approval",
        "message": "Please review and select the papers you want to include in your analysis.",
        "candidates": candidates,
    })

    approved_ids = approval.get("approved_paper_ids", [])
    uploaded_pdfs = approval.get("uploaded_pdfs", {})

    trace2 = _append_trace(
        state, "checkpoint", "papers_approved", "ok",
        f"User approved {len(approved_ids)} papers"
    )

    return {
        "approved_paper_ids": approved_ids,
        "uploaded_pdfs": uploaded_pdfs,
        "phase": "extraction",
        "trace": [trace, trace2],
    }


def extraction(state: ResearchState) -> dict[str, Any]:
    """Paper extraction node: extract structured info from approved papers."""
    from agents.extraction_agent import extraction_node

    try:
        result = extraction_node(state)
        trace = _append_trace(
            state, "extraction_agent", "extraction_complete", "ok",
            f"Extracted {len(result.get('extracted', []))} papers"
        )
        result.setdefault("trace", [])
        result["trace"].append(trace)
        return result
    except Exception as e:
        logger.error("Extraction failed: %s", e)
        trace = _append_trace(state, "extraction_agent", "extraction_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Extraction error: {e}"],
            "phase": "error",
            "trace": [trace],
        }


def analysis(state: ResearchState) -> dict[str, Any]:
    """Paper analysis node: produce summaries and findings."""
    from agents.analysis_agent import analysis_node

    try:
        result = analysis_node(state)
        trace = _append_trace(
            state, "analysis_agent", "analysis_complete", "ok",
            f"Analyzed {len(result.get('analyses', []))} papers"
        )
        result.setdefault("trace", [])
        result["trace"].append(trace)
        return result
    except Exception as e:
        logger.error("Analysis failed: %s", e)
        trace = _append_trace(state, "analysis_agent", "analysis_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Analysis error: {e}"],
            "phase": "error",
            "trace": [trace],
        }


def comparison(state: ResearchState) -> dict[str, Any]:
    """Comparison node: build comparison table."""
    from agents.comparison_agent import comparison_node

    try:
        result = comparison_node(state)
        trace = _append_trace(state, "comparison_agent", "comparison_complete", "ok", "Table built")
        result.setdefault("trace", [])
        result["trace"].append(trace)
        return result
    except Exception as e:
        logger.error("Comparison failed: %s", e)
        trace = _append_trace(state, "comparison_agent", "comparison_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Comparison error: {e}"],
            "phase": "error",
            "trace": [trace],
        }


def research_gap(state: ResearchState) -> dict[str, Any]:
    """Research gap identification node."""
    from agents.research_gap_agent import research_gap_node

    try:
        result = research_gap_node(state)
        trace = _append_trace(
            state, "gap_agent", "gaps_identified", "ok",
            f"Found {len(result.get('gaps', []))} gaps"
        )
        result.setdefault("trace", [])
        result["trace"].append(trace)
        return result
    except Exception as e:
        logger.error("Gap analysis failed: %s", e)
        trace = _append_trace(state, "gap_agent", "gap_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Gap analysis error: {e}"],
            "phase": "error",
            "trace": [trace],
        }


def citation_verification(state: ResearchState) -> dict[str, Any]:
    """Citation verification node: verify all approved papers."""
    from agents.citation_agent import citation_verification_node

    try:
        result = citation_verification_node(state)
        checks = result.get("citation_checks", [])
        verified = sum(1 for c in checks if c.get("status") == "VERIFIED")
        trace = _append_trace(
            state, "citation_agent", "verification_complete", "ok",
            f"Verified {verified}/{len(checks)} citations"
        )
        result.setdefault("trace", [])
        result["trace"].append(trace)
        return result
    except Exception as e:
        logger.error("Citation verification failed: %s", e)
        trace = _append_trace(state, "citation_agent", "verification_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Citation error: {e}"],
            "phase": "error",
            "trace": [trace],
        }


def survey(state: ResearchState) -> dict[str, Any]:
    """Literature survey generation node."""
    from agents.survey_agent import survey_node

    try:
        result = survey_node(state)
        revision = state.get("survey_revision_count", 0)
        trace = _append_trace(
            state, "survey_agent", "survey_generated", "ok",
            f"Survey draft generated (revision {revision})"
        )
        result.setdefault("trace", [])
        result["trace"].append(trace)
        result["survey_revision_count"] = revision + 1
        return result
    except Exception as e:
        logger.error("Survey generation failed: %s", e)
        trace = _append_trace(state, "survey_agent", "survey_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Survey error: {e}"],
            "phase": "error",
            "trace": [trace],
        }


def human_approval_2(state: ResearchState) -> dict[str, Any]:
    """Checkpoint 2: User approves the survey or requests changes.

    Uses LangGraph interrupt() for human-in-the-loop approval.
    The user can approve or provide feedback for revisions (max 3).
    """
    survey_text = state.get("survey_draft", "")
    revision_count = state.get("survey_revision_count", 0)

    trace = _append_trace(
        state, "checkpoint", "human_approval_2", "waiting",
        f"Waiting for survey approval (revision {revision_count})"
    )

    approval = interrupt({
        "type": "survey_approval",
        "message": "Please review the literature survey. Approve or provide feedback for revision.",
        "survey_draft": survey_text,
        "revision_count": revision_count,
        "max_revisions": MAX_SURVEY_REVISIONS,
    })

    approved = approval.get("approved", False)
    feedback = approval.get("feedback", "")

    if approved:
        trace2 = _append_trace(state, "checkpoint", "survey_approved", "ok", "Survey approved by user")
        return {
            "survey_approved": True,
            "phase": "report",
            "trace": [trace, trace2],
        }
    else:
        if revision_count >= MAX_SURVEY_REVISIONS:
            trace2 = _append_trace(
                state, "checkpoint", "max_revisions_reached", "warning",
                f"Max revisions ({MAX_SURVEY_REVISIONS}) reached, proceeding with current draft"
            )
            return {
                "survey_approved": True,
                "phase": "report",
                "trace": [trace, trace2],
            }
        trace2 = _append_trace(
            state, "checkpoint", "survey_revision_requested", "ok",
            f"User requested revision: {feedback[:100]}"
        )
        return {
            "survey_approved": False,
            "survey_feedback": feedback,
            "phase": "survey",
            "trace": [trace, trace2],
        }


def report(state: ResearchState) -> dict[str, Any]:
    """Report assembly node: build final markdown report."""
    from agents.report_agent import report_node

    try:
        result = report_node(state)
        trace = _append_trace(state, "report_agent", "report_complete", "ok", "Final report assembled")
        result.setdefault("trace", [])
        result["trace"].append(trace)
        return result
    except Exception as e:
        logger.error("Report generation failed: %s", e)
        trace = _append_trace(state, "report_agent", "report_failed", "error", str(e))
        return {
            "errors": state.get("errors", []) + [f"Report error: {e}"],
            "phase": "error",
            "trace": [trace],
        }


# ── Routing Functions ───────────────────────────────────────────────


def route_after_supervisor(state: ResearchState) -> str:
    """Route after supervisor: check if clarification is needed.

    Returns:
        Next node name.
    """
    if state.get("clarification_question"):
        return "needs_clarification"
    if state.get("phase") == "error":
        return "error_end"
    return "search"


def route_after_search(state: ResearchState) -> str:
    """Route after search: check for errors or proceed to approval."""
    phase = state.get("phase", "")
    if phase == "error":
        return "error_end"
    if phase == "search_retry":
        return "search"
    return "human_approval_1"


def route_after_approval_2(state: ResearchState) -> str:
    """Route after survey approval: to report or back to survey."""
    if state.get("survey_approved", False):
        return "report"
    return "survey"


def route_generic(state: ResearchState) -> str:
    """Generic router that checks phase for error."""
    if state.get("phase") == "error":
        return "error_end"
    return "continue"


# ── Error/Clarification Nodes ──────────────────────────────────────


def needs_clarification_node(state: ResearchState) -> dict[str, Any]:
    """Handle clarification needed: interrupt to ask user."""
    question = state.get("clarification_question", "Could you please provide more details about your research question?")

    trace = _append_trace(
        state, "supervisor", "clarification_needed", "waiting", question
    )

    answer = interrupt({
        "type": "clarification",
        "message": question,
    })

    clarification = answer.get("answer", "") if isinstance(answer, dict) else str(answer)

    trace2 = _append_trace(
        state, "supervisor", "clarification_received", "ok",
        f"User answered: {clarification[:100]}"
    )

    # Update the research question with clarification
    original_q = state.get("research_question", "")
    enhanced_q = f"{original_q} [Additional context: {clarification}]"

    return {
        "research_question": enhanced_q,
        "clarification_answer": clarification,
        "clarification_question": "",  # Clear the question
        "phase": "planning",
        "trace": [trace, trace2],
    }


def error_end_node(state: ResearchState) -> dict[str, Any]:
    """Terminal error node: log errors and stop."""
    errors = state.get("errors", [])
    trace = _append_trace(
        state, "system", "workflow_error", "error",
        f"Workflow stopped with {len(errors)} error(s): {'; '.join(errors[-3:])}"
    )
    return {
        "phase": "error",
        "trace": [trace],
    }


# ── Graph Builder ───────────────────────────────────────────────────


def build_graph() -> StateGraph:
    """Build the ResearchPilot LangGraph workflow.

    Returns:
        Compiled StateGraph with SQLite checkpointer.
    """
    builder = StateGraph(ResearchState)

    # Add all nodes
    builder.add_node("supervisor_plan", supervisor_plan)
    builder.add_node("search", search)
    builder.add_node("human_approval_1", human_approval_1)
    builder.add_node("extraction", extraction)
    builder.add_node("analysis", analysis)
    builder.add_node("comparison", comparison)
    builder.add_node("research_gap", research_gap)
    builder.add_node("citation_verification", citation_verification)
    builder.add_node("survey", survey)
    builder.add_node("human_approval_2", human_approval_2)
    builder.add_node("report", report)
    builder.add_node("needs_clarification", needs_clarification_node)
    builder.add_node("error_end", error_end_node)

    # Entry point
    builder.add_edge(START, "supervisor_plan")

    # Conditional after supervisor
    builder.add_conditional_edges(
        "supervisor_plan",
        route_after_supervisor,
        {
            "search": "search",
            "needs_clarification": "needs_clarification",
            "error_end": "error_end",
        },
    )

    # Clarification loops back to supervisor
    builder.add_edge("needs_clarification", "supervisor_plan")

    # After search
    builder.add_conditional_edges(
        "search",
        route_after_search,
        {
            "human_approval_1": "human_approval_1",
            "search": "search",  # retry
            "error_end": "error_end",
        },
    )

    # Pipeline after approval 1 - any node that reports phase == "error" stops the run
    pipeline = [
        ("human_approval_1", "extraction"),
        ("extraction", "analysis"),
        ("analysis", "comparison"),
        ("comparison", "research_gap"),
        ("research_gap", "citation_verification"),
        ("citation_verification", "survey"),
    ]
    for src, dst in pipeline:
        builder.add_conditional_edges(src, route_generic, {"continue": dst, "error_end": "error_end"})

    # Survey to approval 2
    builder.add_conditional_edges(
        "survey", route_generic, {"continue": "human_approval_2", "error_end": "error_end"}
    )

    # Conditional after approval 2
    builder.add_conditional_edges(
        "human_approval_2",
        route_after_approval_2,
        {
            "report": "report",
            "survey": "survey",  # revision loop
        },
    )

    # Report to end (report errors also end the run; the UI shows state["errors"])
    builder.add_edge("report", END)

    # Error end
    builder.add_edge("error_end", END)

    return builder


def get_compiled_graph():
    """Get the compiled graph with SQLite checkpointer.

    Returns:
        Compiled graph ready for invocation.
    """
    builder = build_graph()

    # Create SQLite checkpointer with check_same_thread=False for Streamlit
    conn = sqlite3.connect(str(CHECKPOINT_DB), check_same_thread=False)
    checkpointer = SqliteSaver(conn)

    graph = builder.compile(checkpointer=checkpointer)
    return graph


def create_initial_state(
    research_question: str,
    thread_id: str,
    year_from: int = 2020,
    year_to: int = 2025,
    num_papers: int = 15,
    citation_style: str = "IEEE",
) -> dict[str, Any]:
    """Create the initial state for a new research session.

    Args:
        research_question: The user's research question.
        thread_id: Unique thread identifier.
        year_from: Start year for paper search.
        year_to: End year for paper search.
        num_papers: Maximum papers to find.
        citation_style: Reference formatting style.

    Returns:
        Initial state dictionary.
    """
    return {
        "research_question": research_question,
        "year_from": year_from,
        "year_to": year_to,
        "num_papers": num_papers,
        "citation_style": citation_style,
        "plan": {},
        "candidate_papers": [],
        "approved_paper_ids": [],
        "uploaded_pdfs": {},
        "extracted": [],
        "analyses": [],
        "comparison": {},
        "gaps": [],
        "citation_checks": [],
        "survey_draft": "",
        "survey_feedback": "",
        "survey_revision_count": 0,
        "survey_approved": False,
        "final_report": "",
        "errors": [],
        "retries": 0,
        "phase": "planning",
        "trace": [],
        "thread_id": thread_id,
        "clarification_question": "",
        "clarification_answer": "",
    }
