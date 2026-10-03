# Project Documentation

## Purpose and scope

Agent Researcher combines conversation, web research, PDF retrieval, and durable project memory in a local application. Prompts and much of the interface use Spanish; synthesis explicitly requests Spanish answers with citations. This documentation describes checked-in behavior, without claiming provider calls or startup were tested.

## Component inventory

| File or directory | Responsibility |
|---|---|
| `agente_langgraph/api.py` | FastAPI lifespan, routes, SSE serialization, document downloads |
| `agente_langgraph/agente.py` | Planner, fan-out, synthesis, memory selection, graph compilation |
| `agente_langgraph/worker.py` | Worker subgraph, iteration limit, findings/source collection |
| `agente_langgraph/state.py` | Parent state, worker state, worker result types |
| `agente_langgraph/local_tools.py` | Search, HTML extraction, PDF download/index/cache, semantic PDF retrieval |
| `agente_langgraph/mcp_client.py` | MCP subprocess lifecycle and async tool wrappers |
| `agente_langgraph/projects.py` | JSON-backed project listing, creation, deletion |
| `agente_langgraph/chats.py` | SQLite-backed chat metadata listing, creation, deletion |
| `agente_langgraph/__init__.py` | Package marker |
| `mcp_hechos/server.py` | Four MCP tools over stdio, using LanceDB and OpenAI embeddings |
| `front_agente/src/App.tsx` | Projects, chats, history, streaming, memory/docs/chunk views |
| `front_agente/src/main.tsx` | React root and StrictMode initialization |
| `front_agente/src/index.css` | Dark theme, layout, Markdown and panel styles |
| `front_agente/index.html` | Browser entry, font loading, title, root element |
| `front_agente/vite.config.ts` | Vite React plugin; no API proxy configured |
| `front_agente/tsconfig*.json`, `eslint.config.js` | TypeScript project references and lint configuration |
| `front_agente/public/`, `src/assets/` | Starter SVG assets |
| `pyproject.toml`, `uv.lock` | Complete Python dependency definition and resolved versions |
| Component `requirements.txt` files | Partial dependency lists, not a complete application installation |

The checkout contains project metadata, a PDF cache, downloaded PDFs, LanceDB data, and SQLite WAL/SHM artifacts. These are existing runtime artifacts rather than empty installation templates. WAL/SHM files alone do not establish that a complete portable checkpoint database is present.

## User interface

On mount, the interface loads projects and selects the first returned project. Selecting a project loads its chats newest first. Selecting a chat restores visible messages. If no chat exists, the first message creates one named from the first 40 characters of the message.

| Tab | Behavior |
|---|---|
| CHAT | Markdown/GFM answers, plan angles, worker completion, streamed synthesis |
| MEMORY | Facts newest first, client pagination in groups of 12 |
| DOCS | Documents inferred from project chunks, links for available downloads |
| CHUNKS | Text, source URL, page, chunk index; client pagination and full-text modal |

Enter sends; Shift+Enter adds a newline. The interface supports project creation and chat creation/deletion. Project deletion is available through the API, not the current interface. History restoration returns text rather than prior live progress metadata.

Every browser API URL is hardcoded to `http://localhost:8000`; no frontend environment variable changes it.

## HTTP API

Bodies use JSON except SSE and file responses. FastAPI supplies `/docs` and `/openapi.json`.

| Method | Route | Input | Output |
|---|---|---|---|
| GET | `/api/projects` | None | `projects` list |
| POST | `/api/projects` | `name` | Project record |
| DELETE | `/api/projects/{project_id}` | Path ID | `ok: true`, or 404 |
| GET | `/api/projects/{project_id}/chats` | Path ID | `chats` list |
| POST | `/api/projects/{project_id}/chats` | `name` | Chat record |
| DELETE | `/api/chats/{chat_id}` | Path ID | `ok: true`, or 404 |
| GET | `/api/chats/{chat_id}/messages` | Required `project_id` query | `messages` list with `role` and `content` |
| POST | `/api/chat` | Chat request | `response`, `history`, `workers` |
| POST | `/api/chat/stream` | Chat request | `text/event-stream` |
| GET | `/api/hechos` | `project_id`, default `default` | `hechos` list |
| GET | `/api/pdf-chunks` | `project_id`, default `default` | `chunks` list |
| GET | `/api/documents` | `project_id`, default `default` | `documents` list |
| GET | `/api/documents/download/{filename}` | Filename | PDF file, or 404 |

