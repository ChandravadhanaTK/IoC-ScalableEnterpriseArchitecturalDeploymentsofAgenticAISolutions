from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.core.middleware import UploadSizeLimitMiddleware


def create_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(UploadSizeLimitMiddleware, max_bytes=4, overhead_bytes=0)

    @app.post("/api/analyze/upload")
    async def receive_upload(request: Request):
        content = await request.body()
        return {"received": len(content)}

    return app


def test_rejects_upload_above_content_length_limit():
    with TestClient(create_app()) as client:
        response = client.post("/api/analyze/upload", content=b"12345")

    assert response.status_code == 413
    assert response.json()["detail"] == "Upload request exceeds the configured size limit."


def test_rejects_streamed_upload_without_content_length():
    body_chunks = iter((b"12", b"345"))
    with TestClient(create_app()) as client:
        response = client.post("/api/analyze/upload", content=body_chunks)

    assert response.status_code == 413


def test_size_guard_does_not_limit_other_routes():
    app = create_app()

    @app.post("/other")
    async def receive_other(request: Request):
        content = await request.body()
        return {"received": len(content)}

    with TestClient(app) as client:
        response = client.post("/other", content=b"12345")

    assert response.status_code == 200


def test_size_guard_also_limits_canonical_analyze_path():
    app = create_app()

    @app.post("/api/analyze")
    async def receive_analyze(request: Request):
        content = await request.body()
        return {"received": len(content)}

    with TestClient(app) as client:
        response = client.post("/api/analyze", content=b"12345")

    assert response.status_code == 413
