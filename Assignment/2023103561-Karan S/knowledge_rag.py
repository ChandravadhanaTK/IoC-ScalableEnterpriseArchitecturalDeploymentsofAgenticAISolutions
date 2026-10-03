"""
Knowledge RAG Agent
====================
Builds (or loads) a vector database (Chroma) from the procedure files in
data/procedures/, using local embeddings (sentence-transformers) so no
API key is needed for this part.

The vectorstore is lazily initialized once and persisted to disk, so
subsequent runs are faster since they load from cache instead of rebuilding.
"""
import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR = os.path.join(_BASE_DIR, "data", "procedures")
_PERSIST_DIR = os.path.join(_BASE_DIR, "vectorstore")

_embeddings = None  # lazy singleton - loaded on first use, not at import time
_vectorstore = None  # lazy singleton


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _embeddings


def _get_vectorstore():
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    embeddings = _get_embeddings()

    if os.path.exists(_PERSIST_DIR) and os.listdir(_PERSIST_DIR):
        # Database already exists -> load it instead of rebuilding
        _vectorstore = Chroma(
            persist_directory=_PERSIST_DIR,
            embedding_function=embeddings,
        )
        return _vectorstore

    # Build the database for the first time
    loader = DirectoryLoader(_DATA_DIR, glob="*.txt", loader_cls=TextLoader)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    _vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=_PERSIST_DIR,
    )
    return _vectorstore


def knowledge_rag(state: dict) -> dict:
    """
    Node function for LangGraph.
    Input: state containing 'incident_type' and 'report'
    Output: updated state with 'procedures' (retrieved procedures text)
    """
    trace = state.get("trace", [])

    try:
        vectorstore = _get_vectorstore()
        query = f"{state.get('incident_type', '')} {state.get('report', '')}"
        results = vectorstore.similarity_search(query, k=3)
        procedures_text = "\n\n---\n\n".join(doc.page_content for doc in results)

        if not procedures_text.strip():
            procedures_text = "No specific procedures found for this incident type; follow the general emergency protocol."

        trace.append("Knowledge RAG: successfully retrieved relevant procedures")

    except Exception as e:
        # Even if RAG fails for any reason, the system continues with a
        # generic fallback instead of crashing entirely.
        procedures_text = "Could not access the procedures knowledge base; follow the basic general emergency protocol."
        trace.append(f"Knowledge RAG: an error occurred ({str(e)[:80]}) - used a generic fallback procedure")

    return {"procedures": procedures_text, "trace": trace}
