"""Read completed in-memory static analysis results."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from starlette.concurrency import run_in_threadpool

from app.api.ingestion import get_analysis_service
from app.core.config import get_settings

router = APIRouter(prefix="/api/analysis", tags=["analysis-results"])


def _not_found(analysis_id: str) -> HTTPException:
    return HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' was not found.")


@router.get("/{analysis_id}")
def get_analysis(analysis_id: str) -> dict:
    result = get_analysis_service().get_analysis(analysis_id)
    if result is None:
        raise _not_found(analysis_id)
    return result


@router.get("/{analysis_id}/summary")
def get_analysis_summary(analysis_id: str) -> dict:
    result = get_analysis_service().get_analysis(analysis_id)
    if result is None:
        raise _not_found(analysis_id)
    return {
        "analysis_id": analysis_id,
        "repository": result["repository"],
        "metrics": result["metrics"],
        "finding_count": len(result["findings"]),
        "dependency_count": result["dependency_graph"]["dependency_count"],
        "architecture_status": result["architecture"]["status"],
    }


@router.get("/{analysis_id}/status")
def get_analysis_status(analysis_id: str) -> dict:
    result = get_analysis_service().get_analysis(analysis_id)
    if result is None:
        raise _not_found(analysis_id)
    return {
        "analysis_id": analysis_id,
        "status": result["repository"]["status"],
        "completed_at": result["analysis_metadata"]["completed_at"],
    }


@router.get("/{analysis_id}/ai-review")
def get_analysis_ai_review(analysis_id: str) -> dict:
    result = get_analysis_service().get_analysis(analysis_id)
    if result is None:
        raise _not_found(analysis_id)
    return result["ai_review"]


@router.post("/{analysis_id}/ai-review")
async def trigger_analysis_ai_review(analysis_id: str) -> dict:
    review = await run_in_threadpool(
        get_analysis_service().trigger_ai_review,
        analysis_id,
        get_settings(),
    )
    if review is None:
        raise _not_found(analysis_id)
    return review


@router.post("/{analysis_id}/architecture-image")
async def generate_analysis_architecture_image(analysis_id: str) -> dict:
    image = await run_in_threadpool(
        get_analysis_service().generate_architecture_image,
        analysis_id,
        get_settings(),
    )
    if image is None:
        raise _not_found(analysis_id)
    return image


@router.get("/{analysis_id}/findings")
def get_analysis_findings(analysis_id: str) -> dict:
    findings = get_analysis_service().get_findings(analysis_id)
    if findings is None:
        raise _not_found(analysis_id)
    return {"analysis_id": analysis_id, "findings": findings}


@router.get("/{analysis_id}/findings/{finding_id:path}")
def get_analysis_finding(analysis_id: str, finding_id: str) -> dict:
    findings = get_analysis_service().get_findings(analysis_id)
    if findings is None:
        raise _not_found(analysis_id)
    finding = next((item for item in findings if item["id"] == finding_id), None)
    if finding is None:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' was not found.")
    return finding


@router.get("/{analysis_id}/metrics")
def get_analysis_metrics(analysis_id: str) -> dict:
    result = get_analysis_service().get_analysis(analysis_id)
    if result is None:
        raise _not_found(analysis_id)
    return result["metrics"]


@router.get("/{analysis_id}/dependencies")
def get_analysis_dependencies(analysis_id: str) -> dict:
    result = get_analysis_service().get_analysis(analysis_id)
    if result is None:
        raise _not_found(analysis_id)
    return result["dependency_graph"]


@router.get("/{analysis_id}/architecture")
def get_analysis_architecture(analysis_id: str) -> dict:
    architecture = get_analysis_service().get_architecture(analysis_id)
    if architecture is None:
        raise _not_found(analysis_id)
    return architecture


@router.get("/{analysis_id}/architecture.svg", response_class=PlainTextResponse)
def get_analysis_architecture_svg(analysis_id: str) -> PlainTextResponse:
    result = get_analysis_service().get_analysis(analysis_id)
    if result is None:
        raise _not_found(analysis_id)
    return PlainTextResponse(result["architecture"]["svg"], media_type="image/svg+xml")


@router.get("/{analysis_id}/report", response_class=PlainTextResponse)
def get_analysis_report(analysis_id: str) -> PlainTextResponse:
    report = get_analysis_service().get_report(analysis_id)
    if report is None:
        raise _not_found(analysis_id)
    safe_id = "".join(character for character in analysis_id if character.isalnum() or character in "-_")
    return PlainTextResponse(
        report,
        headers={"Content-Disposition": f'attachment; filename="analysis-{safe_id}.md"'},
    )
