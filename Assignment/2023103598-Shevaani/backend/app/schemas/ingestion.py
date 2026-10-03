"""API contracts for repository ingestion."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GitHubIngestionRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)

    @field_validator("url")
    @classmethod
    def strip_url(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Repository URL cannot be blank.")
        return stripped


class IngestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ingestion_id: str
    repository_name: str
    source: str
    status: str
    files: int = Field(ge=0)
    python_files: int = Field(ge=0)
    warnings: list[str]
    analysis_id: str | None = None
    analysis_status: str = "INGESTED"
    analysis_started: bool = False
    message: str = "Repository safely ingested; repository code was not executed."
