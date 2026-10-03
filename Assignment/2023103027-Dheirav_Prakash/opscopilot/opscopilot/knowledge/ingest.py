"""Ingest -> chunk -> index.

Documents are markdown with a YAML-ish front matter block. Each top-level
"# N. Heading" section becomes one chunk, because policy documents are written
in sections that stand alone and a citation to "SLA-POL-001 §3" is something a
human can actually check. The access label travels with every chunk so
retrieval can filter before the model sees anything.

Two indexes are built from the same chunks: a dense one in Chroma using the
Ollama embedding model, and a lexical BM25 one saved as JSON. The lexical index
is what makes shipment ids and reason codes findable.
"""
from __future__ import annotations

import json
import re
import shutil
from dataclasses import asdict, dataclass
from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings

from ..config import settings
from ..telemetry import get_logger, log

logger = get_logger("ingest")
COLLECTION = "ops_docs"


@dataclass
class Chunk:
    chunk_id: str
    doc_id: str
    title: str
    section: str
    access: str
    version: str
    text: str

    @property
    def citation(self) -> str:
        return f"{self.doc_id} §{self.section.split('.')[0]}"


def parse_front_matter(raw: str) -> tuple[dict[str, str], str]:
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    if not m:
        return {}, raw
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, m.group(2)


def chunk_document(path: Path) -> list[Chunk]:
    meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
    if meta.get("access") not in ("internal", "confidential"):
        # Fail closed: a document without a recognised label is not indexed.
        raise ValueError(f"{path.name}: access label must be internal or confidential, got {meta.get('access')!r}")
    parts = re.split(r"^# ", body, flags=re.M)
    chunks = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        heading, _, text = part.partition("\n")
        chunks.append(Chunk(
            chunk_id=f"{meta['doc_id']}#{heading.split('.')[0].strip()}",
            doc_id=meta["doc_id"],
            title=meta.get("title", path.stem),
            section=heading.strip(),
            access=meta["access"],
            version=meta.get("version", "1"),
            text=f"{meta.get('title', '')} / {heading.strip()}\n{text.strip()}",
        ))
    return chunks


def embeddings() -> OllamaEmbeddings:
    return OllamaEmbeddings(model=settings.embed_model, base_url=settings.ollama_base_url,
                            client_kwargs={"timeout": settings.llm_timeout_seconds})


def build_index(docs_dir: str | None = None) -> int:
    docs_path = Path(docs_dir or settings.docs_dir)
    chunks: list[Chunk] = []
    for path in sorted(docs_path.glob("*.md")):
        chunks.extend(chunk_document(path))

    Path(settings.bm25_path).parent.mkdir(parents=True, exist_ok=True)
    Path(settings.bm25_path).write_text(json.dumps([asdict(c) for c in chunks], indent=1))

    if Path(settings.chroma_path).exists():
        shutil.rmtree(settings.chroma_path)
    store = Chroma(collection_name=COLLECTION, embedding_function=embeddings(), persist_directory=settings.chroma_path)
    store.add_documents(
        [Document(page_content=c.text, metadata={k: v for k, v in asdict(c).items() if k != "text"}) for c in chunks],
        ids=[c.chunk_id for c in chunks],
    )
    log(logger, "index built", chunks=len(chunks), docs=len(list(docs_path.glob("*.md"))))
    return len(chunks)


if __name__ == "__main__":
    n = build_index()
    print(f"indexed {n} chunks")
