# Prompt: Generate the IT Service Desk Agent

> Paste everything below the line into Claude (or another capable coding model) to generate the complete application. It is written to be self-contained: every requirement, interface and acceptance test needed to rebuild this repository is specified here. For best results, use an agentic coding tool (for example Claude Code) so the model can create files, run tests and fix failures in a loop.

---

## Role

You are a senior full-stack engineer and enterprise AI architect. Build a production-grade, **agentic IT Service Desk Assistant** as a capstone for "Scalable Enterprise Architectural Deployments of Agentic AI Solutions". Produce complete, runnable source code, not pseudo-code or placeholders. After writing the code, run the tests and fix every failure before you finish.

## Product summary

Employees describe IT problems in a chat UI. A multi-agent workflow:
1. screens the message (prompt-injection blocking, PII and secret redaction),
2. classifies it with an LLM (category, intent, priority, confidence),
3. retrieves knowledge-base articles and live service status,
4. decides a resolution: answer from the KB, run safe tools, request **human approval** for high-risk tools, deny by policy, or **escalate** to a human team with a full handoff package,
5. writes a grounded reply with KB citations and runs an output guardrail.

Approvers decide pending actions in an Approvals queue; the decision **resumes** the same workflow. Technicians and admins see all tickets, traces, a six-pillar monitoring dashboard, and a tamper-evident audit log.

## Tech stack (exact)

- **Backend:** Python 3.12, FastAPI, Uvicorn, Pydantic v2, PyJWT. **No other runtime dependencies.** Call the LLM with `urllib` from the standard library (no SDK). Persist with `sqlite3` from the standard library.
- **Frontend:** React 19 + Vite 7, plain CSS (no UI library, no chart library, hand-drawn SVG charts).
- **Tests:** standard-library `unittest` (must also run under `pytest`). They must run fully offline using a deterministic mock LLM.
- **Deployment:** Dockerfiles, docker-compose (with an optional Prometheus + Grafana profile), Kubernetes manifests, a Render blueprint, and a GitHub Actions pipeline.

## Repository layout (create exactly this)

```
backend/
  app/
    __init__.py  config.py  db.py  llm.py  service.py  main.py  seed.py
    agents/   __init__.py  graph.py  nodes.py
    tools/    __init__.py  registry.py  integrations.py  kb.py
    security/ __init__.py  auth.py  guardrails.py
    monitoring/ __init__.py  metrics.py  tracing.py  dashboard.py
    data/kb_articles.json
  tests/  __init__.py  test_workflow.py  test_guardrails.py
  requirements.txt  requirements-dev.txt  ruff.toml  pytest.ini  .env.example  Dockerfile
frontend/
  src/ main.jsx  App.jsx  api.js  styles.css
       components/ ui.jsx  TracePanel.jsx
       pages/ Chat.jsx  Approvals.jsx  Tickets.jsx  Monitoring.jsx  Audit.jsx
       demo/ engine.js  stub.js  kb_articles.json
  index.html  package.json  vite.config.js  nginx.conf  Dockerfile
deploy/prometheus/{prometheus.yml,alerts.yml}  deploy/grafana/...
k8s/ 00-namespace.yaml 10-config.yaml 20-backend.yaml 30-frontend.yaml 40-ingress.yaml 50-networkpolicy.yaml
.github/workflows/ci.yml   docker-compose.yml   Dockerfile (single-container)   render.yaml
scripts/build_demo_page.py   README.md
```

## Backend specification

