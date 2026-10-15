"""Pydantic v2 schemas for ResearchPilot.

All data models used across agents, tools, and the LangGraph workflow.
Enforces integrity rules: evidence on fields, explicit/inferred gaps,
source tracking, and citation verification status.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field as PydanticField


class PaperMeta(BaseModel):
    """Metadata for a single research paper.

    Every paper must have source_api and retrieved_at set from the API result.
    The LLM never invents titles, authors, years, DOIs, or URLs.
    """

    paper_id: str = PydanticField(
        description="Assigned ID like 'P01', 'P02' after deduplication"
    )
    title: str
    authors: list[str] = PydanticField(default_factory=list)
    year: int | None = None
    venue: str | None = None
    abstract: str | None = None
    doi: str | None = None
    url: str | None = None
    pdf_url: str | None = None
    citation_count: int | None = None
    source_api: Literal["openalex", "semantic_scholar", "crossref", "user_upload"]
    relevance_score: float | None = PydanticField(
        default=None,
        description="Cosine similarity of query vs title+abstract embedding",
    )
    relevance_label: Literal["High", "Medium", "Low"] | None = None
    retrieved_at: datetime = PydanticField(default_factory=lambda: datetime.now(timezone.utc))


class Evidence(BaseModel):
    """Evidence supporting an extracted field.

    quote must be <= 25 words. page is the PDF page number (0-indexed).
    chunk_id identifies the vector store chunk.
    """

    quote: str = PydanticField(
        description="Direct quote from the paper, max 25 words"
    )
    page: int | None = PydanticField(
        default=None, description="PDF page number (0-indexed)"
    )
    chunk_id: str = PydanticField(description="Vector store chunk identifier")


class FieldExtraction(BaseModel):
    """A single extracted field with its value, status, and evidence.

    If the paper does not report the field, value MUST be
    'Not reported in the paper' and status MUST be 'not_reported'.
    """

    value: str = PydanticField(
        description="Extracted value, or 'Not reported in the paper' if missing"
    )
    status: Literal["reported", "not_reported"] = "reported"
    evidence: list[Evidence] = PydanticField(default_factory=list)


class ExtractedPaper(BaseModel):
    """Structured extraction from a single paper.

    source_depth indicates whether full text or only abstract was available.
    Every field carries evidence; fields without evidence must be not_reported.
    """

    paper_id: str
    source_depth: Literal["full_text", "abstract_only"]
    problem: FieldExtraction
    objective: FieldExtraction
    dataset: FieldExtraction
    methodology: FieldExtraction
    algorithms: FieldExtraction
    tools_frameworks: FieldExtraction
    experimental_setup: FieldExtraction
    metrics: FieldExtraction
    results: FieldExtraction
    limitations: FieldExtraction
    future_work: FieldExtraction


class PaperAnalysis(BaseModel):
    """Analysis summary for a single paper."""

    paper_id: str
    summary: str
    main_finding: str
    strengths: list[str] = PydanticField(default_factory=list)
    limitations_noted: list[str] = PydanticField(default_factory=list)


class ComparisonTable(BaseModel):
    """Comparison table across multiple papers.

    Missing cells must contain 'Not reported in the paper'.
    """

    columns: list[str] = PydanticField(
        description="Column headers: Paper, Method, Dataset, Metrics, Results, Limitation"
    )
    rows: list[dict[str, str]] = PydanticField(
        description="One dict per paper; missing cells = 'Not reported in the paper'"
    )


class ResearchGap(BaseModel):
    """An identified research gap.

    kind='explicit' means a paper states it directly.
    kind='inferred' means it's derived by comparing papers.
    Confidence is capped at 'medium' when any supporting paper is abstract-only.
    """

    gap_id: str
    statement: str
    kind: Literal["explicit", "inferred"]
    observed_limitations: list[str] = PydanticField(default_factory=list)
    supporting_paper_ids: list[str] = PydanticField(default_factory=list)
    evidence: list[Evidence] = PydanticField(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "medium"
    rationale: str = ""


class CitationCheck(BaseModel):
    """Result of verifying a paper's citation against external sources.

    VERIFIED: found, title_match >= 90, author overlap >= 50%, year matches.
    PARTIAL: found but some mismatch.
    UNVERIFIED: not found or major mismatch.
    """

    paper_id: str
    status: Literal["VERIFIED", "PARTIAL", "UNVERIFIED"] = "UNVERIFIED"
    exists: bool = False
    title_match: float = PydanticField(
        default=0.0, description="Fuzzy title match score 0-100"
    )
    authors_match: float = PydanticField(
        default=0.0, description="Author surname overlap percentage 0-100"
    )
    year_match: bool = False
    doi_resolves: bool | None = None
    notes: str = ""


class TraceEvent(BaseModel):
    """A single event in the research trace log.

    Every agent node appends TraceEvents to the graph state.
    Events are also mirrored to data/traces/<thread_id>.jsonl.
    """

    ts: datetime = PydanticField(default_factory=lambda: datetime.now(timezone.utc))
    agent: str
    action: str
    status: Literal["ok", "warning", "error", "waiting"] = "ok"
    detail: str = ""


class SupervisorPlan(BaseModel):
    """Plan output from the Research Supervisor.

    Used for structured LLM output to extract keywords and plan.
    """

    keywords: list[str] = PydanticField(
        description="Search keywords extracted from the research question"
    )
    search_queries: list[str] = PydanticField(
        description="Queries to send to paper search APIs"
    )
    needs_clarification: bool = PydanticField(
        default=False,
        description="Whether the question is too vague and needs clarification",
    )
    clarification_question: str | None = PydanticField(
        default=None,
        description="Question to ask the user if clarification is needed",
    )
    plan_summary: str = PydanticField(
        description="Short summary of the research plan"
    )


class SurveyTheme(BaseModel):
    """A single theme in the literature survey."""

    title: str
    content: str
    paper_ids_cited: list[str] = PydanticField(default_factory=list)


class LiteratureSurvey(BaseModel):
    """Structured output from the Literature Survey Agent.

    The survey is thematic (not paper-by-paper).
    All citations use markers like [P03] from the approved set.
    """

    introduction: str
    themes: list[SurveyTheme] = PydanticField(default_factory=list)
    comparison_section: str = ""
    research_gaps_section: str = ""
    proposed_direction: str = ""
    all_cited_ids: list[str] = PydanticField(
        default_factory=list,
        description="All paper_ids cited in the survey (for citation guard)",
    )
