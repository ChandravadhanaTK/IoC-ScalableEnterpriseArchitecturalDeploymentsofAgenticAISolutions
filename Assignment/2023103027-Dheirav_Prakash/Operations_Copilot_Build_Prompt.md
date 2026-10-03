# Build Prompt: Enterprise AI Operations Copilot

Roll number 2023103027, Dheirav Prakash. Take-home assignments for Weeks 1 and 2.

This is a complete, ready to use prompt for rebuilding the application in `opscopilot/` from scratch. It follows the same shape as the course's Fitness Application and Provider Contract Intelligence prompts: numbered requirement blocks that a coding agent can execute without further clarification. The application it describes is built and runs; the prompt was written from the working code rather than the other way round.

The one project covers every take-home option:

| Assignment | Option | Where it lives |
|---|---|---|
| Week 1 | Agentic RAG on a 0-dollar AI stack | Stage A, `opscopilot/agents/rag_agent.py` |
| Week 2 | A: Agentic RAG with one typed tool and citations | Stage A |
| Week 2 | B: Multi-agent workflow with supervisor, specialist workers and approval | Stage B, `opscopilot/agents/supervisor.py` |
| Week 2 | C: Enterprise integration using one database, one API and one event | Stage C, `opscopilot/integration/` |
| Week 2 | D: Docker and Kubernetes deployment with health checks, scaling and telemetry | Stage D, `deploy/`, `opscopilot/api.py`, `opscopilot/worker.py` |

---

## Build the Enterprise AI Operations Copilot

### 1. Tech Stack (all free, all local)

- Language: Python 3.12 in a virtualenv. No system packages.
- Models: Ollama on the host. Chat model `qwen2.5:7b`, embedding model `nomic-embed-text`. Both run on an 8 GB laptop GPU. No API keys anywhere in the system.
- Agent framework: LangGraph with a SQLite checkpointer (`langgraph-checkpoint-sqlite`) so a paused workflow survives a process restart.
- Retrieval: Chroma for dense vectors plus `rank-bm25` for lexical search, fused with reciprocal rank fusion.
- Data: SQLite for the operations database, the transactional outbox, approvals and the audit log. Same file layout in Docker and Kubernetes via a mounted volume.
- HTTP: FastAPI and uvicorn for both the copilot API and the separate business API.
- Telemetry: `prometheus_client` metrics, JSON structured logs with a trace id on every line, timed spans per graph node.
- Tests: pytest. Deterministic tests stub the model; a golden regression set and two retrieval tests need Ollama and skip without it.

### 2. Business Scenario

Meridian Logistics runs four carriers on five lanes out of Chennai. An operations team member asks questions like "which shipments on Chennai to Mumbai are at risk?" and gives instructions like "re-route SHP-1003, it looks stuck". Answers must be grounded in the company's policy documents and live tracking data. A re-route changes the system of record, so it needs an approval from the right role before it commits. Every step must be traceable from question to evidence to action.

Autonomy level (Module 1): Approve for anything that writes, Supervise for read-only analysis. No fully autonomous writes.

### 3. Knowledge Corpus and Access Labels

Five markdown policy documents in `data/docs/`, each with front matter giving `doc_id`, `title`, `access` and `version`:

- `SLA-POL-001` Shipment SLA Policy: tiers, windows, the 25 percent at-risk rule, remedies. Access `internal`.
- `SOP-OPS-014` Re-routing SOP: when to re-route, procedure, approval matrix by declared value and cold chain, reason codes. Access `internal`.
- `POL-CAR-007` Carrier Management Policy: performance review rule, disruption declarations, lane assignments. Access `internal`.
- `GDE-OPS-003` Escalation Guide: tiers, response times, cold-chain rule. Access `internal`.
- `FIN-POL-021` Customer Credit Authorisation Policy. Access `confidential`. Team leads and shift supervisors must never see it.

