# Application Generation Prompt

## Project Objective

Recreate the repository's full-stack AI assistant for a college capstone: a React and TypeScript browser application, FastAPI API, persistent conversations, Claude responses, and optional document-grounded retrieval. Generate complete source, dependency manifests, environment templates, Docker configuration, and tests. Keep current capabilities distinct from proposed production extensions. Do not add claims of autonomous agents, production security, or monitoring that the implementation does not support.

This prompt describes the inspected implementation. When recreating it, preserve its functional behavior, but treat the documented authorization and deployment defects as issues to fix explicitly; never deliberately reproduce insecure endpoints as a requirement. In this existing repository, documentation preparation must leave application source unchanged.

## Functional Requirements

- Register with username, email, and password; log in with username and password; retrieve the current user; log out in the browser.
- Start a new conversation on the first message, continue it using an optional conversation ID, list conversations, load history, and delete conversations and their messages.
- Return one complete assistant response per HTTP request. A typing indicator is UI feedback; token streaming, WebSockets, and server-sent events are absent.
- Upload PDF or UTF-8 TXT documents, or ingest HTTP/HTTPS website text. Offer personal and global document scope. List personal plus global documents; only the uploader may delete a document.
- When embeddings are configured, automatically retrieve relevant personal and global text for each chat request. Continue chat without retrieval context if retrieval fails.

## Technology Stack

Use React 19, React DOM 19, TypeScript 4.9, Create React App/react-scripts 5, custom CSS, browser fetch, React Markdown, remark-gfm, remark-math, rehype-katex, KaTeX, and react-syntax-highlighter. Use Python 3.10 as the container baseline, FastAPI 0.104.1, Uvicorn 0.24.0, Pydantic 2.9.2, sqlite3, python-dotenv, Anthropic and OpenAI SDKs, ChromaDB, pypdf, BeautifulSoup, requests, passlib/bcrypt, and python-jose. Preserve npm and Poetry manifests and lockfiles; support pip via requirements_sqlite.txt. The existing direct requirements omit requests even though URL extraction imports it; declare it explicitly in a regenerated dependency manifest. The existing Poetry lockfile lacks current RAG dependencies; regenerate a compatible lockfile when recreating the application, and disclose this correction.

## Frontend Requirements

Implement App authentication initialization using GET /auth/me. Store the current implementation's JWT in localStorage under authToken, attach Bearer headers in api.ts, clear it on logout and failed initialization validation. Explain the production storage risks separately.

Build Login, ChatBot, AllConversations, DocumentPanel, MessageBubble, MessageInput, TypingIndicator, LoadingDots, and ConfirmDialog components. Use React hooks and shared TypeScript payload interfaces. Provide a resizable sidebar whose width is saved in localStorage, a conversation list refreshed every 30 seconds, conversation deletion confirmation, file/URL tabs, a global checkbox, document errors, and upload loading states. Render Markdown tables, highlighted code, and LaTeX math. Enter sends a trimmed nonempty message; Shift+Enter inserts a newline. Disable input during the request, show typing feedback, scroll to new messages, and display a readable failure message. New chat clears local state and defers database creation until the first message.

## Backend Requirements

Use main_sqlite.py as the Uvicorn application entry point. Separate auth_service.py, chat_service_sqlite.py, rag_service.py, database_sqlite.py, models.py, and config_sqlite.py. Initialize SQLite tables on application startup and close its connection on shutdown. Use Pydantic JSON payload validation, multipart upload handling, HTTPBearer dependencies where currently present, parameterized SQL, and INFO/WARNING/ERROR logs. Return root API status and automatic Swagger/ReDoc documentation. The root status is not a database readiness check.

## Claude Integration

Read ANTHROPIC_API_KEY only in the backend. Instantiate anthropic.AsyncAnthropic and call messages.create with model claude-haiku-4-5 and max_tokens=1024. Send the full stored conversation as role/content messages. Use a helpful-assistant system instruction requesting LaTeX with dollar delimiters; append retrieved document text when relevant. Send the system text as a text block with ephemeral cache_control. Read response.content[0].text. The current service discards usage metadata and returns an apology string on provider exceptions; this string can be persisted with HTTP 200. Do not claim it represents successful generation. Do not assert the configured model is available to every account without checking deployment access.

## Agentic AI Requirements