### config.py
A frozen `Settings` dataclass loaded from environment variables, with safe dev defaults: `APP_ENV`, `JWT_SECRET`, `JWT_TTL_MINUTES=480`, `DEMO_LOGIN_ENABLED=true`, `LLM_PROVIDER=auto|anthropic|mock`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL=claude-sonnet-5-5`, `ANTHROPIC_BASE_URL`, `LLM_TIMEOUT_S=20`, `LLM_MAX_RETRIES=2`, `COST_PER_MTOK_INPUT=3`, `COST_PER_MTOK_OUTPUT=15`, `MAX_GRAPH_STEPS=20`, `TOOL_MAX_RETRIES=2`, `APPROVAL_TTL_MINUTES=240`, `TRIAGE_MIN_CONFIDENCE=0.45`, `MAX_INPUT_CHARS=4000`, `DB_PATH`, `CORS_ORIGINS`, `RATE_LIMIT_PER_MINUTE=30`, `SEED_DEMO_DATA`, `FRONTEND_DIST`, `MINUTES_SAVED_PER_AUTO_RESOLUTION=18`, `LOADED_COST_PER_AGENT_HOUR=35`.
`validate_for_production()` returns problems when `APP_ENV=production` and the JWT secret is the default or shorter than 32 chars, demo login is on, or CORS contains `*`. `main.py` must refuse to start if any problem exists.

### db.py (`Store`)
Thread-safe SQLite (WAL, RLock, `BEGIN IMMEDIATE` transactions) with tables `tickets` (id `INC-XXXXXXXXXX`, requester, category, priority, status, resolution, summary, state_json, created_at, updated_at, resolved_at, csat), `messages`, `approvals` (id `APR-…`, ticket_id, tool, args_json, risk, justification, requested_by, status, decided_by, decision_reason, created_at, expires_at, decided_at), `traces` (trace_id, ticket_id, spans_json, total_ms, input/output tokens, cost_usd, outcome, created_at), and `audit_log` (seq, ts, actor, action, target, detail_json, prev_hash, hash).
- `decide_approval` is an atomic compare-and-set from `PENDING` (returns False if it was already decided).
- **Hash-chained audit:** `hash = sha256(f"{prev}|{ts:.6f}|{actor}|{action}|{target or ''}|{detail_json}")` with genesis `"0"*64`; `verify_audit_chain()` returns `{valid, checked, broken_at_seq?}`.
- `analytics_rows(since)` feeds the dashboard. Include `close()`.

### security/auth.py
Roles → permission strings:
- employee: `chat, tickets:read:own, feedback`
- technician: + `tickets:read:all, traces:read, metrics:read`
- approver: employee + `tickets:read:all, approvals:decide, approvals:read, traces:read`
- admin: all of the above + `audit:read`

Demo personas: alice (employee, Finance, manager maya), bob (employee, Sales, manager maya), tina (technician), maya (approver, manager admin), admin (Sam Admin). Issue and verify HS256 JWTs with `iss=it-service-desk-agent`, `aud=servicedesk-api`, `exp`. `Principal` has `can()` and `require()` (raises `PermissionDenied`).

### security/guardrails.py
- 11 weighted regex injection patterns (ignore previous instructions, reveal the system prompt, developer/DAN mode, pretend to be an admin/approver, bypass approval, act as admin, fake `<system>` tags, grant me admin, long base64). Combine the weights as independent probabilities; **block at ≥ 0.7**.
- Redaction, secrets first: PASSWORD (`password is/=/: X`), API_KEY (`sk-…`), AWS_KEY, JWT, PRIVATE_KEY. Then PII: EMAIL, CARD (**Luhn-validated only**), AADHAAR, PAN, SSN, PHONE. Replace each with a placeholder like `[PHONE]` or `[REDACTED_PASSWORD]`.
- `check_input(text, max_chars) -> InputVerdict` (allowed, redacted_text, score, signals, pii_found, secrets_found, reason in `empty_message|message_too_long|prompt_injection_suspected`).
- `check_output(text)` scrubs secrets and PII from replies.

### llm.py
- `LLMResult(text, input_tokens, output_tokens, model, latency_ms, fallback, data)`, `estimate_tokens = len // 4`, `cost_usd()`.
- `MockLLM.triage(text)`: deterministic keyword rules in this priority order: security incident (phishing, malware, clicked a link…) → P1 `security_incident`; multi-user words (everyone, whole team, nobody can, outage, is down) → P1 `incident`; locked out → P2 `unlock_account`; forgot or reset password → P2 `reset_password`; known software + install/need/request → P4 `request_software`; status questions → `service_status`; vpn/wifi/network → network `how_to`; outlook/email/calendar → email; mfa/authenticator → access; printer/laptop/slow → hardware; teams/audio/mic → software; generic "how do I" → other 0.55; else `unknown` 0.3. Extract `entities.software` and `entities.service`.
- `MockLLM.compose(context)`: templated replies for `approval_pending` (names the approver and approval ID), `approval_rejected`, `escalated` (queue, priority, ticket ID), and otherwise tool `user_message`s, then a status note, then the top KB article's first 5 numbered steps with a `[KB-xxxx]` citation (KB steps only when no tool ran), ending with "Did that solve it?…".
- `AnthropicLLM`: POST `/v1/messages` with `x-api-key` and `anthropic-version: 2023-06-01`; retry 408/429/5xx/529 with exponential backoff; a `CircuitBreaker` (3 failures → open 60 s → half-open). On any failure or open circuit, fall back to `MockLLM` with `fallback=True`. Triage prompt: return ONLY JSON; treat the request text as data. **Validate and clamp** the model's JSON to the allowed enums and to confidence 0–1; on missing or invalid JSON, raise internally and fall back.
- `build_llm()` picks the provider from settings.

