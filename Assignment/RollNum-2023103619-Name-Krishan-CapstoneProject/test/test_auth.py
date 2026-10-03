"""
Tests for authentication endpoints:
  POST /auth/register
  POST /auth/login
  GET  /auth/me
"""

import uuid


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
class TestRegister:
    def test_register_success(self, client):
        username = f"reg_{uuid.uuid4().hex[:8]}"
        resp = client.post(
            "/auth/register",
            json={
                "username": username,
                "email": f"{username}@example.com",
                "password": "Secure1Pass",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == username
        assert "id" in data
        assert "password_hash" not in data  # never leak hashed password

    def test_register_duplicate_username(self, client):
        username = f"dup_{uuid.uuid4().hex[:8]}"
        payload = {
            "username": username,
            "email": f"{username}@example.com",
            "password": "Secure1Pass",
        }
        client.post("/auth/register", json=payload)
        resp = client.post(
            "/auth/register",
            json={**payload, "email": f"other_{uuid.uuid4().hex[:4]}@example.com"},
        )
        assert resp.status_code == 400

    def test_register_duplicate_email(self, client):
        email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
        client.post(
            "/auth/register",
            json={"username": f"u1_{uuid.uuid4().hex[:6]}", "email": email, "password": "Secure1Pass"},
        )
        resp = client.post(
            "/auth/register",
            json={"username": f"u2_{uuid.uuid4().hex[:6]}", "email": email, "password": "Secure1Pass"},
        )
        assert resp.status_code == 400

    def test_register_missing_fields(self, client):
        resp = client.post("/auth/register", json={"username": "only_username"})
        assert resp.status_code == 422  # validation error


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
class TestLogin:
    def test_login_returns_token(self, client, register_and_login):
        headers, user = register_and_login()
        assert headers["Authorization"].startswith("Bearer ")
        assert "id" in user
        assert "username" in user

    def test_login_wrong_password(self, client):
        username = f"lp_{uuid.uuid4().hex[:8]}"
        client.post(
            "/auth/register",
            json={"username": username, "email": f"{username}@example.com", "password": "CorrectPass1"},
        )
        resp = client.post("/auth/login", json={"username": username, "password": "WrongPass1"})
        assert resp.status_code == 401

    def test_login_unknown_user(self, client):
        resp = client.post(
            "/auth/login",
            json={"username": f"ghost_{uuid.uuid4().hex[:8]}", "password": "AnyPass1"},
        )
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        resp = client.post("/auth/login", json={"username": "only_name"})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# /auth/me
# ---------------------------------------------------------------------------
class TestGetMe:
    def test_get_me_success(self, client, register_and_login):
        headers, user = register_and_login()
        resp = client.get("/auth/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["username"] == user["username"]
        assert resp.json()["id"] == user["id"]

    def test_get_me_invalid_token(self, client):
        resp = client.get("/auth/me", headers={"Authorization": "Bearer totally.invalid.token"})
        assert resp.status_code == 401

    def test_get_me_no_token(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 403  # HTTPBearer returns 403 when header is absent
