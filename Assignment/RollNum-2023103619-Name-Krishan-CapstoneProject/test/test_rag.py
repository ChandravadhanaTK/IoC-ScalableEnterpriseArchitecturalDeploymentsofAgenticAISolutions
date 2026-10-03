"""
Tests for document / RAG endpoints:
  POST   /documents/upload
  POST   /documents/upload-url
  GET    /documents
  DELETE /documents/{doc_id}
"""

import sys
import os
import io
import uuid

import pytest
from unittest.mock import patch, MagicMock

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from rag_service import rag_service  # noqa: E402


def _txt_file(content: str = "Hello world. This is a test document.") -> dict:
    """Return a files dict suitable for TestClient multipart upload."""
    return {"file": ("test.txt", io.BytesIO(content.encode()), "text/plain")}


def _upload_txt(client, headers, content: str = "Sample document text.", is_global: bool = False):
    """Upload a TXT file with mocked RAG storage. Returns the response."""
    with patch.object(rag_service, "add_document"):
        return client.post(
            "/documents/upload",
            files=_txt_file(content),
            data={"is_global": str(is_global).lower()},
            headers=headers,
        )


# ---------------------------------------------------------------------------
# Authentication guards
# ---------------------------------------------------------------------------
class TestDocumentAuth:
    def test_upload_requires_auth(self, client):
        resp = client.post(
            "/documents/upload",
            files=_txt_file(),
            data={"is_global": "false"},
        )
        assert resp.status_code == 403

    def test_list_requires_auth(self, client):
        resp = client.get("/documents")
        assert resp.status_code == 403

    def test_delete_requires_auth(self, client):
        resp = client.delete("/documents/1")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------
class TestUploadDocument:
    def test_upload_not_configured_returns_503(self, client, register_and_login):
        headers, _ = register_and_login()
        with patch.object(rag_service, "is_configured", return_value=False):
            resp = client.post(
                "/documents/upload",
                files=_txt_file(),
                data={"is_global": "false"},
                headers=headers,
            )
        assert resp.status_code == 503

    def test_upload_unsupported_file_type_rejected(self, client, register_and_login):
        headers, _ = register_and_login()
        with patch.object(rag_service, "is_configured", return_value=True):
            resp = client.post(
                "/documents/upload",
                files={"file": ("report.docx", io.BytesIO(b"data"), "application/octet-stream")},
                data={"is_global": "false"},
                headers=headers,
            )
        assert resp.status_code == 400

    def test_upload_txt_success(self, client, register_and_login):
        headers, _ = register_and_login()
        resp = _upload_txt(client, headers, content="This is a plain text document.")
        assert resp.status_code == 200
        data = resp.json()
        assert data["filename"] == "test.txt"
        assert data["file_type"] == "txt"
        assert data["chunk_count"] >= 1
        assert "id" in data

    def test_upload_global_document(self, client, register_and_login):
        headers, _ = register_and_login()
        resp = _upload_txt(client, headers, content="Global knowledge text.", is_global=True)
        assert resp.status_code == 200
        assert resp.json()["is_global"] is True

    def test_upload_personal_document(self, client, register_and_login):
        headers, _ = register_and_login()
        resp = _upload_txt(client, headers, content="Personal note.", is_global=False)
        assert resp.status_code == 200
        assert resp.json()["is_global"] is False


# ---------------------------------------------------------------------------
# List documents
# ---------------------------------------------------------------------------
class TestListDocuments:
    def test_list_empty_for_new_user(self, client, register_and_login):
        headers, _ = register_and_login()
        resp = client.get("/documents", headers=headers)
        assert resp.status_code == 200
        # May include global docs from other tests; just confirm it's a list
        assert isinstance(resp.json(), list)

    def test_list_includes_uploaded_document(self, client, register_and_login):
        headers, _ = register_and_login()
        upload_resp = _upload_txt(client, headers, content="List me please.")
        doc_id = upload_resp.json()["id"]

        docs = client.get("/documents", headers=headers).json()
        ids = [d["id"] for d in docs]
        assert doc_id in ids

    def test_list_document_has_expected_fields(self, client, register_and_login):
        headers, _ = register_and_login()
        _upload_txt(client, headers, content="Field check document.")

        docs = client.get("/documents", headers=headers).json()
        assert len(docs) >= 1
        doc = docs[0]
        for field in ("id", "user_id", "filename", "file_type", "chunk_count", "is_global", "created_at"):
            assert field in doc, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# Delete documents