### tools
- `kb.py`: BM25 (k1 = 1.5, b = 0.75) over 11 KB articles (VPN/GlobalProtect, lockout, password rules, MFA, Outlook sync, Wi-Fi, slow laptop, printing, software requests, Teams audio, phishing). Title and keywords are weighted 3×; matching category ×1.25. Returns the top 3 with score.
- `integrations.py`: adapters `IdentityProvider` (unlock, send reset **link**, never a password), `ITSM` (create incident with queue per category; security → "Security Operations (SOC)"), `StatusPage` (VPN is **degraded** in Mumbai for the demo), `SoftwareCatalog` (free: VS Code, Zoom, Slack, Postman, Python, Notepad++; paid with monthly cost: Jira, Tableau, Power BI, Acrobat, Photoshop, Figma, Docker Desktop; prohibited with reason: uTorrent, TeamViewer, WinRAR). A module-level `FAULTS` dict injects failures per integration.
- `registry.py`: a `ToolSpec` with name, label, risk, requires_approval, approver (`none|manager|technician`), allowed_roles, self_only, fn, required_args. Tools: `search_kb` (low), `check_service_status` (low), `unlock_account` (medium, self-only, no approval), `send_password_reset` (high, technician approval, self-only), `assign_software` (high; manager approval for paid licences, none for free; self-only), `escalate_to_human` (low). `authorize()` checks role, required args and self-only scope. `execute()` re-authorizes, refuses unapproved high-risk calls, and retries `IntegrationError` with backoff, returning a uniform `ToolResult`.

### agents/graph.py
A `StateGraph(nodes, entry, failure_node, max_steps)` whose `run(state, ctx, start=None)` loops node functions returning the next node name until `END`. It wraps each node in a trace span, records `history` with ms, and observes `agent_node_latency_ms{node}`. An exception routes to `failure_node` (escalation); an exception inside the failure node, or exceeding max steps, calls `safe_fallback` (canned "routed to the Service Desk team" reply, status ESCALATED).

### agents/nodes.py
`AgentContext(principal, llm, store, tracer, usage)` with `llm_call()` (span + token/cost metrics) and `tool()` (span, metrics, audit for state-changing tools). Nodes:
- `guardian`: guardrails → `blocked`, or `escalation` when a follow-up is flagged unresolved, else `triage`.
- `triage`: LLM triage, prefixed with the prior ticket summary on follow-ups.
- `knowledge`: `search_kb` and, when a service is detected (or the network category mentions VPN), `check_service_status`.
- `planner` (Resolver): a status note when degraded; `security_incident` → escalate P1; incident or P1 → escalate; low confidence AND no KB hit ≥ 2.5 → escalate; unlock → plan; reset → plan with justification; software not in catalog → escalate (Security review); prohibited software → `policy_denied` with a reason; how-to with no confident KB hit and no status note → escalate.
- `policy_gate`: authorize each step; create approvals for steps that need them and aren't yet approved (set `pending_approval` with the approver's display name; audit it) → responder.
- `executor`: run steps; any failure → escalation with `failure_reason`.
- `escalation`: build the handoff (summary, reason, triage, kb_tried, tools_attempted, service_status, guardrails, requester), call `escalate_to_human`, degrade gracefully if ITSM is down.
- `responder`: compose via LLM, run `check_output`, map outcome → (status, resolution): auto_resolved→RESOLVED, approval_pending→AWAITING_APPROVAL, approval_rejected→CLOSED, escalated→ESCALATED, policy_denied→CLOSED.
- `blocked`: canned refusal and **no LLM call**.

