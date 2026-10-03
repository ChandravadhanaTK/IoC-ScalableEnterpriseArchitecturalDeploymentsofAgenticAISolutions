# ResolveAI — Multi-Agent Customer Support & Resolution Assistant

**Student:** Santhosh K

**Roll number:** 2023103552

ResolveAI is a demonstrable enterprise support application. It routes a customer complaint through a controlled multi-agent workflow, retrieves mock order and policy data, checks eligibility, proposes an action, and requires a human approver before a replacement or refund can be finalised.

## Live Demo

The application is deployed and accessible at: **[https://resolveai-2023103552-santhosh-k.onrender.com](https://resolveai-2023103552-santhosh-k.onrender.com)**

## What is included

- `application_prompt.md` — reusable implementation prompt.
- `architecture_deliverables.md` — the five required capstone deliverables.
- `docs/` — detailed architecture, workflow, deployment, security, and monitoring notes.
- `backend/` — FastAPI API, policy-aware agent workflow, JWT/RBAC enforcement, audit records, and tests.
- `frontend/` — React/Vite customer-support and staff-approval dashboard.
- `docker-compose.yml` — one-command local stack with PostgreSQL.

## Quick start

### Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:5173`. The API documentation is at `http://localhost:8000/docs`.

### Local development

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Demo accounts and scenario

| Account | Password | Role | Use |
|---|---|---|---|
| `customer@resolveai.demo` | `DemoPass!23` | customer | Submit a damaged-laptop request |
| `agent@resolveai.demo` | `DemoPass!23` | support_agent | Review ticket data |
| `manager@resolveai.demo` | `DemoPass!23` | approver | Approve/reject a proposed replacement |

When creating a ticket, use order `ORD-1001` and the message: “My laptop arrived with a damaged screen. I want a replacement.” The workflow proposes a replacement but stays `PENDING_APPROVAL` until the manager approves it.

## API overview

- `POST /api/auth/login` — issues a JWT for a demo account.
- `POST /api/tickets` — validates and executes the bounded agent workflow.
- `GET /api/tickets` — returns tickets visible to the authenticated role.
- `POST /api/tickets/{ticket_id}/approval` — performs a human approval action (approver only).
- `GET /api/dashboard` — operational metrics and agent trace summary.
- `GET /api/health` — liveness/readiness-style health output.

The app deliberately keeps the order and policy tool calls deterministic. `Gemini` integration is configured through environment variables and can be added at the response-generation boundary without allowing an LLM to invoke sensitive tools or approve actions.

## Verification

```bash
cd backend
pytest ../tests -q
```

## Important safety properties

- Customer requests are validated before reaching agents.
- Prompt-injection-like text and unsupported sensitive actions are escalated.
- Agents have separate responsibilities and cannot approve a replacement themselves.
- JWT identity plus role-based authorization protects staff actions.
- Ticket decisions, tool outcomes, and approvals are retained in an audit trail.
- Every workflow has a maximum number of steps; tool results are bounded and deterministic.
