import os
import re
import glob
import logging
from typing import List, Dict, Any
from backend.config import settings

logger = logging.getLogger("enterprise_ai.rag")

# In-memory backup index of chunks
IN_MEMORY_POLICY_CHUNKS: List[Dict[str, Any]] = []

def chunk_markdown_document(filepath: str) -> List[Dict[str, Any]]:
    """Splits markdown file into sections by headers and returns chunk dicts."""
    filename = os.path.basename(filepath)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Split by markdown headers
    sections = re.split(r"\n(?=##?\s+)", content)
    chunks = []
    chunk_index = 0

    for section in sections:
        section = section.strip()
        if not section:
            continue

        # Extract title or first line
        lines = section.split("\n")
        header_match = re.match(r"^#+\s+(.*)", lines[0])
        section_name = header_match.group(1) if header_match else "General"

        chunks.append({
            "chunk_id": f"{filename}#chunk-{chunk_index}",
            "document_name": filename,
            "section": section_name,
            "text": section
        })
        chunk_index += 1

    return chunks

def ingest_all_policies() -> int:
    """Reads all markdown files from data/policies and indexes them."""
    global IN_MEMORY_POLICY_CHUNKS
    policy_files = glob.glob(os.path.join(settings.POLICIES_DIR, "*.md"))
    if not policy_files:
        logger.warning(f"No policy documents found in {settings.POLICIES_DIR}")
        return 0

    all_chunks: List[Dict[str, Any]] = []
    for fpath in policy_files:
        chunks = chunk_markdown_document(fpath)
        all_chunks.extend(chunks)

    IN_MEMORY_POLICY_CHUNKS = all_chunks

    # Try ChromaDB ingestion
    try:
        import chromadb
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        collection = client.get_or_create_collection(name="company_policies")

        # Delete existing to refresh
        existing_ids = collection.get()["ids"]
        if existing_ids:
            collection.delete(ids=existing_ids)

        ids = [c["chunk_id"] for c in all_chunks]
        documents = [c["text"] for c in all_chunks]
        metadatas = [{"document_name": c["document_name"], "section": c["section"]} for c in all_chunks]

        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Successfully ingested {len(all_chunks)} policy chunks into ChromaDB at {settings.CHROMA_PERSIST_DIR}")
    except Exception as exc:
        logger.warning(f"ChromaDB ingestion note: {exc}. Using robust in-memory vectorized policy retriever.")

    return len(all_chunks)
