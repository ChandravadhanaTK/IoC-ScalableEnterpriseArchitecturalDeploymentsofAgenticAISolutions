import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Any
from models.schemas import SupervisorPlan
from utils.llm import call_llm_structured
from utils.trace import create_trace_event
from utils.logging import get_logger
from graph.state import ResearchState

logger = get_logger(__name__)

def supervisor_plan_node(state: ResearchState) -> dict[str, Any]:
    """
    Analyzes the research question, extracts keywords, suggests search queries,
    and determines if clarification is needed.
    
    Args:
        state (ResearchState): The current research state containing the research question.
        
    Returns:
        dict[str, Any]: State updates with the plan, phase, and trace events.
    """
    research_question = state.get("research_question", "").strip()

    # Guardrail check for empty input
    if not research_question:
        logger.warning("Empty research question provided to supervisor_plan_node.")
        return {
            "phase": "clarification",
            "clarification_question": "Please provide a valid research question to start the analysis."
        }
    
    prompt = f"""
    Analyze the following research question:
    "{research_question}"
    
    Extract the key research topics and keywords.
    Suggest 2-3 search query variations for academic databases.
    Determine if the question is specific enough or needs clarification from the user.
    Provide a brief research plan summary.
    """
    
    try:
        # Call LLM for structured output
        plan: SupervisorPlan = call_llm_structured(
            prompt, 
            SupervisorPlan, 
            temperature=0.2
        )
        
        trace_event = create_trace_event(
            agent="supervisor",
            action="plan_generated",
            detail=f"Generated plan for question: {research_question[:50]}..."
        )

        updates: dict[str, Any] = {
            "trace": [trace_event.model_dump()] if hasattr(trace_event, 'model_dump') else [trace_event]
        }
        
        # Route phase based on output schema determination
        if getattr(plan, "needs_clarification", False):
            updates["clarification_question"] = (
                plan.clarification_question
                or "Could you make your research question more specific (topic, task, domain)?")
            updates["phase"] = "clarification"
        else:
            updates["plan"] = plan.model_dump() if hasattr(plan, 'model_dump') else plan
            updates["phase"] = "search"
            updates["clarification_question"] = ""
            
        return updates

    except Exception as e:
        logger.error(f"Error in supervisor_plan_node: {e}")
        # Surface the real message to the UI (errors is the field the UI displays)
        return {
            "phase": "error",
            "errors": state.get("errors", []) + [f"Supervisor error: {e}"],
        }