Implement a deterministic, single-assistant orchestration path: authenticate, persist user message, load history, optionally retrieve, call Claude, persist assistant text, respond. Retrieval and ingestion helpers are application functions, not tools selected by Claude. There is no model tool-use loop, planner, specialist agent, multi-agent handoff, durable workflow state, or AI approval gate. RECEIVED, AUTHENTICATED, PROCESSING, RETRIEVING, GENERATING, COMPLETED, and FAILED are documentation labels for this flow, not an existing state machine. UI conversation deletion confirmation is not an agent approval mechanism.

Optional production extensions must be separately labeled: coordinator/retriever/responder roles, allowlisted tool contracts, explicit statuses, bounded retries, approval records for global publication or external actions, and fail-closed authorization. Do not implement extensions as if required to reproduce current behavior.

## RAG Requirements

Normalize whitespace, split into 800-character chunks with 100-character overlap, and use OpenAI text-embedding-3-small for both document and query embeddings. Persist ChromaDB locally at ./chroma_db with anonymized telemetry disabled and cosine collections named user_{id} and global_docs. Store IDs doc_{doc_id}_chunk_{index} and metadata doc_id, user_id, filename. Query each collection independently for up to three chunks (up to six combined); concatenate personal results before global results. There is no merged reranking, relevance cutoff, citation output, or source confidence score. Insert chunks into the Claude system text separated by horizontal separators. Skip retrieval when OPENAI_API_KEY is absent; upload endpoints return 503. Query failures degrade to ordinary chat.

## Database Requirements

Create users (unique username/email, password_hash, timestamp), conversations (user_id, timestamp), messages (conversation_id, user/assistant role, content, timestamp), and documents (user_id, filename, file_type, chunk_count, is_global, timestamp), each with integer primary key. Use SQLite with sqlite3.Row, check_same_thread=False, and per-operation commits. The existing global DatabaseManager defaults to chatbot.db relative to the working directory; DATABASE_URL is read by settings but not used by that manager. Foreign keys are declared but PRAGMA enforcement is not enabled. No migration framework, connection pool, encryption, or distributed database exists. Document metadata is saved before vector insertion, with no cross-store rollback.

## Authentication Requirements

Hash passwords with passlib bcrypt, 12 rounds and 2b identifier. Issue signed JWTs containing sub, user_id, exp, with configurable SECRET_KEY, ALGORITHM (default HS256), and ACCESS_TOKEN_EXPIRE_MINUTES (default 30). Resolve current user from the token subject in SQLite. Do not include any actual credential or signing value in generated documentation. Require a strong deployment-provided signing secret; the inspected code's fallback secret is a known production defect. No refresh, revocation, password reset, MFA, or role system exists.

## API Requirements

| Method | Path | Current protection and payload |
| --- | --- | --- |
| GET | / | Public API status |
| POST | /auth/register | Public; username, email, password |
| POST | /auth/login | Public; username, password |
| GET | /auth/me | Bearer JWT |
| POST | /chat | Bearer JWT; message, optional conversation_id; returns response, conversation_id |
| POST | /conversations | Currently public; user_id |
| GET | /conversations | Bearer JWT; current user's list |
| GET | /conversations/{id}/messages | Currently public |
| GET | /conversations/{id}/full | Currently public |
| DELETE | /conversations/{id} | Currently public |
| POST | /documents/upload | Bearer JWT; multipart file, is_global |
| POST | /documents/upload-url | Bearer JWT; url, is_global |
| GET | /documents | Bearer JWT; own plus global metadata |
| DELETE | /documents/{id} | Bearer JWT and uploader ownership check |

The current /chat path does not verify ownership of an existing conversation_id. For a safe regenerated application, require authentication and ownership for every conversation operation and derive user identity server-side. Document this as an intentional correction to the baseline.

## Document Processing

Check file extension for pdf/txt, read all bytes in memory, extract PDF page text with pypdf, or decode TXT with UTF-8 and ignored errors. Reject empty text. No OCR or DOCX processing is implemented. For URL ingestion, check HTTP/HTTPS prefix, use requests.get with a 15-second timeout and a user-agent header, parse HTML, remove script/style/nav/footer/header nodes, and take visible text. Extraction errors return empty text; URL ingestion then returns 422. Store extracted chunks and vectors, not the original binary file. Delete vectors by doc_id followed by SQLite metadata; vector deletion exceptions are currently swallowed.

