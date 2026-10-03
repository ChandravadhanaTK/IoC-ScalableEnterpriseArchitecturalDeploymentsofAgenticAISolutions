# Prompt: Generate "HelpdeskAI" – a Secure Multi-Agent IT Service Desk

You are a senior engineer. Build a complete, runnable project called **HelpdeskAI**.

## Goal
An enterprise IT helpdesk where employees send natural-language requests and a small team of agents triages, resolves, or escalates them, with human approval for risky actions.

## Stack
Python 3.11, FastAPI, Pydantic, Uvicorn, pytest, Docker. No external LLM key required: use a deterministic rule-based classifier behind a `classify()` interface so an LLM can be swapped in later.

## Agents and states
- **TriageAgent**: classifies intent (`how_to`, `password_reset`, `incident`, `unknown`).
- **ResolverAgent**: tools `kb_search`, `create_ticket`, `reset_password`.
- **ApprovalGate**: `reset_password` needs approval from a user with role `it_admin`.
- **Escalation**: on unknown intent or repeated tool failure, hand off to a human.
- States: `RECEIVED -> TRIAGED -> (RESOLVED | AWAITING_APPROVAL -> DONE/REJECTED | ESCALATED)`.

## API
- `POST /chat` (auth: `X-API-Key`) body `{ "message": str }`
- `POST /approvals/{id}/decide` (role `it_admin` only) body `{ "approve": bool }`
- `GET /metrics` (it_admin), `GET /audit` (it_admin), `GET /health`

## Security requirements
API-key identity mapped to roles (RBAC), keys from environment variables, PII redaction (emails, phone numbers) before processing/logging, prompt-injection detection that blocks the request, append-only JSONL audit log, least-privilege tool access.

## Reliability and monitoring
Tool calls retry twice with fallback to escalation. Track request count, outcomes by state, p50/p95 latency, blocked requests, escalations, and estimated cost per request. Expose via `/metrics`.

## Deliverables
`src/` with `app/` (main, agents, tools, security, monitoring), `tests/`, `requirements.txt`, `Dockerfile`, and a `README.md` with run instructions and curl examples. Include unit tests for triage, injection blocking, RBAC, and the approval flow.
