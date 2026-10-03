# Backend

FastAPI backend for the AI chatbot. See [backend.md](../backend.md) for full documentation.

See [root installation instructions](../readme.md) for virtual environments, environment configuration, and executed validation results. The Poetry lockfile is stale relative to the RAG dependencies; use the pip path until it is regenerated. URL ingestion imports requests, which must be installed explicitly.

## Quick Start

```bash
# pip
pip install -r requirements_sqlite.txt requests
uvicorn main_sqlite:app --reload --port 8000

# Poetry
poetry install
poetry run uvicorn main_sqlite:app --reload --port 8000
```

Create `backend/.env`:

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
SECRET_KEY=
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

API docs at <http://localhost:8000/docs>

Configure the empty fields locally; do not use an empty signing secret. Conversation object authorization is incomplete in the current source. See [security model](../docs/security-model.md) and [deployment limitations](../docs/deployment-strategy.md).
