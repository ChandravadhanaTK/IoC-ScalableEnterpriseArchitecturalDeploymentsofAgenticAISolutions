"""
Integration test for GET /api/health.

Requires: fastapi, httpx (see requirements.txt). Run with:
    pytest backend/tests/integration/test_health.py -v
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/api/health")
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "ok"
    assert "app_name" in body
    assert "app_version" in body
    assert isinstance(body["ai_analysis_enabled"], bool)


def test_health_reports_mock_provider_by_default():
    response = client.get("/api/health")
    body = response.json()
    # Default configuration must not require any external API key.
    assert body["llm_provider"] == "mock"


def test_health_allows_the_configured_frontend_origin():
    response = client.get(
        "/api/health",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_health_does_not_allow_an_unconfigured_origin():
    response = client.get(
        "/api/health",
        headers={"Origin": "https://untrusted.example"},
    )

    assert "access-control-allow-origin" not in response.headers
