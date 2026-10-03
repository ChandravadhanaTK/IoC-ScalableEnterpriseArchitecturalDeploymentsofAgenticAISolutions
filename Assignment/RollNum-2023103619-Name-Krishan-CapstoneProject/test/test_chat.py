"""
Tests for the chat endpoint: POST /chat
"""

import sys
import os

import pytest
from unittest.mock import AsyncMock, patch

# Ensure backend is importable (conftest already inserts the path, but guard anyway)
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from chat_service_sqlite import chat_service  # noqa: E402  (after path setup)


# ---------------------------------------------------------------------------
# Authentication guards
# ---------------------------------------------------------------------------
class TestChatAuth:
    def test_chat_requires_auth_header(self, client):
        resp = client.post("/chat", json={"message": "Hello"})
        assert resp.status_code == 403

    def test_chat_invalid_token_rejected(self, client):
        resp = client.post(
            "/chat",
            json={"message": "Hello"},
            headers={"Authorization": "Bearer totally.invalid.token"},
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Core chat behaviour
# ---------------------------------------------------------------------------
class TestChatEndpoint:
    def test_chat_creates_new_conversation(self, client, register_and_login):
        headers, _ = register_and_login()
        with patch.object(
            chat_service, "generate_response", new=AsyncMock(return_value="Hello from AI!")
        ):
            resp = client.post("/chat", json={"message": "Hello"}, headers=headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["response"] == "Hello from AI!"
        assert isinstance(data["conversation_id"], int)

    def test_chat_returns_response_and_conversation_id(self, client, register_and_login):
        headers, _ = register_and_login()
        with patch.object(
            chat_service, "generate_response", new=AsyncMock(return_value="Mocked reply")
        ):
            resp = client.post("/chat", json={"message": "Test"}, headers=headers)

        assert resp.status_code == 200
        assert "response" in resp.json()
        assert "conversation_id" in resp.json()

    def test_chat_continues_existing_conversation(self, client, register_and_login):
        headers, _ = register_and_login()

        with patch.object(
            chat_service, "generate_response", new=AsyncMock(return_value="First")
        ):
            first = client.post("/chat", json={"message": "Start"}, headers=headers)
        conv_id = first.json()["conversation_id"]

        with patch.object(
            chat_service, "generate_response", new=AsyncMock(return_value="Second")
        ):
            second = client.post(
                "/chat",
                json={"message": "Follow-up", "conversation_id": conv_id},
                headers=headers,
            )

        assert second.status_code == 200
        assert second.json()["conversation_id"] == conv_id

    def test_chat_missing_message_field_rejected(self, client, register_and_login):
        headers, _ = register_and_login()
        resp = client.post("/chat", json={}, headers=headers)
        assert resp.status_code == 422
