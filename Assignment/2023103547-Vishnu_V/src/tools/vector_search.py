from typing import Any

from rag.vector_store import search_by_paper
from utils.logging import get_logger

logger = get_logger(__name__)


def search_document(paper_id: str, query: str, k: int = 5) -> list[dict[str, Any]]:
    """Search within a specific document in the ChromaDB collection.

    Returns:
        List of dicts with keys 'text', 'page' and 'chunk_id' (empty on failure).
    """
    try:
        return [
            {"text": r["text"], "page": r.get("page"), "chunk_id": r.get("chunk_id", "unknown")}
            for r in search_by_paper(paper_id, query, k)
        ]
    except Exception as e:  # noqa: BLE001
        logger.error("Vector search failed for document %s: %s", paper_id, e)
        return []
