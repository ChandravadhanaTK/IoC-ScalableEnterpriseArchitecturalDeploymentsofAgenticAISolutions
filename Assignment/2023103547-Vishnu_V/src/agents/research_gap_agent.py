import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pydantic import BaseModel
from models.schemas import ResearchGap

class ResearchGapList(BaseModel):
    gaps: list[ResearchGap]

from utils.llm import call_llm_structured
from utils.trace import create_trace_event
from utils.logging import get_logger
from graph.state import ResearchState
from typing import Any
import json

logger = get_logger(__name__)

def research_gap_node(state: ResearchState) -> dict[str, Any]:
    """
    Identifies research gaps from the comparison table, extractions, and analyses.
    
    Args:
        state (ResearchState): The current research state.
        
    Returns:
        dict[str, Any]: State updates with gaps, phase, and trace events.
    """
    comparison = state.get("comparison", {})
    extracted = state.get("extracted", [])
    analyses = state.get("analyses", [])
    
    prompt = f"""
    Analyze the following research data to identify research gaps.
    
    Comparison: {json.dumps(comparison)}
    Extractions: {json.dumps(extracted)}
    Analyses: {json.dumps(analyses)}
    
    Identify gaps. For each gap, provide:
    - statement
    - kind (explicit or inferred)
    - observed_limitations
    - supporting_paper_ids
    - evidence
    - confidence (high, medium, low)
    - rationale
    """
    
    try:
        gaps_list = call_llm_structured(prompt, ResearchGapList, temperature=0.2)
        
        abstract_only_papers = {ep.get("paper_id") for ep in extracted if ep.get("source_depth") == "abstract_only"}
        
        for gap in gaps_list.gaps:
            has_abstract_only = any(pid in abstract_only_papers for pid in gap.supporting_paper_ids)
            if has_abstract_only and gap.confidence.lower() == "high":
                gap.confidence = "medium"
                gap.rationale += " (Confidence capped at medium due to abstract-only sources)"
                
        trace_event = create_trace_event(
            agent="research_gap",
            action="gaps_identified",
            detail=f"Identified {len(gaps_list.gaps)} research gaps."
        )

        return {
            "gaps": [gap.model_dump() for gap in gaps_list.gaps],
            "phase": "citation_verification",
            "trace": [trace_event.model_dump()]
        }
        
    except Exception as e:
        logger.error(f"Error in research_gap_node: {e}")
        raise e
