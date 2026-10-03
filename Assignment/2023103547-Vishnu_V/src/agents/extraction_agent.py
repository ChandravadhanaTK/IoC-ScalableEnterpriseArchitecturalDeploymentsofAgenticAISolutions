import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import os
import re
import tempfile
from typing import Any

import httpx
from pydantic import BaseModel, Field
from rapidfuzz import fuzz

from graph.state import ResearchState
from models.schemas import Evidence, ExtractedPaper, FieldExtraction
from rag.retriever import chunk_text, index_abstract, index_paper, retrieve_evidence
from tools.pdf_reader import PDFExtractionError, extract_pdf
from utils.llm import LLMConfigError, call_llm_structured
from utils.logging import get_logger
from utils.trace import create_trace_event

logger = get_logger(__name__)

NOT_REPORTED = "Not reported in the paper"

# field -> retrieval query
FIELD_QUERIES = {
    "problem": "problem statement and motivation",
    "objective": "objectives, aim and contributions of the paper",
    "dataset": "dataset used, data collection, number of samples",
    "methodology": "proposed method, architecture and approach",
    "algorithms": "algorithms and models used",
    "tools_frameworks": "software, tools, libraries and frameworks used",
    "experimental_setup": "experimental setup, hyperparameters, training details",
    "metrics": "evaluation metrics",
    "results": "experimental results, accuracy and comparison with baselines",
    "limitations": "limitations and weaknesses",
    "future_work": "future work and conclusion",
}


class _Answer(BaseModel):
    value: str = Field(default="", description=f"Short extracted value, or '{NOT_REPORTED}'")
    quote: str = Field(default="", description="Verbatim quote from the context, max 25 words, or empty")
    chunk_id: str = Field(default="", description="chunk_id of the context chunk containing the quote")


class _PaperAnswers(BaseModel):
    problem: _Answer
    objective: _Answer
    dataset: _Answer
    methodology: _Answer
    algorithms: _Answer
    tools_frameworks: _Answer
    experimental_setup: _Answer
    metrics: _Answer
    results: _Answer
    limitations: _Answer
    future_work: _Answer


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def _download_pdf(url: str) -> str | None:
    """Download a PDF to a temp file; return its path or None."""
    try:
        with httpx.Client(timeout=30.0, follow_redirects=True,
                          headers={"User-Agent": "ResearchPilot/1.0"}) as client:
            r = client.get(url)
            if r.status_code != 200 or not r.content.startswith(b"%PDF"):
                return None
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.write(r.content)
        tmp.close()
        return tmp.name
    except Exception as e:  # noqa: BLE001
        logger.warning("PDF download failed (%s): %s", url, e)
        return None


def _gather_context(paper_id: str, pages: list[dict] | None, abstract: str) -> list[dict]:
    """Retrieve evidence chunks for all fields (vector store, with in-memory fallback)."""
    seen: dict[str, dict] = {}
    try:
        for query in FIELD_QUERIES.values():
            for ch in retrieve_evidence(paper_id, query, k=2):
                seen.setdefault(ch["chunk_id"], ch)
    except LLMConfigError:
        raise
    except Exception as e:  # noqa: BLE001
        logger.warning("Vector retrieval failed for %s (%s); using plain chunks.", paper_id, e)
    if not seen:
        raw = chunk_text(pages, paper_id) if pages else [
            {"text": abstract, "page": 1, "chunk_id": f"{paper_id}_abstract"}]
        for ch in raw[:12]:
            seen[ch["chunk_id"]] = ch
    return list(seen.values())[:14]


