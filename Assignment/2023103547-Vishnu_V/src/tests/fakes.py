"""Offline fakes so the whole pipeline can be tested without Gemini or internet.

install_fakes() replaces:
  * ChatGoogleGenerativeAI   -> deterministic FakeChat (structured + plain output)
  * embeddings               -> hashed bag-of-words vectors
  * httpx.Client             -> in-memory OpenAlex / Crossref / PDF server
  * model listing            -> pretend the key is valid
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import sys
from pathlib import Path
from types import SimpleNamespace

SRC = Path(__file__).resolve().parent.parent
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

import httpx  # noqa: E402

# ── fake corpus ─────────────────────────────────────────────────────

PAPERS = [
    ("W1", "Rice Leaf Disease Detection Using Deep Convolutional Networks", ["Asha Kumar", "Ravi Menon"], 2022,
     "10.1000/rice.1", "We propose a CNN that detects rice leaf diseases from images with 97 percent accuracy on the PlantVillage dataset."),
    ("W2", "Vision Transformers for Crop Disease Classification", ["Li Wei", "John Smith", "Maria Garcia"], 2023,
     "10.1000/vit.2", "Vision transformers are fine-tuned for crop disease classification and compared with ResNet baselines on field images."),
    ("W3", "Lightweight Mobile Models for Paddy Disease Recognition", ["Priya Natarajan"], 2021,
     "10.1000/mob.3", "A lightweight MobileNet variant recognises paddy diseases on smartphones with low latency and limited training data."),
]


def _inverted(text: str) -> dict:
    inv: dict[str, list[int]] = {}
    for i, w in enumerate(text.split()):
        inv.setdefault(w, []).append(i)
    return inv


def _make_pdf() -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    lines = [
        "ABSTRACT",
        "We propose a convolutional neural network for detecting rice leaf diseases from field images.",
        "INTRODUCTION",
        "Rice is a staple crop and diseases such as blast and brown spot reduce yield every year.",
        "Early automatic detection can help farmers apply treatment on time and reduce losses.",
        "DATASET",
        "We use the PlantVillage dataset containing 5000 labelled rice leaf images in four classes.",
        "METHODOLOGY",
        "The proposed network stacks five convolution blocks followed by global pooling and a softmax layer.",
        "We implement the model in PyTorch and train with the Adam optimiser for fifty epochs.",
        "RESULTS",
        "The model reaches 97.2 percent accuracy and outperforms the ResNet50 baseline by three points.",
        "LIMITATIONS",
        "The dataset was captured under controlled lighting so field performance may be lower.",
    ]
    y = 800
    for ln in lines:
        c.drawString(50, y, ln)
        y -= 22
    c.showPage()
    c.save()
    return buf.getvalue()


PDF_BYTES = None


def _pdf() -> bytes:
    global PDF_BYTES
    if PDF_BYTES is None:
        PDF_BYTES = _make_pdf()
    return PDF_BYTES


# ── fake HTTP ───────────────────────────────────────────────────────


def _handler(request: httpx.Request) -> httpx.Response:
    url = str(request.url)
    if "api.openalex.org/works" in url:
        results = []
        for oid, title, authors, year, doi, abstract in PAPERS:
            results.append({
                "id": f"https://openalex.org/{oid}", "title": title, "publication_year": year,
                "authorships": [{"author": {"display_name": a}} for a in authors],
                "primary_location": {"source": {"display_name": "Journal of Fake Agriculture"},
                                     "pdf_url": "https://files.test/rice.pdf" if oid == "W1" else None},
                "best_oa_location": None, "doi": f"https://doi.org/{doi}",
                "abstract_inverted_index": _inverted(abstract), "cited_by_count": 10,
            })
        # duplicate of W1 with different case -> exercises de-duplication
        dup = dict(results[0]); dup["id"] = "https://openalex.org/W1dup"
        dup["title"] = PAPERS[0][1].lower()
        results.append(dup)
        return httpx.Response(200, json={"results": results})
    if url.startswith("https://files.test/rice.pdf"):
        return httpx.Response(200, content=_pdf(), headers={"content-type": "application/pdf"})
    if "api.crossref.org/works/" in url:
        doi = url.split("/works/")[1].split("?")[0]
        for oid, title, authors, year, d, _ in PAPERS:
            if d == doi:
                if oid == "W3":      # make W3 a mismatch -> PARTIAL/UNVERIFIED
                    title = "Completely different title about something else"
                return httpx.Response(200, json={"message": _crossref_item(title, authors, year)})
        return httpx.Response(404, json={})
    if "api.crossref.org/works" in url:
        return httpx.Response(200, json={"message": {"items": []}})
    return httpx.Response(404, json={})


def _crossref_item(title, authors, year):
    return {
        "title": [title],
        "author": [{"given": a.split()[0], "family": a.split()[-1]} for a in authors],
        "published-print": {"date-parts": [[year]]},
    }


_RealClient = httpx.Client


class _FakeClient(_RealClient):
    def __init__(self, *args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(_handler)
        super().__init__(*args, **kwargs)


# ── fake LLM ────────────────────────────────────────────────────────


class _Msg(SimpleNamespace):
    pass


class FakeStructured:
    def __init__(self, schema):
        self.schema = schema

    def invoke(self, prompt: str):
        name = self.schema.__name__
        if name == "SupervisorPlan":
            if "vague" in prompt.lower() and "[Additional context" not in prompt:
                return self.schema(keywords=[], search_queries=[], needs_clarification=True,
                                   clarification_question="Which crop and which task do you mean?",
                                   plan_summary="Needs clarification")
            return self.schema(keywords=["rice", "disease", "deep learning"],
                               search_queries=["rice leaf disease detection deep learning",
                                               "crop disease classification vision"],
                               needs_clarification=False, plan_summary="Search, compare, find gaps.")
        if name == "_PaperAnswers":
            chunks = re.findall(r"\[chunk_id=(.*?) page=.*?\]\n(.*?)(?=\n\n\[chunk_id=|\Z)", prompt, flags=re.S)
            cid, text = chunks[0] if chunks else ("", "")
            quote = " ".join(text.split()[:10])
            ans = self.schema.model_fields
            from agents.extraction_agent import _Answer
            kwargs = {}
            for f in ans:
                if f == "future_work":
                    kwargs[f] = _Answer(value="Not reported in the paper")
                elif f == "limitations":      # fabricated quote -> must be downgraded to not_reported
                    kwargs[f] = _Answer(value="Limited to lab images", quote="this sentence is not in the paper", chunk_id=cid)
                else:
                    kwargs[f] = _Answer(value=f"Fake {f} summary", quote=quote, chunk_id=cid)
            return self.schema(**kwargs)
        if name == "PaperAnalysis":
            pid = re.search(r"paper (P\d+)", prompt)
            return self.schema(paper_id=pid.group(1) if pid else "P01", summary="Fake summary.",
                               main_finding="Fake finding.", strengths=["Accurate"], limitations_noted=["Small data"])
        if name == "ResearchGapList":
            ids = sorted(set(re.findall(r'"paper_id": "(P\d+)"', prompt)))[:2] or ["P01"]
            from models.schemas import ResearchGap
            return self.schema(gaps=[ResearchGap(
                gap_id="G1", statement="No study evaluates field images under varying light.",
                kind="inferred", observed_limitations=["Controlled lighting"], supporting_paper_ids=ids,
                confidence="high", rationale="Compared limitations across papers.")])
        raise AssertionError(f"FakeLLM has no handler for schema {name}")


class FakeChat:
    def __init__(self, *args, **kwargs):
        self.kwargs = kwargs

    def with_structured_output(self, schema):
        return FakeStructured(schema)

    def invoke(self, prompt: str):
        ids = re.findall(r'"paper_id": "(P\d+)"', prompt)
        a = ids[0] if ids else "P01"
        text = (f"## Introduction\nRice disease detection matters [{a}].\n\n## Theme 1: CNN methods\n"
                f"CNNs dominate [{a}] [P99].\n\n## Research Gap\nField robustness is missing [{a}].")
        if "incorporate the following feedback" in prompt:
            text += "\n\n_Revised per feedback._"
        return _Msg(content=text)


# ── fake embeddings ─────────────────────────────────────────────────


class FakeEmbeddings:
    DIM = 64

    def _vec(self, text: str) -> list[float]:
        v = [0.0] * self.DIM
        for w in re.findall(r"[a-z0-9]+", text.lower()):
            h = int(hashlib.md5(w.encode()).hexdigest(), 16)
            v[h % self.DIM] += 1.0
        return v

    def embed_query(self, text):
        return self._vec(text)

    def embed_documents(self, texts):
        return [self._vec(t) for t in texts]


# ── installer ───────────────────────────────────────────────────────

_installed = False


def install_fakes(tmp_data: Path | None = None) -> None:
    """Patch everything. Safe to call repeatedly."""
    global _installed
    import os
    os.environ.setdefault("GEMINI_API_KEY", "fake-test-key")
    if _installed:
        return
    _installed = True

    import utils.config as cfg
    cfg.get_settings.cache_clear()
    cfg.get_settings().gemini_api_key = "fake-test-key"

    import utils.llm as llm
    llm.ChatGoogleGenerativeAI = FakeChat
    llm._rate_limit = lambda: None
    models = [{"name": "models/gemini-3.8-flash", "supportedGenerationMethods": ["generateContent"]},
              {"name": "models/gemini-3.8-flash-lite", "supportedGenerationMethods": ["generateContent"]},
              {"name": "models/gemini-embedding-001", "supportedGenerationMethods": ["embedContent"]}]
    llm._list_models = lambda key: models

    import rag.embeddings as emb
    emb.get_embedding_function = lambda: FakeEmbeddings()
    import agents.search_agent as sa
    sa.get_embedding_function = lambda: FakeEmbeddings()

    httpx.Client = _FakeClient

    if tmp_data is not None:
        import rag.vector_store as vs
        vs.CHROMA_DIR = tmp_data / "chroma"
        import graph.workflow as wf
        wf.CHECKPOINT_DB = tmp_data / "checkpoints.db"
