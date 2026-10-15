import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from rapidfuzz import fuzz
from models.schemas import PaperMeta
from tools.paper_search import search_papers, SearchUnavailableError
from utils.llm import LLMConfigError
from rag.embeddings import get_embedding_function
from utils.trace import create_trace_event
from utils.logging import get_logger
from graph.state import ResearchState
from typing import Any
import numpy as np

logger = get_logger(__name__)


class NoPapersFoundError(Exception):
    """Search worked but returned nothing - retrying will not help."""


def _keyword_score(query: str, text: str) -> float:
    """Cheap relevance fallback: fraction of query words found in the text."""
    words = {w for w in query.lower().split() if len(w) > 3}
    if not words:
        return 0.0
    hay = text.lower()
    return sum(1 for w in words if w in hay) / len(words)

def search_node(state: ResearchState) -> dict[str, Any]:
    """
    Searches for papers based on the plan, deduplicates, scores relevance,
    and returns top candidate papers.
    
    Args:
        state (ResearchState): The current research state containing the plan.
        
    Returns:
        dict[str, Any]: State updates with candidate papers, phase, and trace events.
    """
    plan = state.get("plan", {})
    queries: list[str] = [q for q in plan.get("search_queries", []) if q and q.strip()]
    if not queries:
        queries = [state.get("research_question", "")]
    year_from: int = int(state.get("year_from") or 2000)
    year_to: int = int(state.get("year_to") or 2100)
    num_papers: int = int(state.get("num_papers") or 10)
    
    all_papers: list[PaperMeta] = []
    
    try:
        # 1. Search using queries
        failures = 0
        for query in queries:
            try:
                all_papers.extend(search_papers(query, year_from, year_to, num_papers * 2))
            except SearchUnavailableError as e:
                failures += 1
                logger.warning("Search failed for '%s': %s", query, e)
        if failures == len(queries):
            raise SearchUnavailableError(
                "All paper search APIs (OpenAlex, Semantic Scholar, Crossref) failed. "
                "Check your internet connection and try again.")
            
        # 2. Deduplicate
        unique_papers: list[PaperMeta] = []
        seen_dois: set[str] = set()
        
        for p in all_papers:
            if p.doi:
                norm_doi = p.doi.lower().strip()
                if norm_doi in seen_dois:
                    continue
                seen_dois.add(norm_doi)
                
            # Fuzzy match title
            title = (p.title or "").lower().strip()
            if not title:
                continue
            is_duplicate = False
            for up in unique_papers:
                up_title = (up.title or "").lower().strip()
                if fuzz.ratio(title, up_title) >= 92:
                    is_duplicate = True
                    break
                    
            if not is_duplicate:
                unique_papers.append(p)
                
        # 3. Compute relevance (embeddings; keyword overlap if embeddings are unavailable)
        research_intent = " ".join(queries)
        if unique_papers:
            try:
                embedder = get_embedding_function()
                query_emb = np.array(embedder.embed_query(research_intent), dtype=np.float32)
                contents = [f"{p.title or ''} {p.abstract or ''}"[:4000] for p in unique_papers]
                doc_embs = [np.array(e, dtype=np.float32) for e in embedder.embed_documents(contents)]
                scores = []
                for d in doc_embs:
                    nq, nd = np.linalg.norm(query_emb), np.linalg.norm(d)
                    scores.append(float(np.dot(query_emb, d) / (nq * nd)) if nq > 0 and nd > 0 else 0.0)
            except LLMConfigError:
                raise
            except Exception as e:  # noqa: BLE001
                logger.warning("Embedding relevance failed (%s); using keyword overlap.", e)
                scores = [_keyword_score(research_intent, f"{p.title or ''} {p.abstract or ''}") for p in unique_papers]
            for paper, score in zip(unique_papers, scores):
                paper.relevance_score = score
                paper.relevance_label = "High" if score >= 0.7 else "Medium" if score >= 0.4 else "Low"

        # Sort and take top
        unique_papers.sort(key=lambda x: (x.relevance_score or 0.0), reverse=True)
        top_papers = unique_papers[:num_papers]
        
        # User-uploaded PDFs always become candidates (key = file name, value = saved path)
        uploads = list((state.get("uploaded_pdfs") or {}).items())
        upload_papers = [
            PaperMeta(paper_id="", title=Path(name).stem.replace("_", " "), source_api="user_upload",
                      relevance_score=1.0, relevance_label="High")
            for name, _ in uploads
        ]
        top_papers = top_papers + upload_papers

        if not top_papers:
            raise NoPapersFoundError(
                "No papers were found for this question and year range. "
                "Try broader keywords or a wider year range.")

        # Assign paper IDs (P01, P02, ...) and re-key uploads by paper_id
        for i, paper in enumerate(top_papers):
            paper.paper_id = f"P{i+1:02d}"
        uploaded_by_id = {paper.paper_id: path for paper, (_, path) in zip(upload_papers, uploads)}

        trace_event = create_trace_event(
            agent="search",
            action="search_completed",
            detail=f"Found and scored {len(top_papers)} papers."
        )

        return {
            "candidate_papers": [p.model_dump() for p in top_papers],
            "uploaded_pdfs": uploaded_by_id,
            "phase": "human_approval_1",
            "trace": [trace_event.model_dump()]
        }
        
    except Exception as e:
        logger.error(f"Error in search_node: {e}")
        raise e 