# ---------------------------------------------------------------------------
class TestDeleteDocument:
    def test_delete_own_document(self, client, register_and_login):
        headers, _ = register_and_login()
        doc_id = _upload_txt(client, headers, content="Delete this.").json()["id"]

        with patch.object(rag_service, "delete_document"):
            del_resp = client.delete(f"/documents/{doc_id}", headers=headers)
        assert del_resp.status_code == 200

        # Confirm it is no longer listed
        ids = [d["id"] for d in client.get("/documents", headers=headers).json()]
        assert doc_id not in ids

    def test_delete_nonexistent_document_returns_404(self, client, register_and_login):
        headers, _ = register_and_login()
        with patch.object(rag_service, "delete_document"):
            resp = client.delete("/documents/999999", headers=headers)
        assert resp.status_code == 404

    def test_delete_another_users_document_returns_403(self, client, register_and_login):
        headers_a, _ = register_and_login()
        headers_b, _ = register_and_login()

        # User A uploads a personal doc
        doc_id = _upload_txt(client, headers_a, content="User A's private doc.").json()["id"]

        # User B tries to delete it
        with patch.object(rag_service, "delete_document"):
            resp = client.delete(f"/documents/{doc_id}", headers=headers_b)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# URL ingestion
# ---------------------------------------------------------------------------
class TestUploadUrlDocument:
    _FAKE_HTML = "<html><body><p>FastAPI is a modern web framework for Python.</p></body></html>"

    def _post_url(self, client, headers, url: str, is_global: bool = False):
        with patch("main_sqlite.extract_url_text", return_value="FastAPI is a modern web framework for Python."), \
             patch.object(rag_service, "add_document"):
            return client.post(
                "/documents/upload-url",
                json={"url": url, "is_global": is_global},
                headers=headers,
            )

    def test_upload_url_requires_auth(self, client):
        resp = client.post("/documents/upload-url", json={"url": "https://example.com"})
        assert resp.status_code == 403

    def test_upload_url_not_configured_returns_503(self, client, register_and_login):
        headers, _ = register_and_login()
        with patch.object(rag_service, "is_configured", return_value=False):
            resp = client.post(
                "/documents/upload-url",
                json={"url": "https://example.com"},
                headers=headers,
            )
        assert resp.status_code == 503

    def test_upload_url_invalid_scheme_rejected(self, client, register_and_login):
        headers, _ = register_and_login()
        with patch.object(rag_service, "is_configured", return_value=True):
            resp = client.post(
                "/documents/upload-url",
                json={"url": "ftp://example.com/file"},
                headers=headers,
            )
        assert resp.status_code == 400

    def test_upload_url_empty_text_returns_422(self, client, register_and_login):
        headers, _ = register_and_login()
        with patch("main_sqlite.extract_url_text", return_value="   "), \
             patch.object(rag_service, "is_configured", return_value=True):
            resp = client.post(
                "/documents/upload-url",
                json={"url": "https://empty-page.example.com"},
                headers=headers,
            )
        assert resp.status_code == 422

    def test_upload_url_success(self, client, register_and_login):
        headers, _ = register_and_login()
        resp = self._post_url(client, headers, "https://fastapi.tiangolo.com")
        assert resp.status_code == 200
        data = resp.json()
        assert data["filename"] == "https://fastapi.tiangolo.com"
        assert data["file_type"] == "url"
        assert data["chunk_count"] >= 1
        assert "id" in data

    def test_upload_url_personal_vs_global(self, client, register_and_login):
        headers, _ = register_and_login()
        resp_personal = self._post_url(client, headers, "https://example.com/page1", is_global=False)
        resp_global = self._post_url(client, headers, "https://example.com/page2", is_global=True)
        assert resp_personal.json()["is_global"] is False
        assert resp_global.json()["is_global"] is True

    def test_upload_url_appears_in_document_list(self, client, register_and_login):
        headers, _ = register_and_login()
        doc_id = self._post_url(client, headers, "https://docs.python.org").json()["id"]
        ids = [d["id"] for d in client.get("/documents", headers=headers).json()]
        assert doc_id in ids
