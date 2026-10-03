import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tools.paper_comparison import compare_papers
from utils.trace import create_trace_event
from utils.logging import get_logger
from graph.state import ResearchState
from typing import Any

logger = get_logger(__name__)

def comparison_node(state: ResearchState) -> dict[str, Any]:
    """
    Compares the extracted papers and generates a comparison table.
    
    Args:
        state (ResearchState): The current research state containing extracted papers.
        
    Returns:
        dict[str, Any]: State updates with the comparison table, phase, and trace events.
    """
    extracted = state.get("extracted", [])
    
    try:
        table = compare_papers(extracted, state.get("candidate_papers", []))
        
        trace_event = create_trace_event(
            agent="comparison",
            action="comparison_completed",
            detail="Generated comparison table."
        )

        return {
            "comparison": table.model_dump() if hasattr(table, "model_dump") else table,
            "phase": "research_gap",
            "trace": [trace_event.model_dump()]
        }
        
    except Exception as e:
        logger.error(f"Error in comparison_node: {e}")
        raise e
