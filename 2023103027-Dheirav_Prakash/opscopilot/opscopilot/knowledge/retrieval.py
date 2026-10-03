"""Access-aware hybrid retrieval with reciprocal rank fusion.

Dense search finds semantically similar sections. BM25 finds exact codes and
names. Both are filtered by the caller's access labels *before* fusion, so a
document the caller cannot open never reaches the prompt, which is the
"exclude it before the context reaches the model" rule from Module 3.
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from langchain_chroma import Chroma
from rank_bm25 import BM25Okapi

from ..config import settings
from ..identity import Identity
from ..telemetry import get_logger, span
from .ingest import COLLECTION, Chunk, embeddings

logger = get_logger("retrieval")


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9][a-z0-9\-]*", text.lower())


@lru_cache(maxsize=1)
def _lexical() -> tuple[list[Chunk], BM25Okapi]:
    raw = json.loads(Path(settings.bm25_path).read_text())
    chunks = [Chunk(**c) for c in raw]
    return chunks, BM25Okapi([_tokenize(c.text) for c in chunks])


@lru_cache(maxsize=1)
def _dense() -> Chroma:
    return Chroma(collection_name=COLLECTION, embedding_function=embeddings(), persist_directory=settings.chroma_path)


def reset_caches() -> None:
    _lexical.cache_clear()
    _dense.cache_clear()


def retrieve(query: str, identity: Identity, k: int | None = None) -> list[Chunk]:
    k = k or settings.top_k
    allowed = set(identity.access)
    chunks, bm25 = _lexical()
    by_id = {c.chunk_id: c for c in chunks}

    with span("retrieve.dense", logger):
        where = {"access": {"$in": sorted(allowed)}}
        dense_hits = _dense().similarity_search(query, k=k * 2, filter=where)
    dense_rank = [d.metadata["chunk_id"] for d in dense_hits]

    with span("retrieve.lexical", logger):
        scores = bm25.get_scores(_tokenize(query))
        order = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
        lexical_rank = [chunks[i].chunk_id for i in order if scores[i] > 0 and chunks[i].access in allowed][: k * 2]

    # Reciprocal rank fusion: a chunk that both indexes rank near the top wins.
    fused: dict[str, float] = {}
    for rank_list in (dense_rank, lexical_rank):
        for pos, cid in enumerate(rank_list):
            fused[cid] = fused.get(cid, 0.0) + 1.0 / (60 + pos)
    top = sorted(fused, key=lambda cid: fused[cid], reverse=True)[:k]
    return [by_id[cid] for cid in top if cid in by_id and by_id[cid].access in allowed]
