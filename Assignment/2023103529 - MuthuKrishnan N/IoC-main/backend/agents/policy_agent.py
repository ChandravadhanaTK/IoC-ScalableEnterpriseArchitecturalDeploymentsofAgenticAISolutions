import logging
from datetime import datetime
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from backend.rag.retriever import policy_retriever
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.agents.policy")

class PolicyAgentOutput(BaseModel):
    chunks: List[Dict[str, Any]] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)
    retrieval_mode: str = "chromadb_vector"
    summary: str = ""

class PolicyAgent:
    """Agent that performs RAG over policy markdown files in ChromaDB."""

    async def execute(self, complaint_id: str, category: str, intent: str, complaint_text: str) -> PolicyAgentOutput:
        start_time = datetime.utcnow()
        # Formulate targeted semantic query
        query = f"{category} {intent}: {complaint_text}"

        retrieval_result = policy_retriever.retrieve_relevant_policies(query=query, top_k=3)
        completed_time = datetime.utcnow()

        chunks = retrieval_result.get("chunks", [])
        citations = retrieval_result.get("citations", [])

        # Formulate brief human-readable summary of cited clauses
        summary_clauses = [f"{c.get('document_name')} ({c.get('section')})" for c in chunks]
        summary = f"Retrieved {len(chunks)} relevant policy clauses from: {', '.join(summary_clauses)}"

        telemetry.log_agent_execution(
            complaint_id=complaint_id,
            agent_name="PolicyAgent",
            started_at=start_time,
            completed_at=completed_time,
            status="SUCCESS",
            tool_calls=["search_policies"],
            metadata={"citations": citations, "chunks_count": len(chunks)}
        )

        return PolicyAgentOutput(
            chunks=chunks,
            citations=citations,
            retrieval_mode=retrieval_result.get("retrieval_mode", "vector"),
            summary=summary
        )

policy_agent = PolicyAgent()
