"""
Tests for the local Flask web UI (web_app/app.py).

These run fully offline using the mock searcher.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "web_app"))

from datetime import datetime, timedelta

import pytest

from app import app as flask_app


@pytest.fixture
def client():
    """Flask test client for the local web UI."""
    flask_app.config.update(TESTING=True)
    with flask_app.test_client() as test_client:
        yield test_client


def _valid_payload(**overrides):
    payload = {
        "location": "San Francisco, CA",
        "start_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "duration_days": 1,
        "budget": 150,
        "party_size": 2,
        "start_time": "09:00",
        "end_time": "21:00",
        "transportation": "walking",
        "pace": "moderate",
        "interests": ["museum", "restaurant", "park"],
    }
    payload.update(overrides)
    return payload


@pytest.mark.unit
def test_index_page_renders(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"Trip Planner Agent" in resp.data
    assert b"/api/plan" not in resp.data  # endpoint is referenced from JS, not HTML


@pytest.mark.unit
def test_meta_endpoint(client):
    resp = client.get("/api/meta")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "museum" in data["interests"]
    assert "walking" in data["transportation"]
    assert data["paces"] == ["relaxed", "moderate", "packed"]


@pytest.mark.integration
def test_plan_endpoint_success(client):
    resp = client.post("/api/plan", json=_valid_payload())
    assert resp.status_code == 200
    data = resp.get_json()

    assert data["location"] == "San Francisco, CA"
    assert data["total_activities"] >= 1
    assert len(data["items"]) == data["total_activities"]
    assert data["total_cost"] >= 0
    assert isinstance(data["markdown"], str) and "Trip Itinerary" in data["markdown"]

    first = data["items"][0]
    assert first["name"]
    assert first["time"]
    assert first["end_time"]
    assert first["category"]


@pytest.mark.unit
def test_plan_endpoint_missing_location(client):
    resp = client.post("/api/plan", json=_valid_payload(location=""))
    assert resp.status_code == 400
    assert "location" in resp.get_json()["error"].lower()


@pytest.mark.unit
def test_plan_endpoint_ignores_unknown_interests(client):
    resp = client.post(
        "/api/plan",
        json=_valid_payload(interests=["museum", "not-a-real-category"]),
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total_activities"] >= 1