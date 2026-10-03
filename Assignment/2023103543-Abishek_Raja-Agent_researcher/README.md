# Agent Researcher

Agent Researcher is a local research assistant built with React, FastAPI, LangGraph, and LanceDB. It plans research questions, dispatches parallel workers with web and PDF tools, and synthesizes findings into a Spanish response with citations. It persists chat history and selected project facts for later conversations.

## Features

- Projects with multiple named chats and restored conversation history.
- A planner that answers from history or project memory, or requests new research.
- Research workers with Tavily search, web extraction, PDF indexing, and PDF retrieval.
- Server-Sent Events (SSE) for research progress and streamed synthesis text.
- Project memory, document listings/downloads, and browsable PDF chunks.
- A separate MCP server exposing fact storage and retrieval tools over stdio.

The current graph reads and writes memory directly through LanceDB. Its workers use local tools; the backend initializes an MCP connection, but the MCP wrappers are not bound to the worker model.

## Quick start

Requirements: Python 3.14+, uv, Node.js 22.12+ with npm, and OpenAI and Tavily credentials. The locked Vite dependency also supports Node.js 20.19+ on the 20.x branch.

From the repository root:

```powershell
uv sync --locked
Copy-Item agente_langgraph/.env.example agente_langgraph/.env
```

Set `OPENAI_API_KEY` and `TAVILY_API_KEY` in the copied file. Do not overwrite an existing `.env`.

Start the backend from its own directory so imports and PDF paths resolve correctly:

```powershell
Set-Location agente_langgraph
uv run --locked uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

In another terminal, from the repository root:

```powershell
Set-Location front_agente
npm ci
npm run dev
```

Open the URL printed by Vite, create or select a project, and send a message. API documentation is available at `http://localhost:8000/docs`. See [SETUP_GUIDE.md](SETUP_GUIDE.md) for verification, troubleshooting, and the pip alternative.

## Repository map

| Path | Purpose |
|---|---|
| `agente_langgraph/` | API, graph, worker graph, tools, projects, and chat persistence |
| `mcp_hechos/` | MCP server and shared embedded LanceDB storage |
| `front_agente/` | React 19 and TypeScript interface, Vite configuration, styling |
| `projects.json` | Project metadata |
| `pyproject.toml`, `uv.lock`, `.python-version` | Python dependency definition, lockfile, interpreter selection |
| `front_agente/package.json`, `package-lock.json` | Frontend scripts and dependency lockfile |

## Documentation

- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md): components, API contracts, storage, and implementation limits.
- [ARCHITECTURE.md](ARCHITECTURE.md): runtime boundaries, data flow, and persistence design.
- [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md): planning, worker loops, synthesis, memory, and streaming.
- [SETUP_GUIDE.md](SETUP_GUIDE.md): installation and local operation.
- [README-no-tecnico.md](README-no-tecnico.md): existing Spanish introduction for nontechnical readers.
- [Frontend design specification](front_agente/DESIGN_SPEC.md): visual design reference.

The detailed root guides describe the inspected implementation. Existing component READMEs contain educational material and some older startup instructions.

## Current scope

No automated test suite, CI configuration, container configuration, or production deployment setup was found. Authentication and authorization are absent. Project filters organize records but do not enforce access control. The PDF cache is shared by URL across projects. Project/chat deletion does not erase all associated data; see the detailed guides.

No license file was found. A license grant cannot be established from the previous README badge alone.

# 🚀 Deployment Information: PatchCraft AI

### 🌐 Live Application URL
**Deployment Link:** [https://drive.google.com/drive/folders/1kLN23iBnsJkS1JIgCR7sk78pZpmrMTp3?usp=sharing](https://drive.google.com/drive/folders/1kLN23iBnsJkS1JIgCR7sk78pZpmrMTp3?usp=sharing)


