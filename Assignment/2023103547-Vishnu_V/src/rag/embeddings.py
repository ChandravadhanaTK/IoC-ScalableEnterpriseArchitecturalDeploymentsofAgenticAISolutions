"""Embeddings module for ResearchPilot using Google Generative AI."""

from __future__ import annotations

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from utils.config import get_settings
from utils.llm import LLMConfigError, _placeholder_key, resolve_model

_BATCH = 50  # Gemini embedding endpoint accepts at most 100 texts per call


def get_embedding_function() -> GoogleGenerativeAIEmbeddings:
    """Create the Google Generative AI embeddings function.

    The configured embedding model is checked against the models the API key
    can really use, so a retired model name no longer breaks the pipeline.
    """
    settings = get_settings()
    if _placeholder_key(settings.gemini_api_key):
        raise LLMConfigError("GEMINI_API_KEY is not set. Add it to src/.env.")
    return GoogleGenerativeAIEmbeddings(
        model=resolve_model(settings.gemini_embedding_model, "embedding"),
        google_api_key=settings.gemini_api_key,
    )


def embed_text(text: str) -> list[float]:
    """Embed a single text string."""
    return get_embedding_function().embed_query(text)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed many texts, batching to respect API limits."""
    embedder = get_embedding_function()
    out: list[list[float]] = []
    for i in range(0, len(texts), _BATCH):
        out.extend(embedder.embed_documents(texts[i:i + _BATCH]))
    return out
