"""
Health check endpoint.

GET /api/health returns basic liveness information plus whether AI
analysis is currently enabled/configured, so the frontend can decide
whether to show AI-specific UI affordances.
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    app_name: str
    app_version: str
    app_env: str
    ai_analysis_enabled: bool


@router.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        app_version=settings.app_version,
        app_env=settings.app_env,
        ai_analysis_enabled=settings.enable_ai_analysis,
    )
