# Operations Copilot

An enterprise agentic AI system that answers operations questions from policy documents and live shipment data, and carries a re-route request through research, policy checks, human approval and a governed commit. Everything runs locally on a free stack: Ollama for the models, SQLite for state, LangGraph for the agents.

Built for the Anna University IoC on Scalable Enterprise Architectural Deployments of Agentic AI Solutions. Roll number 2023103027, Dheirav Prakash. The build prompt that describes it in the course's assignment format is one directory up in `Operations_Copilot_Build_Prompt.md`. `HANDOFF.md` records what has and has not been verified.

## Which assignment is which

| Assignment | What it asks for | Where |
|---|---|---|
| Week 1 take-home | Agentic RAG on a 0-dollar AI stack | Stage A |
| Week 2 option A | Agentic RAG with one typed tool and citations | Stage A: `opscopilot/agents/rag_agent.py`, `opscopilot/tools/shipments.py` |
| Week 2 option B | Supervisor, specialist workers, approval | Stage B: `opscopilot/agents/supervisor.py` |
| Week 2 option C | One database, one API, one event | Stage C: `opscopilot/integration/` |
| Week 2 option D | Docker and Kubernetes with health, scaling, telemetry | Stage D: `deploy/`, `opscopilot/api.py`, `opscopilot/worker.py`, `opscopilot/telemetry.py` |

## Architecture

```
            ┌────────────────────────────────────────────────────────────────┐
 Experience │  CLI (scripts/)          HTTP API (opscopilot/api.py)         │
            ├────────────────────────────────────────────────────────────────┤
 Control    │  Identity + role -> access labels + tool permissions           │
 plane      │  (identity.py)   approvals table   audit_log   trace id       │
            ├────────────────────────────────────────────────────────────────┤
 Orchestr.  │  Stage B team graph, SQLite checkpointer, interrupt at gate    │
 & state    │  supervise -> research -> policy -> approval -> execute -> report│
            │       │                                                        │
            │  Stage A RAG graph (reused as the research worker)             │
            │  retrieve -> plan_tools -> generate -> evaluate -> finalize     │
            ├────────────────────────────────────────────────────────────────┤
 Intellig.  │  Ollama: qwen2.5:7b chat, nomic-embed-text embeddings          │
            │  structured() JSON verdicts, prompts.py versioned contracts    │
            ├────────────────────────────────────────────────────────────────┤
 Tools &    │  get_shipment_status, list_at_risk_shipments (typed, gated)    │
 execution  │  business_client -> Carrier Booking API (POST /reroutes)       │
            ├────────────────────────────────────────────────────────────────┤
 Data &     │  data/docs (5 policies, access labels)  Chroma + BM25 index    │
 knowledge  │  ops.db: shipments, carriers, reroute_requests, events outbox  │
            ├────────────────────────────────────────────────────────────────┤
 Platform   │  Docker image, k8s: api / business-api / worker Deployments,   │
            │  init Job, HPA + KEDA on backlog, Prometheus scrape, /metrics  │
            └────────────────────────────────────────────────────────────────┘
```

The design decisions that matter, and why:

- **Policy is code, not prompt.** Whether a re-route is allowed, which carrier to pick and who may approve are computed in `policy_node` from the database and the SOP's approval matrix, including the two-person rule for cold chain. The model writes the justification paragraph. A wrong model answer therefore cannot authorise anything, and the business API re-checks the same matrix server-side so a caller cannot assert an approver either.
- **Retrieval filters by access before the model sees anything.** Roles map to access labels. The confidential credit policy is not in a team lead's search results, so it cannot leak through a prompt injection either.
- **Tools go through one gate.** Model proposes, Pydantic validates, the role is checked, the allowlisted query runs, an audit row is written. There is no code path where the model composes SQL. The same gate decides whether a role may propose a re-route at all.
- **State is externalised.** The team graph checkpoints to SQLite. A request paused at the approval gate can be resumed by a different process. A failed execution leaves the checkpoint on the execute step, so a retry re-runs only that step, without re-asking the model or the human. This is the "pod restart" scenario from Module 6.
- **The gate cannot be closed by the wrong person.** A decision from a role outside the approver set, from the requester themselves, or on a request that is no longer pending is refused with 403 or 409 and audited as a denied attempt. The request stays pending for the rightful approver. Only one open re-route per shipment is allowed, pending or committed. A kill switch (`ACTIONS_DISABLED`) holds approved actions at the execute step until it is cleared (it is read at startup, so in Kubernetes flipping it is a ConfigMap edit plus a rollout restart).
- **The business API does not take the copilot's word for it.** It recomputes the approver matrix from the shipment, refuses self-approval, and verifies the claimed signers against the approvals record for that thread before it books anything.
- **Writes are atomic, idempotent and evented.** The business API keys on `Idempotency-Key` and commits the request row, the shipment change, the `ShipmentRerouted` outbox event and the audit row in one SQLite transaction. A retried approval cannot book twice, and a crash mid-commit leaves nothing half done. The worker leases an event, handles it, then acknowledges, so a crash mid-handle is retried and a poison event is dead-lettered after three attempts.

## Running it locally

Prerequisites: Python 3.12, `uv`, and Ollama with the two models.

```bash
ollama pull qwen2.5:7b && ollama pull nomic-embed-text
cd opscopilot
uv venv .venv && uv pip install -p .venv/bin/python -r requirements.txt
cp .env.example .env                      # sets BUSINESS_API_URL=inprocess and a dev token
.venv/bin/python scripts/seed_db.py       # operations database
.venv/bin/python -m opscopilot.knowledge.ingest   # chunk, embed, index
.venv/bin/python -m pytest -q tests       # 38 deterministic tests (12 of them drive the supervisor graph with a stubbed model), 2 retrieval tests and 5 golden questions that need Ollama
```

Stage A, ask a question with a role:

```bash
.venv/bin/python scripts/ask.py --role shift_supervisor "Which shipments on the Chennai to Mumbai lane are at risk, and what does the SOP say about re-routing them?"
.venv/bin/python scripts/ask.py --role team_lead "What is the finance controller's credit limit?"   # confidential doc never retrieved
.venv/bin/python -m pytest -q tests/test_golden.py   # regression set on the live model, results in data/golden_results.json
```

Stages B and C, a governed re-route:

```bash
.venv/bin/python scripts/request.py start --role shift_supervisor "Re-route SHP-1003 to another carrier"
.venv/bin/python scripts/request.py pending
.venv/bin/python scripts/request.py approve <thread_id> --role ops_manager --user mgr1
.venv/bin/python scripts/request.py drain          # worker consumes the ShipmentRerouted event
.venv/bin/python scripts/request.py retry <thread_id>   # re-run a failed execute step from its checkpoint
ACTIONS_DISABLED=true .venv/bin/python scripts/request.py approve <thread_id> --role ops_manager --user mgr1   # kill switch holds it
```

Stage D, the HTTP service on the laptop:

```bash
.venv/bin/python -m uvicorn opscopilot.api:app --port 8000
curl localhost:8000/readyz
curl -X POST localhost:8000/ask -H 'Content-Type: application/json' -H 'X-User: sup1' -H 'X-Role: shift_supervisor' -d '{"question":"What remedy applies to a breached Express shipment?"}'
curl -X POST localhost:8000/approvals/<thread_id> -H 'Content-Type: application/json' -H 'X-User: mgr1' -H 'X-Role: ops_manager' -d '{"decision":"approve"}'
curl -X POST localhost:8000/requests/<thread_id>/retry -H 'X-User: mgr1' -H 'X-Role: ops_manager'
curl localhost:8000/metrics | grep copilot_
```

Each run takes 15 to 60 seconds on an 8 GB laptop GPU because every step is a 7B model call. The per-step timings are in the JSON log lines (`"msg": "span"`).

## Kubernetes

Not yet run on this machine (see `HANDOFF.md`). The manifests are written for a `kind` cluster with Ollama on the host, and `deploy/kind-up.sh` does the whole bring-up: builds a tagged image from the lockfile, creates the cluster with the NodePorts mapped to localhost, discovers the host address for Ollama, generates the API token as a Kubernetes Secret (nothing secret is committed), runs the init Job, applies the Deployments and waits for the rollout.

