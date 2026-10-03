# Northstar — Enterprise IT Support Agentic Assistant

**Capstone submission:** R. Harsanth · Roll No. 2023103565

Northstar is a local-first educational prototype that demonstrates an agentic IT support workflow: planning, knowledge retrieval, simulated diagnostics, policy gating, human approval, response generation, audit events, and a monitoring dashboard.

> **Important:** This is a safe demo. It does not connect to real employee accounts, devices, ticketing systems, email, or enterprise infrastructure. Tool results are simulated. Approval decisions are recorded but do not execute an IT change.

## Features
- Chat UI with sample IT requests and expandable agent trace.
- Specialist workflow roles: Planner, Knowledge, Diagnostics, Policy, Response.
- Local Markdown knowledge base; no API key or external vector database required.
- Human approval queue for password resets, account unlocks, software installation, and configuration changes.
- Monitoring metrics and audit event viewer.
- FastAPI endpoints, input validation, safety checks, and automated tests.

## Run with Docker (recommended)
1. Install Docker Desktop and start it.
2. In this folder, copy `.env.example` to `.env`.
3. Run:
   ```bash
   docker compose up --build
   ```
4. Open http://localhost:8000
5. Stop with `Ctrl+C`; optionally run `docker compose down`.

## Run locally (Windows PowerShell)
```powershell
cd application
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
$env:PYTHONPATH = "backend"
python -m uvicorn app.main:app --reload --app-dir backend
```
Open http://127.0.0.1:8000.

## Run locally (macOS/Linux)
```bash
cd application
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
PYTHONPATH=backend python -m uvicorn app.main:app --reload --app-dir backend
```

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health and uptime |
| POST | `/api/chat` | Run the agent workflow; body: `{"message":"My Wi-Fi is down","role":"employee"}` |
| GET | `/api/approvals` | List approval requests |
| POST | `/api/approvals/{id}/decision` | Approve/reject a pending request |
| GET | `/api/audit?limit=30` | Recent audit events |
| GET | `/api/metrics` | Operational counters and recent runs |
| GET | `/docs` | Interactive OpenAPI documentation |

## Test
```bash
pip install pytest
PYTHONPATH=backend pytest -q
```

## Demo walkthrough
1. Ask: “My Wi-Fi cannot connect on my laptop.” Inspect the Planner, Knowledge, Diagnostics, Policy, and Response trace.
2. Ask: “I cannot connect to the company VPN.” Review local knowledge retrieval.
3. Ask: “Please reset my password.” Open **Approvals** and approve or reject the pending item. The UI clearly states that no real change occurs.
4. Open **Monitoring** to inspect counters, recent runs, and audit events.
5. Ask for credential theft or security bypass; the policy gate blocks the request.

## Architecture and design documentation
See the sibling `../deliverables.md` for the architecture diagram, workflow states and handoffs, deployment strategy, security model, and monitoring dashboard design.

## Production hardening roadmap
- Integrate enterprise OIDC/SAML and enforce server-side RBAC.
- Persist requests, approvals, and audit events in PostgreSQL.
- Add a vector store and governed document ingestion if the knowledge corpus grows.
- Put real tools behind isolated services, allowlists, least-privilege identities, timeouts, idempotency, and approval policies.
- Add rate limiting, TLS, secure headers, log redaction, retention controls, dependency scanning, and CI/CD.
- Add model-provider integration only behind a policy-enforcing orchestration layer; retrieved content must remain untrusted data.
