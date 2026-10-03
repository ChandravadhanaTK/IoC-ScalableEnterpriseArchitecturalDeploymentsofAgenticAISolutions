# AI Architecture Reviewer

**AI-Assisted Framework for Automated Software Architecture Assessment and Code Smell Detection**
(final-year academic project)

Accepts a Python 3.12+ repository (GitHub URL or ZIP upload), statically analyzes it
without ever executing its code, reconstructs a candidate architecture, detects
code smells / SOLID heuristic violations / design-pattern candidates / potential
security and performance issues, builds structured evidence, sends only that
evidence to an LLM for contextual interpretation, validates the AI output against
the deterministic evidence, and presents the full review through a web dashboard. Gemini can also generate an architecture illustration from the inferred component graph when requested.

**Deterministic analysis is authoritative. The LLM explains and prioritizes; it
never invents facts, and if it contradicts the deterministic evidence, the
deterministic evidence wins.** The system remains fully functional (with a
`mock` LLM provider) if no AI provider is configured.

## Status

The backend currently supports secure ZIP and public GitHub ingestion followed
by synchronous, deterministic Python static analysis. It does not execute
repository code. The AST parser extracts classes, functions/methods, imports,
calls, inheritance, source lines, and LOC; metrics summarize those structures
and estimate per-function complexity. Analysis builds a NetworkX local-import
graph, reports five configurable code smells and potential SOLID, security,
and performance findings, and generates a directory-grouped inferred
architecture diagram. Analysis results are available through read-only API
endpoints. An optional, evidence-bounded OpenAI review can explain selected
findings; with the safe default provider, analysis completes deterministically
and reports that AI is not configured. The React frontend supports ZIP or
public GitHub input and displays metrics, findings/source excerpts, inferred
architecture, and any available AI recommendations.

## Features (planned across phases - see docs/methodology.md once written)

- Repository ingestion (GitHub URL / ZIP) with no repository code execution
- AST-based Python parsing into a language-independent intermediate representation
- Software metrics (LOC, cyclomatic complexity, coupling, fan-in/out, ...)
- NetworkX dependency graphs at file/module/class level
- Rule-based code smell, SOLID, design-pattern-candidate, security, and
  performance detectors with configurable thresholds
- Graph-based candidate architecture recovery with Mermaid diagram generation
- Evidence-bounded LLM reasoning via a provider-agnostic `LLMProvider` interface
  (`OpenAIProvider` / `AnthropicProvider` / `MockProvider`)
- AI output schema validation against deterministic evidence
- React/TypeScript dashboard for browsing findings, architecture, and metrics
- Downloadable review report

## Technology stack

Backend: Python 3.12+, FastAPI, Pydantic, SQLAlchemy, SQLite, NetworkX, Radon,
Bandit, LibCST. Repository ingestion uses Python's standard HTTPS and ZIP
libraries and does not invoke Git or repository tooling. Optional AI review
uses a small OpenAI Chat Completions request; it is not required for analysis.
Frontend: React, TypeScript, Vite, Tailwind CSS, Lucide icons.
Testing: pytest / pytest-asyncio, Vitest.
Containerization: Docker, Docker Compose.

## Installation

### Backend

Use Python 3.12 or newer.

Windows PowerShell:

```bash
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

### Environment setup

```bash
cp .env.example .env
```

AI is optional. To enable Gemini explanations and architecture image
generation, set `GEMINI_API_KEY` in the repository-level `.env` file.
`GEMINI_MODEL` selects the review model; `GEMINI_IMAGE_MODEL` selects the image
model. The backend reads this same root `.env` whether started from the project
root, `backend/`, or Docker. Reviews send compact analysis evidence and selected
source excerpts. For a public GitHub repository, Gemini also receives its URL
and can inspect that page with URL Context; uploaded ZIP reviews do not fetch
external pages. Repository code is never executed.

## Running the backend

```bash
cd backend
uvicorn app.main:app --reload
```

Health check: `GET http://localhost:8000/api/health`

## Running the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Running tests

```bash
cd backend
pytest -v
```

```bash
cd frontend
npm run test
```

The frontend consumes the backend ingestion and result APIs. AI sections show
an explicit unavailable/configuration state when no provider is configured.

## Running with Docker

```bash
docker compose up --build
```

## Running demo repositories / evaluation

Not yet implemented - see Phase 20 (`evaluation/`) and Phase 43
(`demo_repositories/`) in the development roadmap.

## API documentation

Interactive OpenAPI docs are served by FastAPI at
`http://localhost:8000/docs` once the backend is running.

Analysis endpoints:

- `POST /api/analyze/upload` with multipart form field `file` containing a `.zip`
- `POST /api/analyze` with the same multipart `file` field
- `POST /api/analyze/github` with JSON `{ "url": "https://github.com/owner/repository" }`
- `GET /api/analysis/{analysis_id}` for the complete deterministic result
- `GET /api/analysis/{analysis_id}/summary`
- `GET /api/analysis/{analysis_id}/status`
- `GET /api/analysis/{analysis_id}/metrics`
- `GET /api/analysis/{analysis_id}/dependencies`
- `GET /api/analysis/{analysis_id}/findings`
- `GET /api/analysis/{analysis_id}/findings/{finding_id}`
- `GET /api/analysis/{analysis_id}/architecture`
- `GET /api/analysis/{analysis_id}/ai-review`
- `POST /api/analysis/{analysis_id}/ai-review` to trigger a Gemini review
- `POST /api/analysis/{analysis_id}/architecture-image` to generate a Gemini image
- `GET /api/analysis/{analysis_id}/report` for a downloadable Markdown report

POST endpoints run static analysis synchronously and return HTTP 200 with the
analysis ID and ingestion summary. Results and temporary workspaces are held in
process memory and are lost on restart; this is a V1 development limitation.
GitHub ingestion supports public repositories only.

Initial smell thresholds are configured through `LONG_METHOD_LINES`,
`LARGE_CLASS_METHODS`, `LONG_PARAMETER_COUNT`, and `HIGH_FAN_OUT`; these are
heuristic defaults, not universal quality standards. The dependency graph
contains imports resolved to files in the analyzed repository only. The
architecture view is labeled inferred and groups files by their first
directory; it does not claim to represent the repository's intended design.

## Limitations (V1)

- Supports Python only; no Java/JS/C++ parsing yet
- Static analysis only - no repository code is ever executed, so dynamic
  runtime behavior is not analyzed
- Architecture recovery produces an **inferred** candidate architecture, not
  a verified ground truth
- SOLID and design-pattern detection are heuristic; findings are labeled
  "potential" / "candidate" and require developer validation
- Security and performance findings are static indicators, not proof of
  exploitability or actual runtime cost
- Reflection/metaprogramming-heavy code may reduce detection accuracy
- Third-party dependencies are not deeply analyzed

## Future work

Additional language parser adapters, Celery/Redis for async jobs, CI/CD and
pull-request integration, RAG/fine-tuned models, ML-based smell detection,
continuous repository monitoring. See `docs/` for the full roadmap.

## Screenshots

_(added once the dashboard exists - Phase 18 onward)_