```bash
OLLAMA_HOST=0.0.0.0 ollama serve &          # Ollama must listen where kind can reach it
deploy/kind-up.sh
curl localhost:30080/readyz
kubectl -n opscopilot rollout undo deployment/copilot-api   # rollback = previous image tag
```

What the manifests give you: dedicated service account with no API token, default-deny NetworkPolicies with explicit allows (including Prometheus egress to the scrape ports and the API server), non-root pods with a read-only root filesystem and all capabilities dropped, readiness that checks the configured models are actually present in Ollama, a CPU HPA for the API (documented as a placeholder; kind has no metrics-server so it shows unknown until one is installed), a KEDA ScaledObject on the outbox backlog for the worker with a minimum of one replica (applied by the script only when the KEDA CRDs exist), a Prometheus that scrapes all three services, and `deploy/grafana-dashboard.json` with the four Module 8 rows. A redeploy keeps the database; `RESET=1 deploy/kind-up.sh` wipes and reseeds.

## The five capstone deliverables

**Architecture diagram**: the layer diagram above, mapped to the course's reference architecture.

**Agent workflow design**: two graphs. Stage A is a single agent with a reflection loop and a tool budget. Stage B is supervisor-worker with a durable approval gate. Worker contracts are the Pydantic models in `supervisor.py`; failure paths are the `policy_block` branch, the gate's denied-decision path, and the execute step raising so its checkpoint is retained for retry.

**Deployment strategy**: one image built from a lockfile and tagged per commit, three roles, an init Job for state, readiness gated on the model, API scaled on CPU, worker scaled on backlog, retries with jitter and a circuit breaker in the client, a per-call model timeout, a termination grace period long enough for one request, rollback by `rollout undo` to the previous tag, state on a volume that would be Postgres in production.

**Security model**: identity required on every endpoint (headers a gateway sets from validated claims; nothing defaults to a role), roles to access labels and tool permissions, authorisation at the tool boundary and again server-side in the business API, separation of duties between requester and approver, two-person approval for cold chain, one secret generated at deploy time and never committed, non-root hardened pods behind default-deny network policies, retrieved text treated as data with deterministic citation checks, every consequential step and every denied attempt audited with a trace id, a kill switch for actions. Named owner: the operations manager on duty owns the copilot's actions; risk tier: Approve level for writes; retention: audit rows seven years per FIN-POL-021 section 5, checkpoints 30 days, Prometheus two days.

**Monitoring dashboard design**: `deploy/grafana-dashboard.json`, four rows from Module 8, every panel a PromQL query over metrics in `telemetry.py`. AI quality: task success rate, evaluator verdicts including `unverified`, revision loops. Workflow: approvals pending, decisions by approve, reject and denied, loop guard trips, tool calls by result. Performance: p90 latency per step, event backlog and dead letters, events published versus handled. Cost and value: tokens per step, tokens per successful business action (`copilot_tokens_total` over `copilot_successful_actions_total`), re-routes committed as the business KPI, and the prompt and model version in use. Evaluation: `tests/test_golden.py` is the regression set, five questions asserting on citations, tool calls and key facts.

## Layout

```
opscopilot/
  agents/      rag_agent.py (Stage A), supervisor.py (Stage B), prompts.py
  knowledge/   ingest.py (chunk + index), retrieval.py (hybrid, access-aware)
  tools/       shipments.py (typed tools + the gate)
  integration/ db.py (allowlisted queries, outbox, audit), business_api.py, business_client.py
  api.py       copilot HTTP service      worker.py   event consumer
  identity.py  roles, access, approvers  telemetry.py  logs, spans, metrics
  llm.py       model access, structured JSON            config.py
data/docs/     the five policy documents
scripts/       seed_db.py, ask.py, request.py
tests/         deterministic, supervisor-graph (stubbed model), Ollama-marked, golden set
deploy/        Dockerfile, kind-up.sh, grafana-dashboard.json, k8s/
```