Chunk each document at its top-level numbered sections so a citation reads `[SLA-POL-001 §3]` and a human can check it.

### 4. Identity and Policy (enforced outside the model)

- Five roles: `team_lead`, `shift_supervisor`, `ops_manager`, `finance_controller`, `quality_lead`. Roles map to document access labels and to the tools they may call.
- Identity arrives with the request (headers `X-User` and `X-Role`, set by a gateway from validated claims in production). Every endpoint requires it; nothing defaults to a role. It is never placed in a prompt.
- Retrieval filters by access label before fusion. A confidential chunk never enters the context of a caller who lacks the label.
- Every tool call passes through one gate: Pydantic argument validation, then role authorisation, then execution, then an audit row. The model only proposes calls.
- Re-route approver roles follow SOP-OPS-014 section 3 exactly: shift supervisor or operations manager below 50,000 INR, operations manager at or above 50,000 INR, and for a cold-chain shipment two signatures, one from the operations manager and one from the quality lead.
- Separation of duties: the requester can never approve their own request. A decision from any other role, or on a request that is no longer pending, is refused and audited as a denied attempt; the request stays pending. Only one open re-route per shipment, pending or committed.
- Read access follows the same labels: the approval inbox is visible to approver roles, a request's checkpoint to its requester and approvers, and evidence outside the viewer's access is stripped from what they see. Retry is a manager action and is audited.

### 5. Stage A: Agentic RAG with One Typed Tool and Citations

LangGraph graph: `retrieve -> plan_tools -> generate -> evaluate -> finalize`, with `plan_tools` looping at most twice and `evaluate` sending the draft back to `generate` at most `MAX_ITERATIONS` times.

- `retrieve`: hybrid, access-aware search over the corpus, top 4 chunks.
- `plan_tools`: the model is bound to two typed tools, `get_shipment_status(shipment_id)` and `list_at_risk_shipments(lane)`. Accept both native tool calls and a JSON object in the reply text, because 7B models often emit the latter. Deduplicate calls and enforce a tool-call budget.
- `generate`: answer using only the EVIDENCE and TOOL RESULT blocks. Every policy claim carries a `[DOC-ID §N]` citation; every shipment fact carries `[tool:name]`.
- `evaluate`: a structured groundedness verdict from the model (`grounded`, `unsupported_claims`, `missing_citations`, `notes`) followed by three deterministic checks: a cited section id must exist in the retrieved evidence, shipment facts must be attributed to the tool that produced them, and a flagged claim whose numbers all appear in the evidence is not unsupported. Revise only on unsupported claims; a missing citation on a hedge is recorded, not looped on. If the evaluator itself fails, the answer is released with an explicit `unverified` verdict that the dashboard counts separately, never as grounded.
- Prompts are versioned constants with role, context policy, tool policy, output contract and control loop. Retrieved text is data, never instructions.

### 6. Stage B: Supervisor, Specialist Workers and Approval

LangGraph graph with a SQLite checkpointer: `supervise -> research_worker -> policy_worker -> approval_gate -> execute_worker -> report_writer`.

- `supervise`: structured classification into `answer_question` or `reroute_shipment` plus the shipment id.
- `research_worker`: the Stage A graph reused as a worker. Contract: question and identity in; answer, evidence, tool results and citations out.
- `policy_worker`: policy as runtime. Deterministic code checks the SOP's grounds in the SOP's order: not delivered, not out for delivery, no open re-route already, then carrier disruption (RR-01) before SLA at risk (RR-02); a breached shipment with no disruption is blocked because no window remains to deliver inside. It picks an alternate carrier that is on the lane, off performance review and undisrupted, computes the approver roles, the number of signatures required and an idempotency key. The model only writes the justification paragraph with citations. A role that may not propose a re-route is stopped here by the same tool gate and gets an answer instead.
- `approval_gate`: a LangGraph `interrupt` carrying the proposal. Insert a row in the `approvals` table, export the pending count as a gauge, and stop. On resume, validate the decision (allowed role, not the requester, request still pending, distinct signer and role for the second cold-chain signature); an invalid decision is audited as denied and the gate stays open. A valid reject closes the gate. A valid approve records a signature and, once the required count is reached, routes to execute.
- `execute_worker`: call the business API with the idempotency key. Honour the `ACTIONS_DISABLED` kill switch. On failure record an audit row and re-raise so the checkpoint stays on this node; `retry` then re-runs only this step, never the model or the human.
- `report_writer`: compose outcome, proposal, decision, execution and trace id.

