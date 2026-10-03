# Prompt to Generate the Application — AgroMitra

**Student:** Deepak R | **Roll No:** 2023103527
**Topic:** Agentic AI crop-loss insurance claim processing for Tamil Nadu farmers

---

## Role
You are a senior enterprise architect and Python engineer. Build a complete, runnable,
tested application called **AgroMitra**, a multi-agent system that processes
crop-loss insurance claims with human-in-the-loop approval.

## Business context
Farmers submit crop-loss claims (drought, flood, pest, hail, cyclone). Manual review is slow
and prone to fraud. AgroMitra automates validation, risk scoring and assessment with
cooperating agents, and routes high-value or high-risk claims to a claims officer.

## Tech stack
Python 3.12, FastAPI, Pydantic v2, pytest, Docker, Kubernetes manifests.
Keep the data layer in-memory behind a small interface so it can be swapped for PostgreSQL.

## Agents (sequential pipeline with explicit states)
1. **Intake Agent**: validates schema and cause of loss, and blocks prompt-injection
   or unsafe text (guardrail). State: `RECEIVED -> VALIDATED`.
2. **Verification Agent**: uses the `land_record_lookup` tool. Rejects unknown farmers or
   claimed acres above the registered acres. Tool calls retry 3 times on timeout.
3. **Risk Agent**: uses the `rainfall_lookup` tool and rule-based scoring (0 to 1). Flags
   amount per acre above the sum insured, 100% loss, drought claimed with normal rainfall,
   and missing notes. State: `RISK_SCORED`.
4. **Assessment Agent**: rejects loss below 33%. Computes
   `payable = min(claim, acres * 40000) * loss% / 100`. State: `ASSESSED`.
5. **Approval Gate**: auto-approves if `risk < 0.5` and `payable <= 50,000`, otherwise
   `PENDING_APPROVAL` for a human officer.

Failure paths: business rejection -> `REJECTED` (with reason); unexpected exception ->
`FAILED` (dead-letter, manual handling). Every step writes an audit event.

## API
- `POST /api/claims`: submit a claim
- `GET /api/claims`, `GET /api/claims/{id}`
- `POST /api/claims/{id}/decision`: officer approve or reject
- `GET /api/metrics`, `GET /metrics` (Prometheus text), `GET /health`
- `GET /`: HTML monitoring dashboard

## Security requirements
API-key auth with RBAC (`submitter`, `officer`, `admin`), PII masking of farmer IDs in
responses, input validation, injection guardrail, secrets only via environment variables,
non-root container, and a full audit trail.

## Monitoring requirements
Track claims, auto-approval, rejection and failure rates, p95 latency, pending human
reviews, guardrail blocks and total payout. Expose them as JSON, Prometheus and a dashboard.

## Deliverables of the code
Folder layout `app/` (main, models, agents, tools, workflow, security, metrics, static
dashboard), `tests/` (pytest covering approval, rejection, guardrail, PII masking, human
approval and RBAC), `Dockerfile`, `docker-compose.yml`, `k8s/deployment.yaml` (Deployment,
Service, HPA, probes), `requirements.txt`, `.env.example`, and `README.md`.
All tests must pass.

## Acceptance criteria
- `pytest` passes; `uvicorn app.main:app` starts; dashboard loads at `/`.
- A 2-acre, 60% drought claim in Coimbatore is auto-approved with payable = 18,000.
- A 10-acre, 90% claim of 300,000 goes to `PENDING_APPROVAL`.
- Injection text such as "ignore previous instructions" is rejected by the guardrail.