def _build_field(ans: _Answer, chunks: list[dict]) -> FieldExtraction:
    """Apply the integrity rule: no verifiable evidence -> 'not_reported'."""
    value = (ans.value or "").strip()
    quote = " ".join((ans.quote or "").split()[:25])
    if not value or value.lower().startswith("not reported") or not quote:
        return FieldExtraction(value=NOT_REPORTED, status="not_reported", evidence=[])

    nq = _norm(quote)
    target = next((c for c in chunks if c["chunk_id"] == ans.chunk_id), None)
    if not target or nq not in _norm(target["text"]):
        target = next((c for c in chunks if nq in _norm(c["text"])), None)
    if not target:  # fuzzy fallback for tiny whitespace/hyphenation differences
        best = max(chunks, key=lambda c: fuzz.partial_ratio(nq, _norm(c["text"])), default=None)
        if best and fuzz.partial_ratio(nq, _norm(best["text"])) >= 88:
            target = best
    if not target:
        return FieldExtraction(value=NOT_REPORTED, status="not_reported", evidence=[])

    page = target.get("page")
    try:
        page = max(int(page) - 1, 0) if page is not None else None  # schema: 0-indexed
    except (TypeError, ValueError):
        page = None
    return FieldExtraction(
        value=value, status="reported",
        evidence=[Evidence(quote=quote, page=page, chunk_id=target["chunk_id"])],
    )


def extraction_node(state: ResearchState) -> dict[str, Any]:
    """Extract structured, evidence-backed information from every approved paper."""
    approved = set(state.get("approved_paper_ids", []))
    uploaded = state.get("uploaded_pdfs", {}) or {}
    papers = [p for p in state.get("candidate_papers", []) if p.get("paper_id") in approved]

    extractions: list[ExtractedPaper] = []
    traces: list[dict[str, Any]] = []

    for paper in papers:
        pid = paper["paper_id"]
        title = paper.get("title", "")
        abstract = paper.get("abstract") or ""
        pdf_path = uploaded.get(pid)
        tmp_path = None
        try:
            if not (pdf_path and os.path.exists(pdf_path)) and paper.get("pdf_url"):
                tmp_path = pdf_path = _download_pdf(paper["pdf_url"])

            pages = None
            if pdf_path and os.path.exists(pdf_path):
                try:
                    pages = extract_pdf(pdf_path)
                except PDFExtractionError as e:
                    logger.warning("PDF unusable for %s: %s", pid, e)

            if pages:
                source_depth = "full_text"
                try:
                    index_paper(pid, pages)
                except LLMConfigError:
                    raise
                except Exception as e:  # noqa: BLE001
                    logger.warning("Indexing failed for %s: %s", pid, e)
            elif abstract.strip():
                source_depth = "abstract_only"
                try:
                    index_abstract(pid, abstract)
                except LLMConfigError:
                    raise
                except Exception as e:  # noqa: BLE001
                    logger.warning("Abstract indexing failed for %s: %s", pid, e)
            else:
                traces.append(create_trace_event(
                    "extraction", "paper_skipped", "warning",
                    f"{pid}: no PDF and no abstract available").model_dump())
                continue

            chunks = _gather_context(pid, pages, abstract)
            context = "\n\n".join(f"[chunk_id={c['chunk_id']} page={c.get('page')}]\n{c['text']}" for c in chunks)
            prompt = f"""You extract structured facts from the paper {pid}: "{title}".
Use ONLY the context below. For every field give:
- value: a concise factual summary,
- quote: a verbatim quote (max 25 words) copied from the context that supports the value,
- chunk_id: the chunk_id that contains the quote.
If the context does not report a field, use value "{NOT_REPORTED}" and leave quote and chunk_id empty.
Never guess or invent information.

CONTEXT:
{context}
"""
            answers = call_llm_structured(prompt, _PaperAnswers, temperature=0.1)
            fields = {name: _build_field(getattr(answers, name), chunks) for name in FIELD_QUERIES}
            extractions.append(ExtractedPaper(paper_id=pid, source_depth=source_depth, **fields))
            traces.append(create_trace_event(
                "extraction", "paper_extracted", "ok", f"{pid} extracted ({source_depth}).").model_dump())

        except LLMConfigError:
            raise
        except Exception as e:  # noqa: BLE001
            logger.error("Error extracting %s: %s", pid, e)
            traces.append(create_trace_event("extraction", "paper_failed", "error", f"{pid}: {e}").model_dump())
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    if not extractions:
        raise RuntimeError(
            "Extraction produced no results - none of the approved papers had a readable PDF or abstract, "
            "or every LLM call failed. Check the Research Trace for details."
        )

    return {
        "extracted": [ep.model_dump() for ep in extractions],
        "phase": "analysis",
        "trace": traces,
    }