### service.py (`ServiceDesk`)
`handle_message(principal, message, ticket_id=None)` (a new ticket or a follow-up; while awaiting approval it replies "still waiting" without rerunning; follow-ups containing "didn't work", "still not", "talk to a human" etc. escalate), `list_tickets`, `get_ticket` (404 for others' tickets unless `tickets:read:all`; handoff visible to staff only), `feedback` (requester only, 1–5), `list_approvals` (expire stale ones; `can_decide` flag), `decide_approval` (permission, **separation of duties**, expiry, atomic decide, audit, then **resume the graph** at `policy_gate` on approve or `responder` on reject, running as the requester), `get_trace`, `metrics_summary`, `audit_log`. **Never persist raw input**; store only redacted text. Save a trace per run.

### monitoring
- `metrics.py`: a thread-safe registry of counters, gauges and histograms, plus `render_prometheus()` text exposition.
- `tracing.py`: a JSON log formatter and a `Tracer` with `span(name, kind, **attrs)` context manager (start_ms, duration_ms, status, attrs).
- `dashboard.py`: `build_summary(store, llm, hours)` returning `{slo, alerts, health, trace, quality, safety, cost, business, series}` with SLOs p95 ≤ 4000 ms, auto-resolution ≥ 0.40, error rate ≤ 0.02, CSAT ≥ 4.0, cost per ticket ≤ $0.05, guardrail block rate ≤ 0.05. Business: tickets, auto_resolved, escalated, awaiting_approval, auto_resolution_rate, agent_hours_saved, cost_avoided_usd, mttr_minutes by resolution, approval_wait_avg_min, by_category, by_resolution. Series: hourly counts by resolution.

### main.py (FastAPI)
Routes: `GET /api/auth/demo-users`, `POST /api/auth/login`, `GET /api/me`, `POST /api/chat`, `GET /api/tickets?scope=mine|all`, `GET /api/tickets/{id}`, `POST /api/tickets/{id}/feedback`, `GET /api/approvals?status=PENDING|ALL`, `POST /api/approvals/{id}/decision`, `GET /api/traces/{id}`, `GET /api/metrics/summary?hours=`, `GET /api/audit`, `GET /metrics`, `GET /healthz`, `GET /readyz`. Middleware: request ID, token-bucket rate limit on POST `/api/*` (429 + Retry-After), HTTP metrics, security headers (nosniff, DENY, no-referrer, CSP, HSTS in prod). Map `PermissionDenied`→403, `NotFound`→404, `Conflict`→409, `ValueError`→400. Pydantic models with length limits. Seed demo data on startup when enabled and the DB is empty. Serve the built frontend as static files when present. OpenAPI docs at `/api/docs`.

### seed.py
Run 18 realistic messages through the real workflow (covering every path), plus one "That didn't work" follow-up. Decide all but one pending approval (one rejection; inject a catalog fault for Power BI to show retries → escalation). Add CSAT ratings, then backdate rows across the last 22 hours so charts and MTTR look realistic.

## Frontend specification

- `api.js`: a fetch wrapper with an in-memory bearer token. `__DEMO__` (Vite `define`) switches to the in-browser engine through a **dynamic import**; production builds alias the engine to `stub.js`.
- **Login:** persona cards with role chips and a one-line description of what each role can do.
- **Shell:** top bar with brand, permission-filtered tabs (Assistant, Approvals, Tickets, Monitoring, Audit), user, role, and "Switch user".
- **Assistant:** left rail of my tickets with status badges; a conversation with suggestion chips; assistant bubbles showing outcome, category, priority, confidence and redaction badges; an agent-path chip row; "View trace →" opening a side **TracePanel** (totals, tokens, cost, and a span timeline with kind-coloured bars and attributes); typing indicator; 5-star rating for finished tickets; composer (Enter sends, Shift+Enter adds a newline).
- **Approvals:** Pending/History toggle; cards with risk and status badges, requester, justification, parameter chips; reason input (required to reject), Approve and Reject buttons; a separation-of-duties notice when you can't decide; a callout quoting the agent's resumed reply.
- **Tickets:** filterable table; a drawer with the escalation handoff, transcript and trace chips.
- **Monitoring:** alert banner; Business outcomes first (6 KPI tiles with target stripes, a stacked SVG bar chart of outcomes per hour, horizontal bars by category); then Health | Trace (mean latency per node); then Quality (CSAT, tool success table) | Safety | Cost; an outcome-mix bar; window selector 24 h / 7 d / 30 d; 15 s refresh.
- **Audit:** table with a hash-prefix column and a "chain verified" badge.
- **Rich text:** render `**bold**`, `[KB-xxxx]` chips and numbered lists by building React elements. **Never use innerHTML.**
- **Styling:** CSS custom properties with a light palette on `:root`, a dark palette under `prefers-color-scheme: dark` and `[data-theme="dark"]`, semantic ok/warn/bad/info badge colours, responsive down to 400 px with no horizontal scroll.

### demo/engine.js
A faithful JavaScript port of the backend workflow (guardrails, BM25 KB, rules triage and compose, tools, approval gate, escalation, approvals with separation of duties, metrics summary, hash-chained audit using a small synchronous SHA-256) that serves the same REST shapes as FastAPI. Use a virtual clock that adds typical latencies (LLM 0.5–1.4 s, tools 40–190 ms) so traces look realistic. Seed the same demo script on first use.

## Deployment specification
- Backend Dockerfile: multi-stage, venv, non-root UID 10001, healthcheck, `/data` volume.
- Frontend Dockerfile: Node 22 build → `nginx-unprivileged` serving on 8080, proxying `/api` to `backend:8000`, with security headers.
- Root Dockerfile: a single container (UI built into `/app/static`, served by FastAPI, `PORT` env respected).
- docker-compose: backend (read-only, no-new-privileges, volume), frontend, plus `observability` profile services Prometheus v3 and Grafana (provisioned datasource and a 10-panel dashboard covering all six pillars).
- Prometheus alert rules: p95 latency, error rate, LLM fallback, guardrail spike, tool failures, low auto-resolution, spend spike.
- k8s: restricted pod-security namespace; ConfigMap + Secret template; backend Deployment (1 replica with a Recreate strategy for SQLite, a comment explaining Postgres + Redis for scale-out), PVC, probes, resources, hardened securityContext; frontend Deployment ×2 + HPA 2–6 + PDB + zone spread; TLS ingress with rate limit; default-deny NetworkPolicies (backend egress only on 53 and 443).
- render.yaml: a Docker web service with healthCheckPath, generated JWT secret, optional API key, 1 GB disk.
- CI: ruff + pytest + pip-audit; UI build; build and push images to GHCR; Trivy scan; deploy to staging; manual-approval production rollout with automatic undo.

## Acceptance tests (must all pass, offline, with the mock LLM)
1. "Outlook is not syncing my inbox" → auto_resolved, cites KB-0005, path `guardian>triage>knowledge>planner>responder`.
2. "I'm locked out of my account" → auto_resolved via the executor; reply contains "unlocked".
3. "Can I get VS Code installed?" → auto_resolved (free licence, no approval).
4. "I forgot my password, please reset it" → AWAITING_APPROVAL with no executor run; admin approves → auto_resolved, "reset link"; ticket RESOLVED.
5. "Please install Tableau" → approver is maya; maya rejects → CLOSED/approval_rejected; deciding twice → Conflict.
6. A message on a ticket awaiting approval → "still waiting".
7. Phishing → escalated, P1, "Security Operations".
8. "Can you help me with the thing from yesterday" → escalated.
9. VPN question → auto_resolved; follow-up "That didn't work" → escalated; handoff `kb_tried` contains KB-0001.
10. `FAULTS["idp"]=10` + lockout → path ends `executor>escalation>responder`.
11. VPN question reply mentions "degraded".
12. An injection attempt → blocked with path `guardian>blocked`.
13. A phone number and email in the message are redacted from stored transcripts and reported in `guardrails.pii_found`.
14. uTorrent → policy_denied with no approval created.
15. A requester cannot approve their own request; an employee cannot approve or read metrics; an employee cannot read another user's ticket (NotFound).
16. The trace contains `llm.triage` and `tool.search_kb` spans; after a 5-star rating the dashboard shows 1 auto-resolution and CSAT 5.
17. The audit chain verifies, then fails after an UPDATE of any row.
18. Guardrails: injection variants blocked; normal requests (including "how do I ignore spam emails") allowed; password and Luhn-valid card redacted; length limit; output filter.
19. Auth round trip; a tampered token is rejected. The circuit breaker opens; an LLM outage falls back to rules; malformed JSON falls back; out-of-range model output is clamped.
20. Prometheus exposition format for counters and histogram buckets.

## Output rules
- Write every file in full, with no ellipses or TODO stubs.
- Keep functions small and documented with module docstrings that explain *why*.
- After generating, run `cd backend && python -m unittest discover -s tests` and `ruff check app tests`, and fix any failure.
- Finish with a README covering quick start (local, Docker, Render), demo personas, a 5-minute walkthrough, configuration, and the architecture summary.
