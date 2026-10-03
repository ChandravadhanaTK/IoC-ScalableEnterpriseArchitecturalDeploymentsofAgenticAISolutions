"""LangGraph state definition for the ResearchPilot workflow.

ResearchState is a TypedDict used as the graph state.
The 'trace' field uses operator.add as a reducer for append-only semantics.
"""

from __future__ import annotations

import operator
from typing import Annotated, Any, Literal

from langgraph.graph import MessagesState
from typing_extensions import TypedDict


class ResearchState(TypedDict, total=False):
    """Full state for the ResearchPilot LangGraph workflow.

    Fields:
        research_question: The user's research question.
        year_from: Start year filter for paper search.
        year_to: End year filter for paper search.
        num_papers: Maximum number of papers to find.
        citation_style: Reference style (IEEE, APA, ACM).
        plan: Supervisor's research plan dict.
        candidate_papers: List of PaperMeta dicts from search.
        approved_paper_ids: List of paper_id strings approved by user.
        uploaded_pdfs: Dict mapping paper_id to PDF file path.
        extracted: List of ExtractedPaper dicts.
        analyses: List of PaperAnalysis dicts.
        comparison: ComparisonTable dict.
        gaps: List of ResearchGap dicts.
        citation_checks: List of CitationCheck dicts.
        survey_draft: The generated survey text.
        survey_feedback: User feedback on the survey.
        survey_revision_count: Number of survey revisions done.
        survey_approved: Whether the survey was approved.
        final_report: The final assembled report text.
        errors: List of error message strings.
        retries: Current retry count for the active node.
        phase: Current workflow phase name.
        trace: Append-only list of TraceEvent dicts (uses operator.add reducer).
        thread_id: Unique thread identifier for this session.
        clarification_question: Question to ask user for clarification.
        clarification_answer: User's answer to the clarification question.
    """

    research_question: str
    year_from: int
    year_to: int
    num_papers: int
    citation_style: Literal["IEEE", "APA", "ACM"]
    plan: dict[str, Any]
    candidate_papers: list[dict[str, Any]]
    approved_paper_ids: list[str]
    uploaded_pdfs: dict[str, str]
    extracted: list[dict[str, Any]]
    analyses: list[dict[str, Any]]
    comparison: dict[str, Any]
    gaps: list[dict[str, Any]]
    citation_checks: list[dict[str, Any]]
    survey_draft: str
    survey_feedback: str
    survey_revision_count: int
    survey_approved: bool
    final_report: str
    errors: list[str]
    retries: int
    phase: str
    trace: Annotated[list[dict[str, Any]], operator.add]
    thread_id: str
    clarification_question: str
    clarification_answer: str