## Security Requirements

Describe actual controls: bcrypt, signed expiring JWT, parameterized SQL, selected authentication dependencies, document deletion ownership checks, personal/global collections, and CORS limited to <http://localhost:3000> with credentials enabled and all methods/headers permitted. Backend Pydantic string fields lack server-side password-strength, email-format, nonempty-message, and size constraints; Login adds client-side validation only.

Separate production corrections: uniform object authorization, mandatory secrets, TLS, upload size/type checks, PDF isolation, SSRF prevention with destination and redirect checks, rate limits, global-publication permissions, consent/retention controls, and prompt-injection defenses. Retrieved documents are untrusted yet currently placed in the system prompt. No content moderation, audit ledger, or injection detector exists. Never expose API keys in frontend code, logs, examples, or version control.

## Monitoring Requirements

Preserve basic Python logs and root status endpoint. Web Vitals scaffolding exists but index.tsx calls reportWebVitals without a reporting callback. No metrics exporter, distributed traces, token ledger, cost calculation, quality evaluation, safety dashboard, or business analytics exists. Provide a separately labeled monitoring design for health, trace, quality, safety, cost, and business outcomes, with metric definitions and instrumentation points; never invent measured values.

## Docker/Deployment Requirements

Describe the existing Python 3.10-slim backend on port 8000 and Node 18-alpine build stage followed by Nginx static serving on port 80. Use REACT_APP_API_URL at frontend build time. Nginx has SPA fallback but no API proxy. Compose maps backend 8000 and frontend 3000, loads backend/.env, restarts unless stopped, polls / every 30 seconds, and waits for backend health before frontend startup. The current named volume targets /app/chatbot.db as a directory and is incorrect for SQLite; Chroma has no Compose volume. Root .dockerignore does not govern separate backend/frontend build contexts. Regeneration must explicitly correct persistence and context-specific secret exclusions. No existing CI/CD or hosting configuration exists. Explain single-instance limits and proposed shared storage, release gates, and rollback separately.

## Testing Requirements

Preserve test/ with conftest.py, test_auth.py, test_chat.py, test_conversations.py, and test_rag.py and root pytest.ini. Existing coverage contains 49 test functions, temporary SQLite, mocked Chroma, mocked chat replies, mocked document insertion, and mocked URL extraction. This does not prove real provider or vector integration. Use Python 3.10+ for tests, install pytest and compatible httpx<0.28 for the existing Starlette TestClient, and run python -m pytest test/ -v from the root. Frontend uses Jest/Testing Library via npm test -- --watchAll=false. App.test.tsx retains a stale Learn React assertion; report its failure rather than claiming coverage. Add authorization, ingestion consistency, provider-failure, and live-service integration tests only as explicit regeneration improvements. Run npm run build and report actual results.

## Expected Folder Structure

```text
project/
  backend/
    main_sqlite.py, auth_service.py, chat_service_sqlite.py
    rag_service.py, database_sqlite.py, config_sqlite.py, models.py
    requirements_sqlite.txt, pyproject.toml, poetry.lock
    .env.example, Dockerfile, README.md
  frontend/
    public/index.html
    src/components/, src/styles/
    src/App.tsx, api.ts, types.ts, index.tsx
    src/App.test.tsx, setupTests.ts, reportWebVitals.ts
    package.json, package-lock.json, tsconfig.json
    Dockerfile, nginx.conf, postcss.config.js, README.md
  test/conftest.py, test_auth.py, test_chat.py
  test/test_conversations.py, test_rag.py
  docker-compose.yml, start.sh, pytest.ini, .gitignore, .dockerignore
  readme.md, PROMPT.md, DELIVERABLES.md
  docs/architecture.md, agent-workflow.md, deployment-strategy.md
  docs/security-model.md, monitoring-dashboard.md
```

## Expected Application Behaviour

An unauthenticated browser shows login/registration. A successful login opens the assistant and lists the user's conversations. Sending a first message creates a conversation and saves both messages; subsequent requests include history. Configured retrieval augments the system prompt with available personal/global chunks. File and URL ingestion adds document metadata and vectors; scope determines visibility. Loading indicators cover request waits, and API errors show readable UI messages. Claude errors may currently appear as normal assistant apologies, while retrieval errors permit ungrounded answers. Submit complete source and documentation that explicitly distinguishes demonstrated behavior, known defects, and production proposals.
