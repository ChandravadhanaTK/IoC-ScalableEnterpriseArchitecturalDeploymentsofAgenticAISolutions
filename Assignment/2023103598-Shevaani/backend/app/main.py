"""
Application entrypoint.

Run locally with:
    uvicorn app.main:app --reload

This module only wires together configuration, logging, and API routers.
It must never import anything from app.analyzer directly for execution
of repository code - the analyzer is a static-analysis-only library.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analysis, health, ingestion
from app.analyzer.evaluation import print_evaluation
from app.api.ingestion import get_analysis_service, get_ingestion_service
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.core.middleware import UploadSizeLimitMiddleware

configure_logging()
logger = get_logger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    print_evaluation()
    logger.info(
        "startup app_env=%s gemini_configured=%s ai_enabled=%s",
        settings.app_env,
        bool(settings.gemini_api_key),
        settings.enable_ai_analysis,
    )
    try:
        yield
    finally:
        get_ingestion_service().cleanup()
        get_analysis_service().cleanup()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "AI-Assisted Framework for Automated Software Architecture "
        "Assessment and Code Smell Detection - API"
    ),
    lifespan=lifespan,
)

app.add_middleware(
    UploadSizeLimitMiddleware,
    max_bytes=settings.max_repository_size_mb * 1024 * 1024,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ingestion.router)
app.include_router(analysis.router)
