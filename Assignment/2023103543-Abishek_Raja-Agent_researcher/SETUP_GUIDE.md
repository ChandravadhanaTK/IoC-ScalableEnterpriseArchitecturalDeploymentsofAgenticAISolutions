# Setup Guide

## Prerequisites

| Requirement | Repository evidence |
|---|---|
| Python 3.14+ | `pyproject.toml` requires `>=3.14`; `.python-version` selects `3.14` |
| uv, or Python with pip/venv | Root dependencies are declared in `pyproject.toml`, locked in `uv.lock` |
| Node.js 22.12+, or 20.19+ on the 20.x branch, with npm | Locked Vite engine range is `^20.19.0 || >=22.12.0` |
| OpenAI API credentials | Backend models and MCP embeddings require them |
| Tavily API credentials | Worker web search requires them |
| Network access | Package installation, provider calls, web extraction, PDF downloads |

Commands use PowerShell and start from the repository root. They describe installation; dependency installation and provider smoke tests were not executed for this documentation update.

## 1. Install Python dependencies

Preferred lockfile-based installation:

```powershell
uv sync --locked
```

This creates or uses the root `.venv`. Root dependencies cover FastAPI, LangGraph SQLite checkpoints, MCP, LanceDB, OpenAI, Tavily, HTTPX, Trafilatura, and PDF parsing. Component `requirements.txt` files are partial and do not install the complete application.

For pip instead, ensure `python` resolves to Python 3.14+:

```powershell
python --version
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install .
```

This installs from `pyproject.toml`, without reproducing uv's exact locked resolution.

## 2. Configure credentials

If `agente_langgraph/.env` does not already exist:

```powershell
Copy-Item agente_langgraph/.env.example agente_langgraph/.env
```

Edit the copied file:

```dotenv
OPENAI_API_KEY="your-openai-api-key"
TAVILY_API_KEY="your-tavily-api-key"
```

Do not overwrite existing credentials. Agent modules use `load_dotenv()`; the MCP server explicitly loads the backend `.env`. Existing process environment values take precedence under default dotenv behavior. Git ignores `.env`.

There are no implemented environment variables selecting models, storage paths, or the frontend API origin. Provider access must cover the identifiers in [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md#models).

## 3. Install frontend dependencies

From the root:

```powershell
Set-Location front_agente
npm ci
Set-Location ..
```

`npm ci` installs from the existing lockfile without updating it.

## 4. Start the backend

From the root, in one terminal:

```powershell
Set-Location agente_langgraph
uv run --locked uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

For the pip environment, use this instead from `agente_langgraph/`:

```powershell
..\.venv\Scripts\python.exe -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

Keep this working directory. Source imports sibling modules such as `agente` and `state`, and writes downloads to relative `papers/`. The API expects files under `agente_langgraph/papers/`. Starting elsewhere can break imports or misplace downloads.

Startup opens SQLite checkpoints, compiles the graph, and automatically starts MCP. No separate MCP launch is needed for browser use. Missing OpenAI credentials or failed MCP initialization can prevent startup.

## 5. Start the frontend

In another terminal, from the root:

```powershell
Set-Location front_agente
npm run dev
```

Open the URL printed by Vite. Browser requests are hardcoded to `http://localhost:8000`, so keep the backend on that port. Accessing the frontend from another computer makes `localhost` refer to that computer; remote hosting is not configured.

## 6. Verify operation

Read-only API checks:

```powershell
Invoke-RestMethod http://localhost:8000/api/projects
Invoke-RestMethod http://localhost:8000/openapi.json
```

Open `http://localhost:8000/docs` for schemas. There is no `/health` route.

Create/select a project in the interface and send a greeting. Then ask a new research question and check plan progress, worker completion, and answer text. Reload and select the same chat to inspect restored history. See [manual scenarios](AGENT_WORKFLOW.md#manual-scenarios) for memory/PDF checks.

Interactive checks create local records and can incur provider usage. The checkout includes existing project, PDF, and vector artifacts, so lists may already contain data.

### API chat example

Replace the project ID with one from `/api/projects`, then create a chat and send a turn:

```powershell
$researchProjectId = "<project-id>"
$researchChat = Invoke-RestMethod `
  -Uri "http://localhost:8000/api/projects/$researchProjectId/chats" `
  -Method Post -ContentType "application/json" `
  -Body (@{ name = "Setup check" } | ConvertTo-Json)

$researchBody = @{
  message = "Hola"
  project_id = $researchProjectId
  chat_id = $researchChat.id
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/chat" `
  -Method Post -ContentType "application/json" -Body $researchBody
```

`/api/chat/stream` accepts the same JSON but responds with SSE rather than a single JSON object.

## Frontend checks and preview

From `front_agente/`:

```powershell
npm run build
npm run lint
```

Build runs TypeScript compilation followed by Vite bundling. Lint runs ESLint. There is no frontend test script or discovered backend test suite. Existing source issues may cause failures; these commands must be run to establish their status.

After a successful build:

```powershell
npm run preview
```

Preview serves the frontend locally and still requires the separately running backend at port 8000. It is not a production deployment procedure.

## Optional standalone MCP

An MCP client can launch the root environment's Python interpreter with the absolute path to `mcp_hechos/server.py`. Direct launch from the root:

```powershell
uv run --locked python mcp_hechos/server.py
```

It waits for MCP messages on stdin/stdout and has no HTTP interface. It loads the backend `.env` and uses the same LanceDB directory as the application.

## Troubleshooting

| Symptom | Check |
|---|---|
| Missing `agente` or `state` module | Run `uvicorn api:app` from `agente_langgraph/` in the root environment |
| Missing OpenAI key/MCP startup failure | Check `.env` path, credentials, process environment precedence, backend stderr |
| Model access error | Check provider access to the hardcoded model names in the workflow guide |
| Missing checkpoint/research dependency | Install the complete root dependency set |
| Unsupported Node error | Compare `node --version` with the locked engine range above |
| No projects/backend connection error | Check startup, port 8000, and browser Network panel; some fetch failures are suppressed |
| DOCS says download unavailable | Check working directory and file under `agente_langgraph/papers/` |
| Cached PDF has no results in another project | Cache is global by URL; inspect project-scoped chunks and cache consistency |
| Website/PDF research fails | Check source availability, credentials, parsing, extracted content; remote error pages can be indexed |
| MEMORY stays empty | Selection may choose no facts, or selection/storage may silently fail |
| Data remains after deletion | Project/chat deletion removes metadata only, without cascading to stored content |

## Shutdown and local data

Stop both services with Ctrl+C. FastAPI closes its MCP and checkpoint contexts. Stop writers before backing up and preserve related stores together as described in [ARCHITECTURE.md](ARCHITECTURE.md#persistence-boundaries).

There is no comprehensive reset/data deletion command. Existing SQLite sidecars, LanceDB files, and cache records are not clean-install templates. Review [implementation limits](PROJECT_DOCUMENTATION.md#known-implementation-limits) before adapting the application for shared hosting.
