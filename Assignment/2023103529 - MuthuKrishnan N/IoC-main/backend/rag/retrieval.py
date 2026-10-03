import logging
from typing import List, Dict, Any
from backend.rag.retriever import policy_retriever

logger = logging.getLogger("enterprise_ai.rag.retrieval")

def query_policies(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Query policy vector store and return matched policy clauses formatted for agents."""
    result = policy_retriever.retrieve_relevant_policies(query=query, top_k=top_k)
    chunks = result.get("chunks", [])
    
    formatted = []
    for chunk in chunks:
        formatted.append({
            "content": chunk.get("text", ""),
            "source": chunk.get("document_name", "company_policies.md"),
            "section": chunk.get("section", "Policy Clause"),
            "score": chunk.get("relevance_score", 0.85),
            "text": chunk.get("text", ""),
            "document_name": chunk.get("document_name", "company_policies.md"),
            "relevance_score": chunk.get("relevance_score", 0.85)
        })
    return formatted
