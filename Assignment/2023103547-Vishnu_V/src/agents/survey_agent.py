import sys
import re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utils.llm import call_llm
from utils.trace import create_trace_event
from utils.logging import get_logger
from graph.state import ResearchState
from typing import Any
import json

logger = get_logger(__name__)

def survey_node(state: ResearchState) -> dict[str, Any]:
    """
    Generates a thematic literature survey.
    
    Args:
        state (ResearchState): The current research state.
        
    Returns:
        dict[str, Any]: State updates with survey draft, phase, and trace events.
    """
    extracted = state.get("extracted", [])
    comparison = state.get("comparison", {})
    gaps = state.get("gaps", [])
    approved_paper_ids = state.get("approved_paper_ids", [])
    survey_revision_count = state.get("survey_revision_count", 0)
    survey_feedback = state.get("survey_feedback", "")
    
    prompt = f"""
    Generate a THEMATIC literature survey (NOT paper-by-paper) based on the following data:
    
    Extractions: {json.dumps(extracted)}
    Comparison: {json.dumps(comparison)}
    Gaps: {json.dumps(gaps)}
    
    Structure:
    - Introduction
    - Theme 1..N
    - Comparison
    - Research Gap
    - Proposed Research Direction
    
    Use markers like [P01], [P02] for citations.
    """
    
    if survey_revision_count > 0 and survey_feedback:
        prompt += f"\n\nPlease incorporate the following feedback: {survey_feedback}"
        
    try:
        survey_text = call_llm(prompt)
        
        # CITATION GUARD
        # Find all [P##] markers
        markers = set(re.findall(r'\[(P\d+)\]', survey_text))
        approved_set = set(approved_paper_ids)
        
        for marker in markers:
            if marker not in approved_set:
                logger.warning(f"Invalid citation marker found: [{marker}]")
                survey_text = survey_text.replace(f"[{marker}]", f"[{marker} - UNVERIFIED]")
                
        trace_event = create_trace_event(
            agent="survey",
            action="survey_generated",
            detail="Generated thematic literature survey."
        )

        return {
            "survey_draft": survey_text,
            "phase": "human_approval_2",
            "trace": [trace_event.model_dump()]
        }
        
    except Exception as e:
        logger.error(f"Error in survey_node: {e}")
        raise e