### 7. Stage C: One Database, One API, One Event

- Database: SQLite `ops.db` with `shipments`, `carriers`, `carrier_disruptions`, `reroute_requests`, `events`, `approvals`, `audit_log`. The agent never composes SQL. All access goes through named functions with fixed parameterised statements; reads use a read-only connection.
- API: a separate FastAPI service, the Carrier Booking API, exposing `POST /reroutes`. Bearer token from the environment compared in constant time, `Idempotency-Key` header required, `X-Trace-Id` propagated. It does not trust the caller's word on who approved: it recomputes the approver matrix from the shipment, rejects self-approval, requires the right number of distinct signers and roles, verifies the claimed signers against the approvals record for the thread, refuses a second booking for a shipment that already has one, and checks the target carrier is eligible on the lane. The request row, the shipment change, the outbox event and the audit row commit in one transaction. A replayed key returns the original booking with `replayed: true`.
- Client: timeout, three retries with exponential backoff and jitter, a circuit breaker that opens after three failures and half-opens after 30 seconds. `BUSINESS_API_URL=inprocess` mounts the API in-process for single-process runs and tests.
- Event: `ShipmentRerouted` written to a transactional outbox table, deduplicated on the idempotency key. A worker process leases an event, performs the downstream effects (customer notification and billing note, recorded as audit rows), then acknowledges it. A crash mid-handle lets the lease expire and another worker retries; the acknowledgement is fenced to the lease holder and each effect is keyed on the event id so redelivery repeats nothing; after three attempts the event is dead-lettered. Backlog and dead-letter counts are exported as gauges and refreshed on every scrape.

### 8. Stage D: Docker and Kubernetes with Health, Scaling and Telemetry

- One image (`deploy/Dockerfile`): `python:3.12-slim`, built from `requirements.lock`, tagged per commit, non-root user, no secrets, `.dockerignore` keeps the venv, data and `.env` out of the context, writable state under `/data`. The command selects the role: copilot API, business API or worker.
- Manifests in `deploy/k8s/`: namespace, ConfigMap, PersistentVolumeClaim, a dedicated ServiceAccount with no API token, default-deny NetworkPolicies with explicit allows; an init Job that seeds the database and builds the indexes; three Deployments with readiness and liveness probes, resource limits, read-only root filesystem, all capabilities dropped and a seccomp profile; NodePort Services; an HPA on CPU for the API (documented as a placeholder for an in-flight-requests signal); a KEDA ScaledObject on `copilot_event_backlog` for the worker with a minimum of one replica so it can never scale to a state that cannot report its own backlog; a Prometheus Deployment that scrapes all three services. The Secret is created at deploy time by `deploy/kind-up.sh` from a generated value and never committed.
- `deploy/kind-up.sh` builds, creates the cluster with NodePorts mapped to localhost, discovers the host address for Ollama, creates the Secret, runs the init Job, applies and waits. Rollback is `kubectl rollout undo` to the previous image tag.
- Readiness for the copilot API checks the database and Ollama; a pod that cannot reach the model receives no traffic. Every model call has a timeout; the termination grace period covers one full request.
- Telemetry: request counts by outcome, per-step latency histograms, tool calls by result, evaluator verdicts including unverified, revision loops, loop guard trips, approvals pending and decisions by approve, reject and denied, events published, handled, failed and dead-lettered, backlog, tokens by direction and step, successful business actions, and the prompt and model version. `deploy/grafana-dashboard.json` lays these out in the four Module 8 rows, with tokens per successful action and re-routes committed as the value panels.

