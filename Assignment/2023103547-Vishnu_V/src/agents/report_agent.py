import sys
import os
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tools.reference_formatter import format_all_references
from utils.config import REPORTS_DIR
from utils.trace import create_trace_event, format_trace_for_report
from models.schemas import TraceEvent
from utils.logging import get_logger
from graph.state import ResearchState
from typing import Any

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

logger = get_logger(__name__)


def _comparison_md(comparison: dict) -> str:
    cols, rows = comparison.get("columns") or [], comparison.get("rows") or []
    if not cols or not rows:
        return "_No comparison available._"
    esc = lambda v: str(v).replace("|", "\\|").replace("\n", " ")  # noqa: E731
    lines = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for r in rows:
        lines.append("| " + " | ".join(esc(r.get(c, "")) for c in cols) + " |")
    return "\n".join(lines)


def _gaps_md(gaps: list) -> str:
    if not gaps:
        return "_No research gaps identified._"
    out = []
    for g in gaps:
        out.append(f"- **{g.get('gap_id', '?')}** ({g.get('kind')}, confidence: {g.get('confidence')}): "
                   f"{g.get('statement', '')} _Supporting papers: {', '.join(g.get('supporting_paper_ids', [])) or 'n/a'}_")
    return "\n".join(out)


def _trace_md(events: list) -> str:
    parsed = []
    for e in events:
        try:
            parsed.append(e if isinstance(e, TraceEvent) else TraceEvent(**e))
        except Exception:  # noqa: BLE001
            continue
    return format_trace_for_report(parsed)

def report_node(state: ResearchState) -> dict[str, Any]:
    """
    Assembles the final Markdown report and optionally exports to DOCX.
    
    Args:
        state (ResearchState): The current research state.
        
    Returns:
        dict[str, Any]: State updates with the final report, phase, and trace events.
    """
    research_question = state.get("research_question", "Research Topic")
    survey_draft = state.get("survey_draft", "")
    comparison = state.get("comparison", {})
    gaps = state.get("gaps", [])
    citation_style = state.get("citation_style", "APA")
    candidate_papers = state.get("candidate_papers", [])
    approved_paper_ids = state.get("approved_paper_ids", [])
    trace_events = state.get("trace", [])
    citation_checks = state.get("citation_checks", [])
    thread_id = state.get("thread_id", "default_thread")
    
    approved_papers = [p for p in candidate_papers if p.get("paper_id") in approved_paper_ids]
    
    try:
        verified_md, unverified_md = format_all_references(approved_papers, citation_checks, citation_style)
        references_text = verified_md + "\n\n" + unverified_md
        
        # Build Report
        report_lines = [
            f"# {research_question}",
            "",
            "## 1. Introduction",
            "This report presents a literature survey for the research question above.",
            "",
            "## 2. Research Methodology",
            f"Papers were searched in OpenAlex, Semantic Scholar and Crossref; {len(approved_papers)} papers "
            "were approved by the user, analysed with evidence-backed extraction, and every citation was "
            "checked against Crossref.",
            "",
            "## 3. Literature Survey",
            survey_draft,
            "",
            "## 4. Comparative Analysis",
            _comparison_md(comparison),
            "",
            "## 5. Research Gaps",
            _gaps_md(gaps),
            "",
            "## 6. Proposed Research Direction",
            "Based on the identified gaps, future work should address the limitations listed above.",
            "",
            "## 7. References",
            references_text,
            "",
            "## Appendix A: Research Trace",
            _trace_md(trace_events),
        ]

        unverified = [c for c in citation_checks if c.get("status") != "VERIFIED"]
        if unverified:
            report_lines.extend(["", "## Appendix B: Citations not fully verified", ""])
            for c in unverified:
                report_lines.append(f"- **{c.get('paper_id')}** - {c.get('status')}: {c.get('notes', '')}")

        report_text = "\n".join(report_lines)
        
        # Save Markdown
        reports_dir = REPORTS_DIR
        os.makedirs(reports_dir, exist_ok=True)
        
        md_path = reports_dir / f"{thread_id}.md"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(report_text)
            
        # Optional DOCX Export
        if DOCX_AVAILABLE:
            doc = Document()
            for line in report_lines:
                doc.add_paragraph(line)
            docx_path = reports_dir / f"{thread_id}.docx"
            doc.save(str(docx_path))
            
        trace_event = create_trace_event(
            agent="report",
            action="report_generated",
            detail=f"Generated final report for thread {thread_id}."
        )

        return {
            "final_report": report_text,
            "phase": "complete",
            "trace": [trace_event.model_dump()]
        }
        
    except Exception as e:
        logger.error(f"Error in report_node: {e}")
        raise e
