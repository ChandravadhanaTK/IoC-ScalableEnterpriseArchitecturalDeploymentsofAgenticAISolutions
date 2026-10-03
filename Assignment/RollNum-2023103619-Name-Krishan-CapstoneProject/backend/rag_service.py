import re
import io
import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
from config_sqlite import settings

_URL_TIMEOUT = 15

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def chunk_text(text: str) -> list:
    """Split text into overlapping fixed-size chunks."""
    text = re.sub(r'\s+', ' ', text).strip()
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def extract_url_text(url: str) -> str:
    """Fetch a web page and return its visible text."""
    try:
        import requests
        from bs4 import BeautifulSoup

        resp = requests.get(url, timeout=_URL_TIMEOUT, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        return soup.get_text(separator=" ", strip=True)
    except Exception as e:
        logger.error(f"URL fetch error for {url}: {e}")
        return ""


def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return ""


class RagService:
    def __init__(self):
        self._openai_client = None
        self.chroma_client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=ChromaSettings(anonymized_telemetry=False),
        )

    def is_configured(self) -> bool:
        return bool(settings.openai_api_key)

    @property
    def openai_client(self):
        if self._openai_client is None:
            if not settings.openai_api_key:
                raise ValueError("OPENAI_API_KEY is not set — RAG requires it for embeddings")
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=settings.openai_api_key)
        return self._openai_client

    def _collection_name(self, user_id: int, is_global: bool) -> str:
        return "global_docs" if is_global else f"user_{user_id}"

    def _get_collection(self, name: str):
        return self.chroma_client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    def _embed(self, texts: list) -> list:
        response = self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        return [d.embedding for d in response.data]

    def add_document(self, user_id: int, doc_id: int, filename: str, chunks: list, is_global: bool) -> None:
        if not chunks:
            return
        embeddings = self._embed(chunks)
        collection = self._get_collection(self._collection_name(user_id, is_global))
        collection.add(
            ids=[f"doc_{doc_id}_chunk_{i}" for i in range(len(chunks))],
            embeddings=embeddings,
            documents=chunks,
            metadatas=[{"doc_id": doc_id, "user_id": user_id, "filename": filename} for _ in chunks],
        )
        logger.info(f"Added {len(chunks)} chunks for doc {doc_id} to ChromaDB")

    def query(self, user_id: int, query_text: str, n_results: int = 3) -> list:
        """Retrieve top-k relevant chunks from user + global collections."""
        query_embedding = self._embed([query_text])[0]
        results = []

        for name in [f"user_{user_id}", "global_docs"]:
            try:
                col = self._get_collection(name)
                count = col.count()
                if count == 0:
                    continue
                res = col.query(
                    query_embeddings=[query_embedding],
                    n_results=min(n_results, count),
                )
                results.extend(res["documents"][0])
            except Exception as e:
                logger.warning(f"RAG query error on collection '{name}': {e}")

        return results

    def delete_document(self, user_id: int, doc_id: int, is_global: bool) -> None:
        name = self._collection_name(user_id, is_global)
        try:
            col = self.chroma_client.get_collection(name)
            col.delete(where={"doc_id": doc_id})
            logger.info(f"Deleted doc {doc_id} chunks from collection '{name}'")
        except Exception as e:
            logger.warning(f"Could not delete doc {doc_id} from ChromaDB: {e}")


rag_service = RagService()
