# FastAPI + React TypeScript Chatbot

A full-stack AI assistant with login, persistent conversations, and optional Retrieval-Augmented Generation (RAG): upload PDF/TXT documents or ingest HTTP/HTTPS website text to augment Claude responses. Personal and global knowledge scopes are supported.

## Project Overview

This college capstone submission preserves the existing application and documents its actual behavior. [PROMPT.md](PROMPT.md) specifies how to recreate it; [DELIVERABLES.md](DELIVERABLES.md) presents the five required deliverables. Current implementation and proposed production design are clearly separated.

## Features

### Chat

- Request/response chat with Claude (Anthropic); no token streaming
- Persistent conversation history per user
- Create, switch, and delete conversations
- Rich content rendering: tables, code blocks, math equations (KaTeX)
- Typing indicator and auto-scroll

### RAG (Knowledge Base)

- Upload **PDF** or **TXT** files into ChromaDB
- Ingest any **website URL** — the page is fetched, stripped, and embedded automatically
- Personal documents (per-user) or Global documents (visible to all users)
- Semantic search via OpenAI `text-embedding-3-small`
- Context retrieved automatically when embeddings are configured and chunks are available; retrieval failures fall back to ordinary chat

### Authentication

- JWT-based register/login
- Conversation listing uses authenticated identity; documents include personal plus global scope
- **Known authorization gaps:** conversation creation, message/full-history reads, and deletion are public, and chat does not check ownership of a supplied conversation ID. See [Security](#security).

### Infrastructure

- Backend/frontend Dockerfiles and local Compose configuration; persistence/build-context corrections are needed before deployment
- 49 pytest test functions covering auth, chat, conversations, and RAG with mocked external dependencies; presence does not imply tests have passed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 4.9, react-scripts 5, custom CSS |
| Backend | FastAPI, Python 3.10 |
| Database | SQLite |
| Vector DB | ChromaDB |
| Embeddings | OpenAI `text-embedding-3-small` |
| AI | Anthropic Claude (via `anthropic` SDK) |
| Auth | JWT (python-jose + passlib) |
| Deps | pip requirements and Poetry manifest (backend), npm lockfile (frontend) |

## Architecture

The browser calls FastAPI through fetch. FastAPI delegates to AuthService, ChatService, RagService, and DatabaseManager. Claude generates responses; OpenAI embeds query/document text; Chroma stores extracted chunks/vectors; SQLite stores users, conversations, messages, and document metadata. Retrieval precedes generation and injects context into the system instruction. This is deterministic single-assistant orchestration, without multi-agent handoffs, executable Claude tools, or AI approval gates.

See [architecture and trust-boundary diagram](docs/architecture.md) and [workflow](docs/agent-workflow.md).

## Prerequisites

- Node.js/npm for the frontend; the existing Docker build uses Node 18
- Python 3.10 as the backend container baseline; use Python 3.10+ for the tests
- ANTHROPIC_API_KEY for chat; OPENAI_API_KEY only if RAG is needed
- Docker Engine/Compose only for the container path

The Node 18 image and broad Python dependency ranges are existing configuration, not a claim of current production support. Validate compatible runtimes/dependencies before release. The Poetry lockfile lacks OpenAI, ChromaDB, pypdf, and BeautifulSoup entries required by the current manifest; the pip requirements path below is the submission setup path. Regenerate and validate the Poetry lockfile as a future dependency maintenance task.

## Quick Start

### Option A — Docker (existing configuration)

```bash
cp backend/.env.example backend/.env
# Configure the empty credential fields locally before starting
docker compose up --build
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8000>

For PowerShell, use `Copy-Item backend/.env.example backend/.env` instead of `cp`. **Deployment limitation:** the current named volume mounts a directory at /app/chatbot.db, and Chroma has no persistent volume. Fix storage paths/mounts before relying on Compose. Root .dockerignore does not apply to the separate build contexts; add context-specific secret exclusions before building distributable images. Docker execution was not verified in the preparation environment. See [deployment strategy](docs/deployment-strategy.md).

### Option B — Manual

### Installation and running backend (PowerShell, from repository root)

```powershell
python -m venv backend/.venv
Copy-Item backend/.env.example backend/.env
# Edit backend/.env locally with provider credentials and a strong signing secret
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements_sqlite.txt requests
cd backend
.venv/Scripts/python.exe -m uvicorn main_sqlite:app --reload --port 8000
```

### Installation and running backend (POSIX shell, from repository root)

```bash
python3 -m venv backend/.venv
cp backend/.env.example backend/.env
# Edit backend/.env locally before starting
backend/.venv/bin/python -m pip install -r backend/requirements_sqlite.txt requests
cd backend
.venv/bin/python -m uvicorn main_sqlite:app --reload --port 8000
```

requests is imported by URL ingestion but is not declared directly in requirements_sqlite.txt, so setup includes it explicitly. Run Uvicorn from backend/ so dotenv and relative storage paths resolve there. DATABASE_URL currently does not control DatabaseManager. The existing zsh start.sh supports POSIX systems; it is not a PowerShell launcher.

### Running frontend (new terminal, from repository root)

```bash
cd frontend
npm ci
npm start
```

Frontend URL: <http://localhost:3000>. To change the backend URL in PowerShell, set `$env:REACT_APP_API_URL='http://localhost:8000'` before npm start or npm run build. The production Nginx image reads the URL from its build argument, not runtime environment.

### Environment Variables

Copy [backend/.env.example](backend/.env.example) and fill empty credential fields locally. Never commit the resulting .env or embed provider keys in frontend variables.

| Variable | Purpose |
| --- | --- |
| ANTHROPIC_API_KEY | Backend Claude credential; required for generation |
| OPENAI_API_KEY | Optional RAG embedding credential; absent means no retrieval and upload returns 503 |
| SECRET_KEY | Set a strong random JWT signing secret; current fallback is unsafe |
| ALGORITHM | JWT signing algorithm, default HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Access-token lifetime, default 30 |
| DATABASE_URL | Read by settings, but not used by the global SQLite manager |
| REACT_APP_API_URL | Frontend API URL at start/build time; default <http://localhost:8000> |

### Claude Configuration

[chat_service_sqlite.py](backend/chat_service_sqlite.py) uses AsyncAnthropic with the hard-coded model claude-haiku-4-5, max_tokens=1024, full conversation history, and an ephemeral system cache hint. The model is not configurable through an environment variable. Verify account/model access when deploying. Provider exceptions currently become an apology string, which can be persisted and returned as HTTP 200; token usage is discarded.

### RAG

[rag_service.py](backend/rag_service.py) supports text PDFs, TXT, and fetched websites; no OCR or DOCX ingestion exists. Text is normalized and split into 800-character chunks with 100-character overlap. OpenAI text-embedding-3-small supplies embeddings; local Chroma uses cosine collections user_{id} and global_docs. Retrieval returns up to three chunks from each collection without reranking, relevance thresholds, or citations. Metadata is committed to SQLite before vector insertion; partial failures can leave inconsistent stores. Global documents are shared with all users. Provider processing sends document/query text to OpenAI and conversation/context text to Anthropic.

## API Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, returns JWT |
| `GET` | `/auth/me` | Current user info |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Send message, get AI response |

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/conversations` | List user conversations |
| `POST` | `/conversations` | Create conversation (currently public; accepts user_id) |
| `GET` | `/conversations/{id}/messages` | Message history (currently public) |
| `GET` | `/conversations/{id}/full` | Full conversation + messages (currently public) |
| `DELETE` | `/conversations/{id}` | Delete conversation (currently public) |

### Documents (RAG)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/documents/upload` | Upload PDF or TXT file |
| `POST` | `/documents/upload-url` | Ingest a web page by URL |
| `GET` | `/documents` | List accessible documents |
| `DELETE` | `/documents/{id}` | Delete document + embeddings |

## Project Structure

This tree lists tracked repository files and the new submission documents. Local .git/, node_modules/, and generated build/cache folders are omitted. Existing credential notes are listed by filename only and need review before sharing.

```text
fastapi-react-typescript-chatbot/
├── .claude/
│   ├── commands/
│   │   ├── health.md
│   │   ├── start.md
│   │   ├── stop.md
│   │   └── test.md
│   └── settings.json
├── backend/
│   ├── .env.example
│   ├── auth_service.py
│   ├── chat_service_sqlite.py
│   ├── config_sqlite.py
│   ├── database_sqlite.py
│   ├── Dockerfile
│   ├── main_sqlite.py
│   ├── models.py
│   ├── poetry.lock
│   ├── pyproject.toml
│   ├── rag_service.py
│   ├── README.md
│   └── requirements_sqlite.txt
├── docs/
│   ├── agent-workflow.md
│   ├── architecture.md
│   ├── deployment-strategy.md
│   ├── monitoring-dashboard.md
│   └── security-model.md
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── AllConversations.tsx
│   │   │   ├── ChatBot.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── DocumentPanel.tsx
│   │   │   ├── LoadingDots.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── styles/
│   │   │   ├── AllConversations.css
│   │   │   ├── Animations.css
│   │   │   ├── ChatBot.css
│   │   │   ├── ConfirmDialog.css
│   │   │   ├── DocumentPanel.css
│   │   │   ├── global.css
│   │   │   ├── Login.css
│   │   │   ├── MessageBubble.css
│   │   │   ├── MessageInput.css
│   │   │   └── Messages.css
│   │   ├── api.ts
│   │   ├── App.css
│   │   ├── App.test.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── index.tsx
│   │   ├── logo.svg
│   │   ├── react-app-env.d.ts
│   │   ├── reportWebVitals.ts
│   │   ├── setupTests.ts
│   │   └── types.ts
│   ├── .gitignore
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   └── tsconfig.json
├── test/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_chat.py
│   ├── test_conversations.py
│   └── test_rag.py
├── .dockerignore
├── .gitignore
├── backend.md
├── CLAUDE.md
├── DELIVERABLES.md
├── demo-acc.md
├── docker-compose.yml
├── frontend.md
├── fullstack.md
├── git.md
├── PROMPT.md
├── pytest.ini
├── readme.md
└── start.sh
```

## Testing

```bash
# From root, using the backend virtual environment's Python
# PowerShell: backend/.venv/Scripts/python.exe
# POSIX: backend/.venv/bin/python
python -m pip install -r backend/requirements_sqlite.txt requests pytest "httpx<0.28"
python -m pytest test/ -v
```

The `python` above must refer to the virtual environment (activate it or use its explicit path). test/ contains 49 tests: 11 auth, 6 chat, 11 conversations, and 21 RAG. Fixtures use temporary SQLite and mocked Chroma/provider operations; they do not verify real provider access or secure conversation ownership. httpx is a test dependency and must remain compatible with the pinned FastAPI/Starlette TestClient.

```bash
# From frontend/
npm test -- --watch=false --watchAll=false --runInBand --all
npm run build
```

App.test.tsx retains a starter assertion for a Learn React link that the current UI does not render. The executed test command failed before assertions because Jest could not parse react-markdown's ES module. npm run build succeeded with existing unused-variable/hook warnings and outdated Browserslist data. Backend pytest could not start because host Python lacks pytest; Docker was unavailable. See [DELIVERABLES.md](DELIVERABLES.md) for verification details.

## Security

Implemented controls include bcrypt password hashing, expiring JWTs, selected authenticated routes, parameterized SQL, document-uploader deletion checks, and localhost CORS. Conversation authorization gaps, the JWT secret fallback, unrestricted global publication, unbounded upload parsing, URL SSRF exposure, and untrusted text in the system prompt are documented in [security-model.md](docs/security-model.md). API keys and signing secrets must stay in backend environment configuration. Ignore rules cannot protect previously tracked sensitive files; review existing tracked credential notes before sharing. Production controls are proposals, not changes to application behavior.

## Deployment

See [deployment-strategy.md](docs/deployment-strategy.md) for the actual Docker layout, persistence defects, release/rollback design, and a proposed Hugging Face Docker Spaces or general container-host adaptation. Multiple backend instances require shared SQL/vector services and ingestion concurrency controls; the repository does not implement them.

## Capstone Documentation

| Submission artifact | Contents |
| --- | --- |
| [PROMPT.md](PROMPT.md) | Comprehensive application-generation prompt |
| [DELIVERABLES.md](DELIVERABLES.md) | Concise five-deliverable submission |
| [Architecture](docs/architecture.md) | Layers, components, trust boundaries and integrations |
| [Agent workflow](docs/agent-workflow.md) | Roles, conceptual states, tools, handoffs, approvals and failures |
| [Deployment](docs/deployment-strategy.md) | Runtime, scaling, resilience, environments and releases |
| [Security](docs/security-model.md) | Identity, authorization, secrets, privacy, guardrails and audit |
| [Monitoring design](docs/monitoring-dashboard.md) | Health, trace, quality, safety, cost and business outcomes |

The complete backend/, frontend/, and test/ source remains part of the submission. Original detailed guides backend.md, frontend.md, and fullstack.md remain available, with factual corrections and links to the capstone documents.

## API Docs

FastAPI auto-generates interactive docs when the backend is running:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
