"""Retrieval tests. Chunking and access filtering are deterministic; the dense
index needs the Ollama embedding model so those tests carry the llm marker."""
from __future__ import annotations

from opscopilot.identity import Identity
from opscopilot.knowledge.ingest import chunk_document

from .conftest import ROOT, llm


def test_chunking_keeps_sections_and_access_label():
    chunks = chunk_document(ROOT / "data" / "docs" / "credit-policy-confidential.md")
    assert all(c.access == "confidential" for c in chunks)
    assert chunks[0].citation == "FIN-POL-021 §1"
    assert "Authorisation limits" in chunks[1].section


@llm
def test_confidential_docs_never_reach_a_team_lead():
    from opscopilot.knowledge.retrieval import retrieve
    q = "maximum single credit a finance controller may approve"
    lead = retrieve(q, Identity.for_role("u", "team_lead"), k=6)
    mgr = retrieve(q, Identity.for_role("u", "ops_manager"), k=6)
    assert not any(c.doc_id == "FIN-POL-021" for c in lead)
    assert any(c.doc_id == "FIN-POL-021" for c in mgr)


@llm
def test_lexical_index_finds_reason_codes():
    from opscopilot.knowledge.retrieval import retrieve
    hits = retrieve("what does reason code RR-03 mean", Identity.for_role("u", "team_lead"))
    assert any(c.citation == "SOP-OPS-014 §4" for c in hits)
