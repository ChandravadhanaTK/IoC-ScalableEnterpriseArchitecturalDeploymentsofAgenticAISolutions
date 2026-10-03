"""Repository acquisition endpoints. These endpoints ingest source only."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.schemas.ingestion import GitHubIngestionRequest, IngestionResponse
from app.services.analysis_service import AnalysisService
from app.services.repository_ingestion import IngestionError, IngestionResult, RepositoryIngestionService

router = APIRouter(prefix="/api/analyze", tags=["repository-ingestion"])
_service: RepositoryIngestionService | None = None
_analysis_service = AnalysisService()


def get_analysis_service() -> AnalysisService:
    return _analysis_service


def get_ingestion_service() -> RepositoryIngestionService:
    """Return the process-local service used by later pipeline stages."""
    global _service
    if _service is None:
        _service = RepositoryIngestionService(get_settings())
    return _service


def _as_response(result: IngestionResult, analysis: dict) -> IngestionResponse:
    return IngestionResponse(
        ingestion_id=result.ingestion_id,
        repository_name=result.repository_name,
        source=result.source,
        status=result.status,
        files=result.files,
        python_files=result.python_files,
        warnings=result.warnings,
        analysis_id=analysis["analysis_id"],
        analysis_status=analysis["repository"]["status"],
        analysis_started=True,
        message="Repository was safely ingested and statically analyzed; repository code was not executed.",
    )


def _raise_http_error(error: IngestionError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/github", response_model=IngestionResponse, status_code=status.HTTP_200_OK)
async def ingest_github_repository(
    request: GitHubIngestionRequest,
    service: RepositoryIngestionService = Depends(get_ingestion_service),
) -> IngestionResponse:
    """Download and safely stage a public GitHub Python repository archive."""
    try:
        result = await run_in_threadpool(service.ingest_github, request.url)
        workspace, metadata = service.get_workspace(result.ingestion_id)
        if workspace is None:
            raise HTTPException(status_code=500, detail="Ingested repository workspace is unavailable.")
        analysis = get_analysis_service().get_analysis(result.ingestion_id)
        if analysis is None:
            analysis = await run_in_threadpool(
                get_analysis_service().analyze,
                metadata,
                workspace,
                get_settings(),
            )
    except IngestionError as error:
        _raise_http_error(error)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return _as_response(result, analysis)


@router.post("/upload", response_model=IngestionResponse, status_code=status.HTTP_200_OK)
@router.post("", response_model=IngestionResponse, status_code=status.HTTP_200_OK)
async def ingest_zip_repository(
    file: UploadFile = File(...),
    service: RepositoryIngestionService = Depends(get_ingestion_service),
) -> IngestionResponse:
    """Safely validate and stage an uploaded ZIP without running its contents."""
    try:
        result = await run_in_threadpool(service.ingest_zip, file.file, file.filename)
        workspace, metadata = service.get_workspace(result.ingestion_id)
        if workspace is None:
            raise HTTPException(status_code=500, detail="Ingested repository workspace is unavailable.")
        analysis = await run_in_threadpool(
            get_analysis_service().analyze,
            metadata,
            workspace,
            get_settings(),
        )
    except IngestionError as error:
        _raise_http_error(error)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    finally:
        await file.close()
    return _as_response(result, analysis)
