from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_registration_and_login_flow():
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newstudent",
            "email": "newstudent@example.com",
            "password": "StrongPass123!",
            "full_name": "New Student",
            "role": "student",
        },
    )
    assert response.status_code in {200, 201}

    login = client.post(
        "/api/auth/login",
        json={"username": "newstudent", "password": "StrongPass123!"},
    )
    assert login.status_code == 200
    payload = login.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"


def test_tickets_require_auth():
    response = client.get("/api/tickets/my")
    assert response.status_code == 401


def test_unauthorized_access_blocked_for_student_admin_endpoints():
    register = client.post(
        "/api/auth/register",
        json={
            "username": "staffuser",
            "email": "staff@example.com",
            "password": "StrongPass123!",
            "full_name": "Staff User",
            "role": "staff",
        },
    )
    token = client.post(
        "/api/auth/login",
        json={"username": "staffuser", "password": "StrongPass123!"},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/admin/tickets", headers=headers)
    assert response.status_code in {403, 401}


def test_rule_based_fallback_for_ticket_analysis():
    register = client.post(
        "/api/auth/register",
        json={
            "username": "analyst",
            "email": "analyst@example.com",
            "password": "StrongPass123!",
            "full_name": "Analyst User",
            "role": "student",
        },
    )
    token = client.post(
        "/api/auth/login",
        json={"username": "analyst", "password": "StrongPass123!"},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/tickets",
        json={
            "title": "Wi-Fi outage",
            "description": "The Wi-Fi in CS Lab is down and students cannot connect.",
            "location": "CS Department",
            "building": "Computer Science Block",
            "room_number": "Lab 3",
            "contact_info": "analyst@example.com",
            "image_url": "",
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["category"] in {"Network", "Other"}
    assert data["priority"] in {"Low", "Medium", "High", "Critical"}
