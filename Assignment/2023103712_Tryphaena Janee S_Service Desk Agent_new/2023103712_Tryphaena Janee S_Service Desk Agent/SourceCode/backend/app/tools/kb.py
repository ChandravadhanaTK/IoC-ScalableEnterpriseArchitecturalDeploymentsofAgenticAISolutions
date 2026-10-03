"""Knowledge-base retrieval (BM25 over a small curated corpus).

In production this would be a vector + keyword hybrid index over Confluence /
ServiceNow KB. The interface (`search(query, k) -> hits with score`) is what the
Knowledge Agent depends on, so swapping the backend does not touch the workflow.
"""
from __future__ import annotations

import json
import math
import re
from collections import Counter
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent / "data" / "kb_articles.json"
_STOP = {"the", "a", "an", "is", "my", "i", "to", "and", "of", "it", "in", "on", "for", "me", "can",
         "not", "how", "do", "with", "this", "that", "be", "are", "was", "at", "or", "you", "your"}


def _tok(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z0-9\-]+", text.lower()) if w not in _STOP and len(w) > 1]


class KnowledgeBase:
    def __init__(self, path: Path = _DATA):
        self.articles: list[dict] = json.loads(path.read_text())
        self.docs: list[list[str]] = []
        for a in self.articles:
            # Title and keywords weighted x3 relative to body text.
            body = " ".join(a["steps"])
            self.docs.append(_tok(a["title"]) * 3 + _tok(" ".join(a["keywords"])) * 3 + _tok(body))
        self.N = len(self.docs)
        self.avgdl = sum(len(d) for d in self.docs) / max(1, self.N)
        df: Counter = Counter()
        for d in self.docs:
            df.update(set(d))
        self.idf = {t: math.log(1 + (self.N - n + 0.5) / (n + 0.5)) for t, n in df.items()}

    def search(self, query: str, k: int = 3, category: str | None = None) -> list[dict]:
        q = _tok(query)
        k1, b = 1.5, 0.75
        scored = []
        for art, doc in zip(self.articles, self.docs, strict=True):
            tf = Counter(doc)
            s = 0.0
            for t in q:
                if t in tf:
                    f = tf[t]
                    s += self.idf.get(t, 0) * f * (k1 + 1) / (f + k1 * (1 - b + b * len(doc) / self.avgdl))
            if category and art["category"] == category:
                s *= 1.25
            if s > 0:
                scored.append((s, art))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:k]
        if not top:
            return []
        best = top[0][0]
        return [{"id": a["id"], "title": a["title"], "category": a["category"], "steps": a["steps"],
                 "score": round(s, 3), "relevance": round(s / best, 3) if best else 0.0}
                for s, a in top]


KB = KnowledgeBase()
