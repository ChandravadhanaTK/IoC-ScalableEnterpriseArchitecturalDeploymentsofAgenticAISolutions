# Handoff

Current state of the operations copilot as of 19 September 2026, after two grading council rounds and two fix rounds. Read this before touching anything; the README is the pitch.

## What is verified, and how

- **Deterministic tests**: 38 pass with no model (`.venv/bin/python -m pytest -q tests --deselect tests/test_golden.py` reports 40 because two retrieval tests also ran with Ollama up). The 38 include the 15 supervisor-graph tests below. They cover SLA classification including the exact 25 percent boundary, allowlisted queries, the atomic re-route commit and its rollback on failure, outbox dedupe on idempotency key, lease-then-ack claiming and dead lettering, role access, the tool gate's denial branch, the approver matrix including the cold chain two-person rule, business API token, validation, server-side approver and carrier checks, client retry and breaker, non-JSON error bodies, the worker's retry on failure, and the copilot API's identity requirements.
- **Supervisor graph with a stubbed model** (`tests/test_supervisor_graph.py`, 15 tests): question intent skips the gate; a team lead cannot start a re-route; a re-route pauses and commits once; a wrong-role decision does not close the gate and the rightful approver can still approve; the requester cannot approve their own request; reject closes without executing; a failed execute is retried from its checkpoint without re-asking anyone; cold chain needs two distinct roles; breached-without-disruption is blocked; a second request for a shipment is blocked both while the first is pending and after it commits; retry is refused while the gate is open so a stale resume value is never replayed; a checkpoint viewed by a lower-access role has confidential evidence removed; the kill switch holds approved actions; the RAG routing functions, the deterministic evaluator checks, the multi-id citation parser and the structured-output guard behave.
- **Golden regression set on the live model** (`tests/test_golden.py`, 5 questions, `qwen2.5:7b`, prompt version 2026-09-19.2): 5 of 5 on three consecutive runs after the citation parser fix. Asserts on citations, tool calls and key facts, not wording, and fails on an `unverified` evaluator. One question (`q-status-approver`) consistently reaches the iteration budget: the content checks pass but the 7B evaluator keeps flagging one correct sentence, which is recorded in `data/golden_results.json` as `stopped_by: iteration_budget`. Latency per question 10 to 37 seconds on an 8 GB laptop GPU.
- **Live end-to-end scenario through the CLI** with the real model: team lead denied at start; supervisor's request paused with approver `ops_manager` and reason RR-01 (carrier disruption checked before SLA state); team lead's approval refused; requester's self-approval refused; request still pending; manager's approval with the kill switch on held at execute; retry with the switch off committed request 1; second retry refused; worker handled the one event; audit trail shows every step including the denied attempts under one thread id.
- **HTTP surface**: exercised earlier through uvicorn and now through the FastAPI test client for identity, 401 without headers, 403 for wrong roles on audit, 404 on unknown approvals.

## What is not verified

- **Docker and Kubernetes have not been run.** Docker, kubectl and kind are not installed in this WSL environment and installing them needs sudo. `deploy/kind-up.sh` encodes the whole bring-up as the platform reviewer specified it, but it has not executed. First thing to do once Docker exists is run it and record the result here. Known things it will surface: whether kind's local-path volume honours `fsGroup` with a read-only root filesystem, and whether the default-deny NetworkPolicy needs an extra allow for the readiness probe from the node.
- **KEDA scaling** is a manifest only.
- **Grafana** is a dashboard JSON file; it has not been imported into a live Grafana.

## What the council found and what changed

The council's verdicts for both rounds are in `../GRADING_COUNCIL.md`.

