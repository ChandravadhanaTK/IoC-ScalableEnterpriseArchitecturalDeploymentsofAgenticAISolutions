import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Any

from graph.state import ResearchState
from models.schemas import CitationCheck
from tools.citation_checker import verify_citation
from utils.logging import get_logger
from utils.trace import create_trace_event

logger = get_logger(__name__)


def citation_verification_node(state: ResearchState) -> dict[str, Any]:
    """Verify the citation of every approved paper against Crossref."""
    approved = set(state.get("approved_paper_ids", []))
    papers = [p for p in state.get("candidate_papers", []) if p.get("paper_id") in approved]

    checks: list[dict[str, Any]] = []
    for p in papers:
        if p.get("source_api") == "user_upload":
            checks.append(CitationCheck(
                paper_id=p["paper_id"], status="UNVERIFIED",
                notes="User-uploaded PDF: no external record to verify against",
            ).model_dump())
            continue
        try:
            check = verify_citation(
                p.get("title", ""), p.get("authors", []), p.get("year"),
                p.get("doi"), paper_id=p["paper_id"],
            )
        except Exception as e:  # noqa: BLE001
            logger.error("Citation check crashed for %s: %s", p.get("paper_id"), e)
            check = CitationCheck(paper_id=p["paper_id"], status="UNVERIFIED", notes=f"Check failed: {e}")
        checks.append(check.model_dump())

    verified = sum(1 for c in checks if c["status"] == "VERIFIED")
    trace = create_trace_event(
        agent="citation", action="citations_verified",
        detail=f"{verified}/{len(checks)} citations VERIFIED.",
    )
    return {"citation_checks": checks, "phase": "survey", "trace": [trace.model_dump()]}
