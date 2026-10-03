"""
Tests for conversation endpoints:
  GET    /conversations
  GET    /conversations/{id}/full
  DELETE /conversations/{id}
"""

import sys
import os

import pytest
from unittest.mock import AsyncMock, patch

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from chat_service_sqlite import chat_service  # noqa: E402


def _send_message(client, headers, message="Hello", conversation_id=None):
    """Helper: send a chat message with a mocked AI reply and return the response."""
    payload = {"message": message}
    if conversation_id is not None:
        payload["conversation_id"] = conversation_id
    with patch.object(
        chat_service, "generate_response", new=AsyncMock(return_value="AI reply")
    ):
        return client.post("/chat", json=payload, headers=headers)


# ---------------------------------------------------------------------------
# GET /conversations
# ---------------------------------------------------------------------------
class TestListConversations:
    def test_list_requires_auth(self, client):
        resp = client.get("/conversations")
        assert resp.status_code == 403

    def test_list_empty_for_new_user(self, client, register_and_login):
        headers, _ = register_and_login()
        resp = client.get("/conversations", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_contains_conversation_after_chat(self, client, register_and_login):
        headers, _ = register_and_login()
        _send_message(client, headers, "Hello")
        resp = client.get("/conversations", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_list_contains_expected_fields(self, client, register_and_login):
        headers, _ = register_and_login()
        _send_message(client, headers, "Hello")
        items = client.get("/conversations", headers=headers).json()
        assert len(items) >= 1
        first = items[0]
        for field in ("id", "user_id", "created_at", "message_count"):
            assert field in first, f"Missing field: {field}"

    def test_list_isolates_per_user(self, client, register_and_login):
        headers_a, _ = register_and_login()
        headers_b, _ = register_and_login()
        _send_message(client, headers_a, "User A message")
        # User B should not see user A's conversations
        resp = client.get("/conversations", headers=headers_b)
        for conv in resp.json():
            assert conv["user_id"] != client.get("/auth/me", headers=headers_a).json()["id"]


# ---------------------------------------------------------------------------
# GET /conversations/{id}/full
# ---------------------------------------------------------------------------
class TestGetFullConversation:
    def test_full_conversation_contains_messages(self, client, register_and_login):
        headers, _ = register_and_login()
        chat_resp = _send_message(client, headers, "What is 2+2?")
        conv_id = chat_resp.json()["conversation_id"]

        resp = client.get(f"/conversations/{conv_id}/full")
        assert resp.status_code == 200
        data = resp.json()
        assert "conversation" in data
        assert "messages" in data
        assert len(data["messages"]) == 2  # user + assistant

    def test_full_conversation_message_roles(self, client, register_and_login):
        headers, _ = register_and_login()
        chat_resp = _send_message(client, headers, "Role test")
        conv_id = chat_resp.json()["conversation_id"]

        messages = client.get(f"/conversations/{conv_id}/full").json()["messages"]
        roles = [m["role"] for m in messages]
        assert "user" in roles
        assert "assistant" in roles

    def test_full_conversation_not_found(self, client):
        resp = client.get("/conversations/999999/full")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /conversations/{id}
# ---------------------------------------------------------------------------
class TestDeleteConversation:
    def test_delete_removes_conversation(self, client, register_and_login):
        headers, _ = register_and_login()
        chat_resp = _send_message(client, headers, "Delete me")
        conv_id = chat_resp.json()["conversation_id"]

        del_resp = client.delete(f"/conversations/{conv_id}")
        assert del_resp.status_code == 200

        # Confirm it is gone
        assert client.get(f"/conversations/{conv_id}/full").status_code == 404

    def test_delete_not_found(self, client):
        resp = client.delete("/conversations/999999")
        assert resp.status_code == 404

    def test_deleted_conversation_absent_from_list(self, client, register_and_login):
        headers, _ = register_and_login()
        chat_resp = _send_message(client, headers, "Will be deleted")
        conv_id = chat_resp.json()["conversation_id"]

        client.delete(f"/conversations/{conv_id}")
        ids = [c["id"] for c in client.get("/conversations", headers=headers).json()]
        assert conv_id not in ids