List outputs are JSON objects wrapping the named list. A chat request requires `message` and `project_id`; `chat_id` is optional:

```json
{
  "message": "Investiga los usos de IA en educación y cita fuentes.",
  "project_id": "<project-id>",
  "chat_id": "<chat-id>"
}
```

The checkpoint `thread_id` is `chat_id` when supplied, otherwise `project_id`. Supply separate chat IDs for separate conversations. The API does not verify project/chat existence or whether a chat belongs to the supplied project. Restored message roles are `user` and `agent`.

`/api/chat` returns final text, parent-graph messages after the latest user message, and current-turn worker findings/sources. Its `history` is not a complete nested-worker tool log. Tool history is stored in graph results but omitted from the endpoint's `workers` response. Ordinary chat failures become HTTP 500; established SSE execution failures become `error` events. There is no dedicated health route.

See [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md#streaming-contract) for event fields and ordering.

## Persistence and data contracts

| Store | Location and fields |
|---|---|
| Projects | Root `projects.json`: `id`, `name`, `created_at` |
| Chat metadata | `chats` table in `agente_langgraph/checkpoints.db`: `id`, `project_id`, `name`, `created_at` |
| Graph history/state | LangGraph-managed tables in the same SQLite database |
| Facts | `hechos` in `mcp_hechos/hechos_lancedb/` |
| PDF chunks | `pdf_chunks` in the same LanceDB directory |
| PDF cache | `agente_langgraph/pdf_index.json`, keyed only by URL |
| Downloads | `papers/` relative to backend working directory; expected under `agente_langgraph/` |

Project/chat IDs are the first 12 hex characters of a UUID. Timestamps are local server time strings in `YYYY-MM-DD HH:MM:SS`, without a timezone.

| LanceDB table | Fields |
|---|---|
| `hechos` | `texto`, `vector`, `fecha`, `project_id` |
| `pdf_chunks` | `texto`, `vector`, `source_url`, `page`, `chunk_index`, `fecha`, `project_id` |

Embeddings use `text-embedding-3-small` without a custom dimension request; the expected default length is 1536. PDF pages start at 1, chunk indices at 0. Chunking targets roughly 3200 characters at paragraph boundaries, so a long paragraph can exceed the target.

URL cache values contain `title`, `file_path`, `chunks`, and `structural_map`; they have no project ID. API fact IDs are calculated from the current listing, not stable database keys. Knowledge routes omit vectors. Document records contain `filename`, `source_url`, `chunks`, and `downloaded`.

## External integrations

- OpenAI: planning, worker decisions, synthesis, memory selection, HTML summaries, embeddings.
- Tavily: advanced search from the worker tool.
- Source websites: HTTPX PDF downloads and Trafilatura HTML extraction.
- MCP: a backend-spawned Python process over stdio; no separate TCP service.

See [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md#models) for source-defined model identifiers and [SETUP_GUIDE.md](SETUP_GUIDE.md) for credentials.

## Known implementation limits

- CORS permits all origins, methods, and headers. Authentication, authorization, ownership checks, and rate limiting are absent.
- Project filters are not access control. Checkpoints are keyed by thread ID; document downloads have no project ownership check.
- URL-only PDF caching can skip indexing for a second project, although retrieval filters by project. Cached maps/files are not checked for continued existence or consistency.
- URL basenames can collide as filenames. PDF cache writes and project JSON updates have no application-level concurrency lock.
- Project deletion removes only JSON metadata; chat deletion removes only the chat row. Checkpoints, vectors, cache entries, and files are not purged.
- Facts are append-only with no deduplication or update/delete API. Memory failures are swallowed, so successful answers do not confirm storage.
- Knowledge routes load table rows before filtering and return complete lists. Pagination is client-side. Conversation state and worker results have no pruning policy.
- Several synchronous provider/database operations run during graph processing. Worker fan-out does not establish measured throughput or latency guarantees.
- Structured source collection recognizes only `[Source: https://...]` in final worker text. This format is not enforced; citations are not separately validated.
- No automated test suite, CI, containers, or deployment configuration was found. Frontend build/lint scripts exist; their success must be checked in the target environment.

## Maintenance

Use root dependency definitions and lockfiles. Keep route tables, graph diagrams, agent contracts, and setup commands synchronized with source changes. Manual verification should cover project/chat creation, direct and researched turns, history restoration, shared project memory, and PDF indexing/downloads. These checks create data and incur provider usage; they were not run for this documentation-only update.
