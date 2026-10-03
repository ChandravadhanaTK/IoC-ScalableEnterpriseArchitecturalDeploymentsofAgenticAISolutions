import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.schemas import PaperAnalysis
from utils.llm import LLMConfigError, call_llm_structured
from utils.trace import create_trace_event
from utils.logging import get_logger
from graph.state import ResearchState
from typing import Any
import json

logger = get_logger(__name__)

def analysis_node(state: ResearchState) -> dict[str, Any]:
    """
    Analyzes each extracted paper to produce a PaperAnalysis.
    
    Args:
        state (ResearchState): The current research state containing extracted papers.
        
    Returns:
        dict[str, Any]: State updates with analyses, phase, and trace events.
    """
    extracted_papers = state.get("extracted", [])
    analyses: list[PaperAnalysis] = []
    traces: list[dict[str, Any]] = []
    
    for ep_dict in extracted_papers:
        try:
            paper_id = ep_dict.get("paper_id")
            
            prompt = f"""
            Analyze the following extracted information for paper {paper_id}:
            
            {json.dumps(ep_dict, indent=2)}
            
            Provide a comprehensive analysis based on the extracted fields and retrieved evidence.
            """
            
            analysis = call_llm_structured(prompt, PaperAnalysis, temperature=0.2)
            analysis.paper_id = paper_id
            analyses.append(analysis)
            
            trace_event = create_trace_event(
                agent="analysis",
                action="paper_analyzed",
                detail=f"Analyzed paper {paper_id}."
            )

            traces.append(trace_event.model_dump())
            
        except LLMConfigError:
            raise
        except Exception as e:
            logger.error(f"Error analyzing paper: {e}")
            traces.append(create_trace_event(
                agent="analysis", action="paper_failed", status="error",
                detail=f"{ep_dict.get('paper_id')}: {e}").model_dump())

    if extracted_papers and not analyses:
        raise RuntimeError("Analysis failed for every paper - see the Research Trace.")

    return {
        "analyses": [a.model_dump() for a in analyses],
        "phase": "comparison",
        "trace": traces
    }
