"""Persistent ChromaDB vector store module."""

from __future__ import annotations

import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection

from rag.embeddings import embed_text, embed_texts
from utils.config import CHROMA_DIR


def get_chroma_client() -> ClientAPI:
    """Get the persistent ChromaDB client (stored under src/data/chroma)."""
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def get_collection() -> Collection:
    """Get or create the research_papers collection."""
    return get_chroma_client().get_or_create_collection(
        name="research_papers",
        metadata={"hnsw:space": "cosine"},
    )


def add_paper_chunks(paper_id: str, chunks: list[dict]) -> None:
    """Add document chunks to the collection with embeddings.

    Any chunks already stored for ``paper_id`` are replaced, so a re-used id
    (P01, P02 ... are re-assigned on every search) never serves stale text.
    """
    chunks = [c for c in chunks if c.get("text", "").strip()]
    if not chunks:
        return

    collection = get_collection()
    collection.delete(where={"paper_id": paper_id})

    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)

    ids, metadatas = [], []
    for chunk in chunks:
        ids.append(chunk["chunk_id"])
        metadata = {
            "paper_id": paper_id,
            "page": int(chunk.get("page") or 0),
            "section": chunk.get("section", "unknown"),
        }
        if "source" in chunk:
            metadata["source"] = chunk["source"]
        metadatas.append(metadata)

    collection.upsert(documents=texts, embeddings=embeddings, metadatas=metadatas, ids=ids)


def search_by_paper(paper_id: str, query: str, k: int = 5) -> list[dict]:
    """Search chunks for a specific paper."""
    collection = get_collection()
    if not has_paper(paper_id):
        return []
    query_embedding = embed_text(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where={"paper_id": paper_id},
    )

    output: list[dict] = []
    if results and results.get("documents") and results["documents"][0]:
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        ids = results["ids"][0]
        distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)
        for doc, meta, doc_id, dist in zip(docs, metas, ids, distances):
            output.append({
                "text": doc,
                "page": meta.get("page"),
                "chunk_id": doc_id,
                "score": dist,
            })
    return output


def delete_paper(paper_id: str) -> None:
    """Remove all chunks for a paper."""
    get_collection().delete(where={"paper_id": paper_id})


def has_paper(paper_id: str) -> bool:
    """Check whether a paper is already indexed."""
    results = get_collection().get(where={"paper_id": paper_id}, limit=1)
    return bool(results and results.get("ids"))
