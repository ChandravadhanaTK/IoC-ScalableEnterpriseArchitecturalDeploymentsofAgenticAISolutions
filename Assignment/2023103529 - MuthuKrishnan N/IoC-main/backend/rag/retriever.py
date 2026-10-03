import logging
from typing import List, Dict, Any
from backend.config import settings
from backend.rag.ingestion import IN_MEMORY_POLICY_CHUNKS, ingest_all_policies

logger = logging.getLogger("enterprise_ai.rag")

class PolicyRetriever:
    def __init__(self):
        self._ensure_initialized()

    def _ensure_initialized(self):
        if not IN_MEMORY_POLICY_CHUNKS:
            ingest_all_policies()

    def retrieve_relevant_policies(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """Retrieves top-k relevant policy chunks using ChromaDB or fallback similarity."""
        self._ensure_initialized()

        # Try ChromaDB first
        try:
            import chromadb
            client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            collection = client.get_collection(name="company_policies")
            results = collection.query(query_texts=[query], n_results=top_k)

            chunks = []
            citations = set()
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0] if "distances" in results and results["distances"] else [0.2] * len(docs)

            for doc, meta, dist in zip(docs, metas, distances):
                doc_name = meta.get("document_name", "policy.md")
                citations.add(doc_name)
                # Convert distance to similarity score
                similarity = max(0.0, min(1.0, 1.0 - (dist if dist is not None else 0.2)))
                chunks.append({
                    "document_name": doc_name,
                    "section": meta.get("section", "Policy Clause"),
                    "text": doc,
                    "relevance_score": round(similarity, 3)
                })

            if chunks:
                return {
                    "chunks": chunks,
                    "citations": sorted(list(citations)),
                    "retrieval_mode": "chromadb_vector"
                }
        except Exception as e:
            logger.debug(f"ChromaDB retrieval fallback triggered: {e}")

        # In-memory keyword/overlap retrieval fallback
        query_words = set(query.lower().split())
        scored_chunks = []

        for chunk in IN_MEMORY_POLICY_CHUNKS:
            text_lower = chunk["text"].lower()
            score = 0.0
            for word in query_words:
                if len(word) > 2 and word in text_lower:
                    score += 1.0
            
            # Boost matches based on section title
            section_lower = chunk["section"].lower()
            for word in query_words:
                if len(word) > 2 and word in section_lower:
                    score += 2.0

            if score > 0:
                normalized_score = min(0.98, 0.65 + (score * 0.05))
                scored_chunks.append({
                    "document_name": chunk["document_name"],
                    "section": chunk["section"],
                    "text": chunk["text"],
                    "relevance_score": round(normalized_score, 2)
                })

        scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_chunks = scored_chunks[:top_k]

        citations = sorted(list(set(c["document_name"] for c in top_chunks)))
        if not citations and IN_MEMORY_POLICY_CHUNKS:
            # Default fallback to first chunk if query was very generic
            default_chunk = IN_MEMORY_POLICY_CHUNKS[0]
            top_chunks = [{
                "document_name": default_chunk["document_name"],
                "section": default_chunk["section"],
                "text": default_chunk["text"],
                "relevance_score": 0.75
            }]
            citations = [default_chunk["document_name"]]

        return {
            "chunks": top_chunks,
            "citations": citations,
            "retrieval_mode": "semantic_lexical_fallback"
        }

policy_retriever = PolicyRetriever()
