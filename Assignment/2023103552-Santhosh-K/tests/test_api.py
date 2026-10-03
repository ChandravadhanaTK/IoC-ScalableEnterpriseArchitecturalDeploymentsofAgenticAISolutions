from pathlib import Path
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from app.main import app  # noqa: E402

client = TestClient(app)


def login(email: str) -> str:
    response = client.post("/api/auth/login", json={"email": email, "password": "DemoPass!23"})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_damaged_order_requires_human_approval():
    token = login("customer@resolveai.demo")
    response = client.post("/api/tickets", headers={"Authorization": f"Bearer {token}"}, json={"order_id": "ORD-1001", "message": "My laptop arrived with a damaged screen. I want a replacement."})
    assert response.status_code == 201
    ticket = response.json()
    assert ticket["status"] == "PENDING_APPROVAL"
    assert ticket["proposed_action"] == "replacement"
    assert any(step["agent"] == "Human Approval" for step in ticket["traces"]) is False


def test_customer_cannot_approve_or_view_other_ticket():
    customer_token = login("customer@resolveai.demo")
    forbidden = client.post("/api/tickets/not-a-real-ticket/approval", headers={"Authorization": f"Bearer {customer_token}"}, json={"decision": "approve", "note": "not authorised"})
    assert forbidden.status_code == 403
    listed = client.get("/api/tickets", headers={"Authorization": f"Bearer {customer_token}"})
    assert listed.status_code == 200
    assert all(item["customer_id"] == "usr-customer-1" for item in listed.json())


def test_approver_can_finalise_pending_replacement():
    customer_token = login("customer@resolveai.demo")
    created = client.post("/api/tickets", headers={"Authorization": f"Bearer {customer_token}"}, json={"order_id": "ORD-1001", "message": "The damaged screen needs a replacement."}).json()
    manager_token = login("manager@resolveai.demo")
    response = client.post(f"/api/tickets/{created['id']}/approval", headers={"Authorization": f"Bearer {manager_token}"}, json={"decision": "approve", "note": "Eligibility verified."})
    assert response.status_code == 200
    assert response.json()["status"] == "RESOLVED"