Round two fixes (all applied and tested): the one-open-re-route rule now looks at pending approvals as well as committed requests, so two requesters cannot each get a booking; the business API verifies the claimed signers against the approvals record instead of trusting names; retry is restricted to manager roles, audited, and refused while a gate is open; the approval inbox and request view are restricted to approvers and requesters, and evidence outside the viewer's access labels is stripped from a checkpoint view; the worker's acknowledgement is fenced to the lease holder and its effects are idempotent per event id; the numeric rescue in the evaluator matches whole tokens of two or more digits only and only for claims that are about a figure; citations grouped in one bracket are parsed; Standard and Economy SLA windows count business days excluding Sundays; `readyz` checks the configured models exist; the pending and backlog gauges are refreshed on every scrape; the bring-up script sets images per Deployment, keeps the database on redeploy and applies KEDA only when the CRDs exist; the Dockerfile no longer hides an install failure; Prometheus has an egress policy and a security context; the example env file ships no usable token.

Round one fixes:

1. Approval endpoint guarded: role, separation of duties, pending status, all checked before resume; denied attempts audited as `approval_denied`; gate stays open.
2. `propose_reroute` enforced through the tool gate in the supervisor.
3. Re-route commit is one transaction; events dedupe on the idempotency key; the worker acknowledges after handling and dead-letters after three attempts.
4. Failed execute keeps its checkpoint; `retry` re-runs only that node; the API returns the thread id on failure and has a retry endpoint.
5. Deployment: lockfile, `.dockerignore`, no committed secret, correct Ollama and Prometheus addresses, KEDA minimum one replica, network policies, dedicated service account, pod hardening, longer grace period, model call timeout, tagged images with `rollout undo` as rollback, `kind-up.sh`.
6. Supervisor graph tests with a stubbed model; fixture reloads every module so nothing writes to `data/`.
7. SOP matched: cold chain is operations manager plus quality lead, disruption is checked before SLA state, breached without disruption is blocked, one open re-route per shipment.
8. Documents reconciled: test counts fixed, the docx is regenerated from the markdown prompt so there is one prompt, the Grafana dashboard exists, owner, risk tier, kill switch and retention are stated.
9. Evaluator fails closed with an `unverified` verdict instead of pretending the answer is grounded; deterministic checks catch invented citations, unattributed shipment facts and false-positive numeric claims.

## Known rough edges

- Identity is still trusted from `X-User` and `X-Role` headers. The difference from before is that nothing defaults and every endpoint requires them. A gateway must set them from validated claims; the copilot does not validate a token itself. The business API does.
- SQLite is shared by all three processes through a file. WAL is on for the checkpointer. Fine for one volume; the production note in the manifests says Postgres.
- The 7B evaluator still over-flags missing citations on hedged sentences and sometimes flags a sentence that is literally in the tool result. Revision is triggered only by unsupported claims; missing citations are recorded as a warning. The deterministic numeric rescue only applies to claims about a figure whose numbers appear as whole tokens in the evidence, so "65,000 is below 50,000" is no longer rescued; the price is that the evaluator's own numeric false positives now cost a revision loop.
- Business days for Standard and Economy exclude Sundays; the holiday list in `db.HOLIDAYS` is empty in the demo.
- The kill switch is read at process start. A runtime toggle would need a mounted file or a config endpoint.
- `qwen2.5:7b` emits tool calls as JSON text rather than native tool calls through Ollama. `_parse_text_tool_calls` accepts that shape; arguments still go through Pydantic and the role gate.
- Chroma prints a Pydantic deprecation warning during tests. Harmless.

## Environment

- Python via `.venv/bin/python` (uv-created). Never system Python. `requirements.lock` is the exact set the tests ran against.
- Ollama 0.16.3 on the host with `qwen2.5:7b`, `qwen2.5-coder:7b`, `llama3`, `nomic-embed-text`. `.env` selects `qwen2.5:7b`.
- `BUSINESS_API_URL=inprocess` in `.env` mounts the business API inside the same process so the CLI and tests are single-process. In Kubernetes it is `http://business-api:8001`.

## Next steps, in order

1. Install Docker and kind, run `deploy/kind-up.sh`, fix whatever breaks, record it here.
2. Import `deploy/grafana-dashboard.json` into a Grafana pointed at the cluster's Prometheus and check every panel has data after one re-route.
3. Put a token-validating gateway in front of the copilot API, or validate a JWT in `_identity`, so the headers are derived rather than asserted.
