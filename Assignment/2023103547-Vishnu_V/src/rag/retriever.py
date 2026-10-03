"""Chunking and retrieval module for RAG pipeline."""

import re
from rag.vector_store import add_paper_chunks, search_by_paper, has_paper

def chunk_text(pages: list[dict], paper_id: str, chunk_size: int = 1000, overlap: int = 150) -> list[dict]:
    """Chunks text from pages with specified size and overlap.
    
    Args:
        pages (list[dict]): List of dictionaries with 'page' and 'text'.
        paper_id (str): The ID of the paper, required for chunk_id generation.
        chunk_size (int): Target size of each chunk in characters.
        overlap (int): Number of overlapping characters between chunks.
        
    Returns:
        list[dict]: List of chunk dictionaries.
    """
    chunks = []
    chunk_index = 0
    current_section = "unknown"
    
    # Regex to detect simple section headings (e.g., all caps, or short lines ending in colon)
    heading_pattern = re.compile(r'^(?:[A-Z][A-Z\s]+|.{1,50}:)\s*$')
    
    for page_data in pages:
        page_num = page_data.get("page", 0)
        text = page_data.get("text", "")
        
        # Simple splitting by paragraphs first
        paragraphs = text.split("\n\n")
        
        current_chunk_text = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            # Detect section
            if heading_pattern.match(para):
                current_section = para.strip().strip(":")
                
            if len(current_chunk_text) + len(para) > chunk_size and current_chunk_text:
                chunks.append({
                    "text": current_chunk_text.strip(),
                    "page": page_num,
                    "chunk_id": f"{paper_id}_chunk_{chunk_index}",
                    "section": current_section
                })
                chunk_index += 1
                
                if len(current_chunk_text) > overlap:
                    current_chunk_text = current_chunk_text[-overlap:] + "\n" + para
                else:
                    current_chunk_text = para
            else:
                if current_chunk_text:
                    current_chunk_text += "\n\n" + para
                else:
                    current_chunk_text = para
                    
        if current_chunk_text:
            chunks.append({
                "text": current_chunk_text.strip(),
                "page": page_num,
                "chunk_id": f"{paper_id}_chunk_{chunk_index}",
                "section": current_section
            })
            chunk_index += 1
            
    return chunks

def index_paper(paper_id: str, pages: list[dict]) -> int:
    """Chunks the pages and adds to vector store. Skips if already indexed.
    
    Args:
        paper_id (str): The ID of the paper.
        pages (list[dict]): List of dictionaries with 'page' and 'text'.
        
    Returns:
        int: Number of chunks added.
    """
    chunks = chunk_text(pages, paper_id=paper_id)
    add_paper_chunks(paper_id, chunks)   # replaces any stale chunks for this id
    return len(chunks)

def index_abstract(paper_id: str, abstract: str) -> int:
    """Indexes just an abstract as a single chunk.
    
    Args:
        paper_id (str): The ID of the paper.
        abstract (str): The text of the abstract.
        
    Returns:
        int: Returns 1 (number of chunks added).
    """
    if not (abstract or "").strip():
        return 0

    chunk = {
        "text": abstract,
        "page": 1,
        "chunk_id": f"{paper_id}_abstract",
        "section": "Abstract",
        "source": "abstract_only"
    }
    
    add_paper_chunks(paper_id, [chunk])
    return 1

def retrieve_evidence(paper_id: str, query: str, k: int = 5) -> list[dict]:
    """Retrieves top-k chunks for a query about a specific paper.
    
    Args:
        paper_id (str): The ID of the paper.
        query (str): The search query.
        k (int): Number of top results.
        
    Returns:
        list[dict]: List of results.
    """
    return search_by_paper(paper_id, query, k)
