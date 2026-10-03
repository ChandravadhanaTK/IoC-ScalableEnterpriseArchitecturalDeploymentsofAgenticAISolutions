"""
Shared fixtures for the test suite.

Sets up:
- A temporary SQLite database (isolated from production chatbot.db)
- A mocked ChromaDB client so RAG tests don't touch the filesystem
- A FastAPI TestClient wired to the test database
- Convenience helpers for user registration / login
"""

import os
import sys
import uuid
import pytest
from unittest.mock import MagicMock, AsyncMock

# ---------------------------------------------------------------------------
# Python path — add backend so all backend modules are importable
# ---------------------------------------------------------------------------
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, BACKEND_DIR)

# ---------------------------------------------------------------------------
# Environment variables — must be set before any backend module is imported
# ---------------------------------------------------------------------------
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")
os.environ.setdefault("OPENAI_API_KEY", "sk-test-openai-key")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-jwt-signing")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

# ---------------------------------------------------------------------------
# Mock ChromaDB before rag_service (imported by main_sqlite) initialises it.
# This prevents actual disk I/O during tests.
# ---------------------------------------------------------------------------
import chromadb  # noqa: E402  (must come after sys.path setup)

_mock_collection = MagicMock()
_mock_collection.count.return_value = 0
_mock_collection.query.return_value = {"documents": [[]], "metadatas": [[]], "distances": [[]]}

_mock_chroma_client = MagicMock()
_mock_chroma_client.get_or_create_collection.return_value = _mock_collection
_mock_chroma_client.get_collection.return_value = _mock_collection

chromadb.PersistentClient = MagicMock(return_value=_mock_chroma_client)


# ---------------------------------------------------------------------------
# Session-scoped TestClient backed by a temporary database
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def client(tmp_path_factory):
    db_path = str(tmp_path_factory.mktemp("db") / "test_chatbot.db")

    from database_sqlite import DatabaseManager
    import database_sqlite
    import auth_service

    test_db = DatabaseManager(db_path=db_path)

    # Swap the global db_manager in every module that references it
    database_sqlite.db_manager = test_db
    auth_service.db_manager = test_db

    import main_sqlite
    main_sqlite.db_manager = test_db

    from fastapi.testclient import TestClient

    with TestClient(main_sqlite.app) as c:
        yield c


# ---------------------------------------------------------------------------
# Helper fixture: register a fresh user and return (auth_headers, user_data)
# ---------------------------------------------------------------------------
@pytest.fixture
def register_and_login(client):
    def _make_user(username: str | None = None, password: str = "TestPass123!"):
        username = username or f"user_{uuid.uuid4().hex[:10]}"
        email = f"{username}@test.example.com"
        reg = client.post(
            "/auth/register",
            json={"username": username, "email": email, "password": password},
        )
        assert reg.status_code == 200, f"Registration failed: {reg.json()}"

        login = client.post(
            "/auth/login",
            json={"username": username, "password": password},
        )
        assert login.status_code == 200, f"Login failed: {login.json()}"

        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        return headers, login.json()["user"]

    return _make_user