### 9. HTTP Surface of the Copilot

- `POST /ask` runs Stage A. `POST /requests` runs Stage B until it finishes or pauses, and returns the thread id even on failure so the checkpoint can be retried. `GET /approvals` lists pending gates. `POST /approvals/{thread_id}` resumes with a decision and answers 403, 404 or 409 for an invalid one. `POST /requests/{thread_id}/retry` re-runs a failed step. `GET /requests/{thread_id}` returns the checkpointed state. `GET /audit` and `GET /events` are restricted to manager roles. `GET /healthz`, `GET /readyz`, `GET /metrics` are open for the platform.

### 10. Testing

- Deterministic (38, of which the 15 graph tests below are part): SLA thresholds including the exact boundary and business-day windows, allowlisted queries, atomic commit and its rollback, outbox dedupe, fenced lease and ack and dead letter, idempotent worker effects, role access, the tool gate's denial branch, the approver matrix, argument validation, business API token, validation, server-side policy and signature verification, client retry, breaker and non-JSON errors, worker retry, copilot API identity and role restrictions.
- Supervisor graph with a stubbed model (15): every governance guarantee in section 6, including wrong-role, self-approval, re-decision, retry from checkpoint and its refusal while a gate is open, two-person cold chain, blocked grounds, duplicate requests, evidence redaction by access, kill switch, and the deterministic evaluator checks.
- Golden regression set on the live model (5): asserts on citations, tool calls and key facts, never wording; results written to `data/golden_results.json`.
- Manual scenario with the real model: team lead denied, supervisor's request pauses, wrong approvals refused, kill switch holds, retry commits, event drained, audit trail complete.

### 11. Governance Record

- Owner: the operations manager on duty owns every action the copilot commits; the network control centre owns the SOP it enforces.
- Risk tier: Approve level for writes (a human signs every system-of-record change), Supervise level for reads.
- Kill switch: `ACTIONS_DISABLED=true` holds every approved action at the execute step and audits the hold; clearing it and retrying releases them.
- Appeal: a rejected request can be re-raised by the requester; the audit trail shows who rejected it and why.
- Retention: audit rows seven years (FIN-POL-021 section 5), checkpoints 30 days, Prometheus two days. Customer identifiers in events and audit rows are account names, not personal data.

### 12. Definition of Done

All deterministic and graph tests pass. The golden set passes on the live model. A re-route pauses at the gate, refuses every invalid decision while staying pending, resumes after a valid approval, commits exactly once through the business API in one transaction, produces one event, and the worker handles it once. The image builds and `deploy/kind-up.sh` brings the cluster to all pods ready.

---

## Mapping to Course Modules

| Module | Where it shows up |
|---|---|
| 1 | Autonomy level per action, lifecycle controls, reference layers in the README diagram |
| 2 | Single agent (Stage A), supervisor-worker (Stage B), reflection loop, approval gate, loop guard, worker contracts |
| 3 | Prompt contracts, typed tool calling through a gate, hybrid access-aware RAG, evaluator |
| 4 | LangGraph graphs with checkpointing, interrupt and resume, termination rules |
| 5 | Governed business API, allowlisted data access service, idempotency key, command versus event, outbox |
| 6 | Docker image rules, probes, HPA and KEDA scaling, externalised state, circuit breaker, retries with jitter |
| 7 | Identity on every endpoint, tool boundary authorisation, separation of duties, two-person rule, generated secret, network policies, lineage, injection defence, kill switch, named owner and retention |
| 8 | Metrics for the four dashboard rows, per-step spans, trace id on every log line |
| 9 | The five capstone deliverables are the README sections |
