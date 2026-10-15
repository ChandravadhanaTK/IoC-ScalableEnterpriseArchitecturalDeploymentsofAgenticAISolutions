"""End-to-end and unit tests (fully offline - see fakes.py)."""

import uuid

import pytest
from langgraph.types import Command

import utils.llm as llm
from graph.workflow import create_initial_state, get_compiled_graph
from models.schemas import CitationCheck, ExtractedPaper, PaperMeta
from tools.citation_checker import evaluate_match
from tools.paper_comparison import NOT_REPORTED, compare_papers
from tools.paper_search import normalize_doi, search_papers
from tools.reference_formatter import format_all_references


def _run(question="Detect rice leaf disease with deep learning", **kw):
    graph = get_compiled_graph()
    tid = str(uuid.uuid4())
    cfg = {"configurable": {"thread_id": tid}}
    graph.invoke(create_initial_state(question, tid, 2020, 2026, 5, "IEEE"), cfg)
    return graph, cfg


def test_full_pipeline_with_both_checkpoints():
    graph, cfg = _run()
    st = graph.get_state(cfg)
    assert st.next == ("human_approval_1",)
    cands = st.values["candidate_papers"]
    assert [c["paper_id"] for c in cands] == ["P01", "P02", "P03"]      # duplicate removed
    assert all(c["relevance_label"] in ("High", "Medium", "Low") for c in cands)

    rice = next(c["paper_id"] for c in cands if c["title"].startswith("Rice Leaf"))   # has the PDF
    other = next(c["paper_id"] for c in cands if c["paper_id"] != rice and not c["title"].startswith("Lightweight"))
    graph.invoke(Command(resume={"approved_paper_ids": [rice, other], "uploaded_pdfs": {}}), cfg)
    st = graph.get_state(cfg)
    assert st.next == ("human_approval_2",), st.values.get("errors")
    v = st.values
    depth = {e["paper_id"]: e["source_depth"] for e in v["extracted"]}
    assert depth == {rice: "full_text", other: "abstract_only"}
    p1 = ExtractedPaper(**next(e for e in v["extracted"] if e["paper_id"] == rice))
    assert p1.methodology.status == "reported" and p1.methodology.evidence[0].quote
    assert p1.limitations.status == "not_reported"          # fabricated quote rejected
    assert p1.future_work.value == NOT_REPORTED
    assert v["comparison"]["rows"][0]["Method"].startswith("Fake")
    assert len(v["comparison"]["rows"]) == 2
    assert v["gaps"][0]["confidence"] == "medium"           # capped: P02 is abstract-only
    assert {c["paper_id"] for c in v["citation_checks"]} == {rice, other}
    assert "[P99 - UNVERIFIED]" in v["survey_draft"]        # citation guard

    # revision loop
    graph.invoke(Command(resume={"approved": False, "feedback": "more detail"}), cfg)
    st = graph.get_state(cfg)
    assert st.next == ("human_approval_2",) and "Revised per feedback" in st.values["survey_draft"]
    assert st.values["survey_revision_count"] == 2

    graph.invoke(Command(resume={"approved": True, "feedback": ""}), cfg)
    v = graph.get_state(cfg).values
    assert v["phase"] == "complete"
    rep = v["final_report"]
    for h in ["## 3. Literature Survey", "## 4. Comparative Analysis", "## 7. References", "Appendix A"]:
        assert h in rep
    assert "| Paper | Method |" in rep and "[P01]" in rep


def test_clarification_flow():
    graph, cfg = _run("something vague")
    st = graph.get_state(cfg)
    assert st.next == ("needs_clarification",)
    graph.invoke(Command(resume={"answer": "rice crops, image classification"}), cfg)
    assert graph.get_state(cfg).next == ("human_approval_1",)


def test_bad_api_key_is_reported_not_retried(monkeypatch):
    class Boom:
        def __init__(self, *a, **k): pass
        def with_structured_output(self, s):
            return self
        def invoke(self, p):
            raise Exception("400 INVALID_ARGUMENT. API key not valid. API_KEY_INVALID")
    monkeypatch.setattr(llm, "ChatGoogleGenerativeAI", Boom)
    import time
    t = time.time()
    graph, cfg = _run()
    assert time.time() - t < 5                               # no 4s/8s retry sleeps
    v = graph.get_state(cfg).values
    assert v["phase"] == "error"
    assert "API key is invalid" in v["errors"][-1]


def test_resolve_model_picks_replacement(monkeypatch):
    assert llm.resolve_model("gemini-3.8-flash") == "gemini-3.8-flash"
    assert llm.resolve_model("gemini-2.0-flash") == "gemini-3.8-flash"            # retired -> newest flash
    assert llm.resolve_model("text-embedding-004", "embedding") == "gemini-embedding-001"


def test_search_fallback_and_schema():
    papers = search_papers("rice", 2020, 2026, 10)
    assert all(isinstance(p, PaperMeta) for p in papers) and papers[0].doi == "10.1000/rice.1"


def test_helpers():
    assert normalize_doi("https://doi.org/10.1/x") == "10.1/x"
    ok = evaluate_match("P01", "A Great Paper", ["Ann Lee"], 2022,
                        {"title": ["A Great Paper"], "author": [{"given": "Ann", "family": "Lee"}],
                         "published-print": {"date-parts": [[2022]]}})
    assert isinstance(ok, CitationCheck) and ok.status == "VERIFIED"
    bad = evaluate_match("P02", "A Great Paper", ["Ann Lee"], 2022,
                         {"title": ["Zebra"], "author": [{"given": "Bob", "family": "Ray"}]})
    assert bad.status == "UNVERIFIED"
    table = compare_papers([{"paper_id": "P01"}], [{"paper_id": "P01", "title": "T"}])
    assert table.rows[0]["Method"] == NOT_REPORTED
    v, u = format_all_references(
        [{"paper_id": "P01", "title": "T", "authors": ["A B"], "source_api": "crossref", "year": 2020}],
        [{"paper_id": "P01", "status": "VERIFIED"}], "APA")
    assert "[P01]" in v and u.endswith("None.")
