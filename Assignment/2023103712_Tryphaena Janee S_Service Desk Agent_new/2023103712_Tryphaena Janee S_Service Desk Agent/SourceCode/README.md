# IT Service Desk Agent

An enterprise **agentic AI assistant** for IT support. It triages employee requests, answers from the knowledge base, runs safe actions automatically, sends high-risk actions to a human for approval, and escalates to the right team with a complete handoff package. Every step is traced, measured and audited.

Capstone for **Scalable Enterprise Architectural Deployments of Agentic AI Solutions**.

**Live demo:** https://service-desk-agent.netlify.app (runs the agent workflow in your browser on the rules model; sign in as any demo persona)

| Deliverable | Where |
|---|---|
| Prompt to generate the application | [`PROMPT.md`](PROMPT.md) |
| Capstone deliverables (architecture, workflow, deployment, security, monitoring) | [`docs/DELIVERABLES.md`](docs/DELIVERABLES.md) · [`docs/DELIVERABLES.docx`](docs/DELIVERABLES.docx) |
| Application source | `backend/` (FastAPI + agents) · `frontend/` (React) · `k8s/` `deploy/` `.github/` |
| Backend-free demo (single HTML file) | [`demo/service-desk-agent-demo.html`](demo/service-desk-agent-demo.html) |

## What it does

```
Employee message
  → Guardrail Agent    blocks prompt injection, redacts PII and secrets
  → Triage Agent       LLM: category, intent, priority, confidence
  → Knowledge Agent    KB search (BM25) + live service status
  → Resolver Agent     answer · run tools · deny by policy · escalate
  → Approval Gate      high-risk action? create approval and pause
  → Executor Agent     unlock account, password-reset link, assign software (with retries)
  → Escalation Agent   ServiceNow incident + handoff package
  → Responder Agent    grounded reply with [KB-xxxx] citations, output guardrail
```

## Quick start

### Option 1: Run locally (Python 3.12 + Node 22)

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                    # optional: add ANTHROPIC_API_KEY
SEED_DEMO_DATA=true uvicorn app.main:app --reload --port 8000

# frontend (second terminal)
cd frontend
npm install
npm run dev                                             # http://localhost:5173
```

API docs: http://localhost:8000/api/docs. Without an API key the app uses the built-in rules model, so it runs fully offline.

### Option 2: Docker Compose

```bash
cp backend/.env.example backend/.env
docker compose up --build                               # UI http://localhost:8080
docker compose --profile observability up -d            # + Prometheus :9090, Grafana :3000
```

### Option 3: Deploy to the cloud (Render, about 10 minutes)

1. Push this folder to a GitHub repository.
2. In Render, choose **New → Blueprint**, pick the repo, and Render reads `render.yaml`.
3. Optionally set `ANTHROPIC_API_KEY` in the service's environment. Leave it empty to run on the rules model.
4. Open `https://<your-service>.onrender.com` and sign in with a demo persona.

The root `Dockerfile` builds UI + API into one container, so the same image runs on Railway, Fly.io, Google Cloud Run, Azure Container Apps or any VM (`docker build -t sd . && docker run -p 8000:8000 sd`).

### Option 4: Kubernetes

```bash
kubectl apply -f k8s/            # edit image names, host, and create real secrets first
```

### Backend-free demo

Open `demo/service-desk-agent-demo.html` in any browser, or host it on GitHub Pages or Netlify. It runs the same workflow in the browser on the rules model. Rebuild it with `cd frontend && npm run build:demo && cd .. && python scripts/build_demo_page.py`.

## Demo personas

| User | Role | Try |
|---|---|---|
| alice | employee | "I'm locked out", "VPN won't connect", "Please install Tableau" |
| bob | employee | "I clicked a link in a suspicious email", "Please install uTorrent" |
| tina | technician | Tickets (handoff packages), traces, Monitoring |
| maya | approver | Approvals queue: approve or reject Alice's Tableau request |
| admin | admin | Everything, plus the Audit log with hash-chain verification |

**5-minute walkthrough:** see Appendix A of [`docs/DELIVERABLES.md`](docs/DELIVERABLES.md).

## Tests

```bash
cd backend
python -m unittest discover -s tests -v     # or: pip install -r requirements-dev.txt && pytest
ruff check app tests
```

32 offline tests cover every workflow path: auto-resolution, approvals (approve, reject, double-decide, separation of duties), escalations (security, low confidence, follow-up, tool failure), guardrails, RBAC, tracing, the dashboard, audit tamper detection, LLM fallback and output clamping.

## Configuration

All settings are environment variables with safe defaults. See [`backend/.env.example`](backend/.env.example) and `backend/app/config.py`. In production (`APP_ENV=production`) the API **refuses to start** when the JWT secret is weak, demo login is enabled, or CORS is `*`.

| Variable | Default | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `auto` | `auto` uses Claude when `ANTHROPIC_API_KEY` is set, otherwise the rules model |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | Model ID |
| `JWT_SECRET` | dev value | Token signing key (64 random chars in production) |
| `DEMO_LOGIN_ENABLED` | `true` | Persona login; replace with SSO in production |
| `DB_PATH` | `./data/servicedesk.db` | SQLite file (Postgres for scale-out) |
| `SEED_DEMO_DATA` | `false` | Populate a day of realistic traffic on first start |
| `RATE_LIMIT_PER_MINUTE` | `30` | Per-user POST limit |

## Project structure

```
backend/app/
  agents/      graph.py (state-graph engine) · nodes.py (8 agents)
  tools/       registry.py (risk/approval/scope) · integrations.py · kb.py
  security/    auth.py (JWT + RBAC) · guardrails.py (injection, PII, output)
  monitoring/  metrics.py (Prometheus) · tracing.py · dashboard.py
  service.py   use cases (framework-independent) · main.py (FastAPI) · db.py
frontend/src/  App · pages (Chat, Approvals, Tickets, Monitoring, Audit) · demo/engine.js
deploy/        Prometheus config + alert rules, Grafana dashboard
k8s/           namespace, config, backend, frontend (HPA/PDB), ingress, network policies
```

## Production notes

The integrations (Entra ID/Okta, ServiceNow, Intune, status page) are simulated adapters with production-shaped interfaces in `backend/app/tools/integrations.py`. Replace each class with a real client. For horizontal scale, move the store to Postgres and the rate limiter and circuit-breaker state to Redis, as described in section 3 of the deliverables document.
