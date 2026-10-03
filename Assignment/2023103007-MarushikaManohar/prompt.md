# SupplyChainIQ — Master Build Prompt (Antigravity / Lovable)

**Course:** Scalable Enterprise Architectural Deployments of Agentic AI Solutions
**Project:** SupplyChainIQ — Agentic Inventory & Replenishment Platform
**Goal:** A functional, deterministic, testable enterprise agentic prototype (NOT a chatbot, NOT a fake production system).

---

## 0. EXECUTIVE INSTRUCTION

You are the Lead AI Systems Engineer. Build **SupplyChainIQ**, an enterprise agentic inventory and replenishment platform. Treat this specification as the primary source of truth.

**IMPLEMENT (fully functional prototype):**
Deterministic TypeScript agent engines, an explicit workflow state machine, a controlled tool layer, RBAC, human-in-the-loop approvals, an append-only audit ledger, operational telemetry, and a modern enterprise operations dashboard.

**DOCUMENT ONLY (do NOT implement at runtime):**
Kubernetes, Redis/RabbitMQ, SAP/Oracle/NetSuite connectors, enterprise SIEM, HSMs, multi-region infra, OpenTelemetry collector sidecars, real enterprise IAM. Keep these as architecture documentation concepts only.

**CORE PRINCIPLES:**
1. Operations-dashboard UI — NOT a chatbot, no conversational UI, no fake "AI brain" animations.
2. Deterministic agent logic in TypeScript services. No external LLM required at runtime, but an optional explanation extension point is allowed.
3. Auditable decision evidence only, e.g. `Projected stock (-15) < Safety stock (50)`, `Order value ($125,000) > Spending limit ($10,000)`.
4. Never fake audit logs, telemetry, approvals, or state transitions. If it appears in the UI, the underlying logic must exist.

---

## 1. TECHNICAL STACK & BUILD CONSTRAINTS

- **Framework:** React 18+ with TypeScript (Strict Mode)
- **Build tooling:** Vite
- **UI:** Tailwind CSS + shadcn/ui + Lucide icons
- **State/data:** React Query / Zustand for state; Zod for runtime validation
- **Persistence:** Supabase JS client (Auth + PostgreSQL + RLS where practical) with a **seamless IndexedDB / LocalStorage fallback** so the app runs with zero config when Supabase env vars are absent. The prototype must never be left non-functional due to backend setup.
- **Local dev:** `npm install && npm run dev`
- **Build:** `npm run build`
- **Zero-tolerance:** ZERO TypeScript errors, missing imports, or unhandled component states.

---

## 2. USER ROLES & RBAC

Enforce RBAC in application logic and data access — not merely by hiding buttons. Never trust client-supplied role, workflow state, approval status, or permissions.

| Role | View Inventory | Request Replenishment | Review & Approve | Execute PO | Administer Policies |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Inventory Operator | Yes | Yes | No | No | No |
| Supply Chain Manager | Yes | Yes | Yes | No | No |
| Procurement Officer | Yes | No | No | Yes | No |
| Administrator | Yes | Yes | Yes | Yes | Yes |

Add a **persistent top-bar Persona Switcher** for live demo and evaluator verification (seeded demo users, e.g. Elena Rostova – Supply Chain Manager, Marcus Vance – Inventory Operator, Sarah Chen – Procurement Officer, Alex Mercer – Administrator).

## 3. DETERMINISTIC AGENT ARCHITECTURE (6 AGENTS)

Implement as isolated TypeScript modules under `src/agents/`. Agents must NOT run direct SQL or mutate datasets directly — all access goes through the tool layer. Do NOT just print agent names in the UI; each agent must produce real, structure-typed output consumed by later stages.

```
                 ┌──────────────────────┐
                 │  Orchestrator Agent  │
                 └──────────┬───────────┘
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌─────────────────┐  ┌────────────────┐
│ Demand Agent │   │ Inventory Agent │  │ Supplier Agent │
└───────┬──────┘   └────────┬────────┘  └───────┬────────┘
        └───────────────────┼───────────────────┘
                            ▼
               ┌──────────────────────────┐
               │    Risk & Policy Agent    │
               └────────────┬─────────────┘
             ┌──────────────┴──────────────┐
             ▼                             ▼
      [ Auto-Approved ]            [ HITL Approval ]
             └──────────────┬──────────────┘
                            ▼
               ┌──────────────────────────┐
               │     Procurement Agent     │
               └────────────┬─────────────┘
                            ▼
               ┌──────────────────────────┐
               │ Purchase Order & Audit    │ → Monitoring
               └──────────────────────────┘
```

1. **Orchestrator Agent** (`src/agents/orchestrator.ts`) — coordinates state transitions, dispatch order, state history, retry counters, failure routing.
2. **Demand Agent** (`src/agents/demandAgent.ts`) — `Expected Demand = Moving Average(Demand History) * Seasonal Factor`. Emits trend `UP | DOWN | STABLE`.
3. **Inventory Agent** (`src/agents/inventoryAgent.ts`) — `Projected Stock = Current Inventory − Expected Demand + In-Transit Stock`.
   - `HIGH`: Projected Stock < Safety Stock
   - `MEDIUM`: Safety Stock ≤ Projected Stock < (Safety Stock × 1.5)
   - `LOW`: otherwise
4. **Supplier Agent** (`src/agents/supplierAgent.ts`) — `Supplier Score = (w_price × PriceScore) + (w_lead × LeadScore) + (w_rel × ReliabilityRating)`. Defaults `w_price=0.35, w_lead=0.30, w_rel=0.35`; weights must sum to 1. Never simply choose the cheapest — show contributing factors.
5. **Risk & Policy Agent** (`src/agents/riskPolicyAgent.ts`) — sets human approval when **ANY** is true:
   - Order Value > Policy Spending Limit (default $10,000)
   - Stockout Risk = HIGH
   - Supplier Reliability < Minimum Quality Threshold (default 85%)
   - Emergency Flag = TRUE
   Return the exact triggering rules (e.g. `["ORDER_VALUE_THRESHOLD_EXCEEDED","HIGH_STOCKOUT_RISK"]`).
6. **Procurement Agent** (`src/agents/procurementAgent.ts`) — runs only post-approval (auto or manual); creates an **idempotent** simulated PO and signs audit events. It must never bypass the approval gate.

**Every agent returns a JSON shape + decision evidence. Never emit fabricated chain-of-thought.**

---

## 4. WORKFLOW STATE MACHINE

Implement strict transition validation in `src/services/workflowEngine.ts`. Reject any transition not in the allowed graph; the UI must not be able to force arbitrary states.

**States:** `CREATED, ANALYZING, POLICY_CHECK, RISK_ASSESSMENT, RECOMMENDATION_READY, AWAITING_APPROVAL, APPROVED, REJECTED, PURCHASE_ORDER_CREATED, COMPLETED, RETRYING, ESCALATED, FAILED`

**Transitions:**
- `CREATED → ANALYZING → POLICY_CHECK → RISK_ASSESSMENT → RECOMMENDATION_READY`
- `RECOMMENDATION_READY → APPROVED` (auto-approval criteria pass)
- `RECOMMENDATION_READY → AWAITING_APPROVAL` (HITL trigger met)
- `AWAITING_APPROVAL → APPROVED` (manager approve) `| REJECTED` (manager reject) `| ESCALATED` (SLA timeout)
- `APPROVED → PURCHASE_ORDER_CREATED → COMPLETED`
- `Tool Failure → RETRYING → (retries < 3 success) → resume | (retries exhausted) → FAILED`
- Policy/risk hard violation → `POLICY_CHECK → ESCALATED` or `REJECTED`

Each transition writes a workflow event with actor, role, timestamp, from/to state, and reason.

---
## 5. CONTROLLED TOOL LAYER (10 TOOLS)

Implement modular tool wrappers under `src/tools/`. Agents access data **exclusively** through these functions. Every tool must: (1) validate input with Zod, (2) check auth/context, (3) perform the operation, (4) return strongly-typed output, (5) emit an audit/telemetry event.

1. **Inventory Tool** — item balance, safety thresholds, reorder levels.
2. **Demand History Tool** — 30/60/90-day consumption velocity.
3. **Supplier Tool** — active supplier profiles, prices, lead times, reliability.
4. **Availability Tool** — lead-time availability and capacity.
5. **Policy Tool** — corporate spend limits, minimum reliability, approval matrix.
6. **Risk Matrix Tool** — policy compliance / risk validation.
7. **Purchase Order Tool** — writes idempotent PO records to the store.
8. **Notification Tool** — in-app approval queue alerts.
9. **Audit Tool** — integrates with the append-only audit ledger.
10. **Telemetry Tool** — emits latency/error metrics to the monitoring store.

**Agent → tool permission matrix (least privilege):**
- Demand → DemandHistoryTool
- Inventory → InventoryTool
- Supplier → SupplierTool, AvailabilityTool
- Risk & Policy → PolicyTool, RiskMatrixTool
- Procurement → PurchaseOrderTool, InventoryTool, AuditTool
- Orchestrator → AuditTool, TelemetryTool, NotificationTool

**Idempotency:** PO creation is keyed by `SHA256(workflowId + "_" + supplierId + "_" + quantity)`. A repeated Procurement execution for the same approved action returns the existing PO — no duplicates, no double inventory updates.

---

## 6. USER INTERFACE & NAVIGATION

Modern, responsive enterprise operations layout with left sidebar navigation and light/dark mode. Dense, professional data tables — not a chatbot.

1. **Dashboard** — executive KPIs, inventory risk distribution chart, active workflow feed, pending approval queue preview, system health.
2. **Inventory Management** — searchable/filterable catalog: current stock, safety stock, reorder point, projected stock, color-coded risk badge (LOW/MEDIUM/HIGH), quick "Replenish" action.
3. **Replenishment Requests** — form (Product, Warehouse, Quantity, Emergency Flag, Preferred Date, Notes) that triggers the Orchestrator workflow.
4. **Supplier Portal** — vendor scorecards, lead times, reliability, capacity, catalog.
5. **Approval Center (HITL)** — pending queue with rule-evaluation highlights, decision evidence, Approve / Reject (rejection requires a reason).
6. **Purchase Orders** — table of generated POs, itemized costs, supplier, state.
7. **Agent Operations** — per-workflow visual timeline/stepper: each agent execution, status, duration, tool calls, structured I/O, decision evidence, retries.
8. **Audit & Trace** — append-only event ledger with filters (user, agent, workflow, action, result, date).
9. **Monitoring & Telemetry** — system health, agent latency/error rates, safety/policy violation metrics, business outcomes.
10. **Settings / Policy Admin** — configure spend limits, min reliability, retry limit, approval SLA, seed reset, and admin-only simulation controls.

---
## 7. HUMAN-IN-THE-LOOP & FAILURE HANDLING

**Approval Center:** when a workflow requires approval, pause it (`AWAITING_APPROVAL`), add it to the queue, and display the reason plus the full decision evidence (demand, inventory, supplier, risk/policy). Only an authorized Supply Chain Manager/Admin may decide. Approve → `APPROVED → Procurement → PO → COMPLETED`; Reject → `REJECTED` + audit event + mandatory reason.

**Failure taxonomy (all must be implemented and demonstrable):**
- **A — No suitable supplier:** no vendor satisfies constraints → `ESCALATED` (reason shown).
- **B — Supplier unavailable:** primary fails capacity → auto-search alternatives → re-score → continue.
- **C — Policy violation:** hard limit/blacklist breached → block → `REJECTED` or `ESCALATED` → audit event.
- **D — Tool failure:** transient error → `RETRYING` → exponential backoff, retry limit = 3 → resume or `FAILED`.
- **E — Approval SLA timeout:** pending past SLA → `ESCALATED` + notification.

---

## 8. AUDIT LOGGING & MONITORING

**Audit (append-only, ordinary users cannot edit):** record timestamp, user, role, workflow ID, agent, action, state transition, tool invocation, result, severity, and decision details. Provide a dedicated Audit/Trace page with filters. **Do not expose chain-of-thought — structured events only.** Example event:
```json
{ "timestamp": "2026-10-03T10:30:00Z", "userId": "usr_987", "role": "SUPPLY_CHAIN_MANAGER",
  "workflowId": "WF-1042", "agent": "RiskAndPolicyAgent", "action": "EVALUATE_APPROVAL_POLICY",
  "result": "SUCCESS", "details": { "orderValue": 125000, "approvalRequired": true,
  "policyTrigger": "ORDER_VALUE_THRESHOLD_EXCEEDED" } }
```

**Monitoring dimensions:**
- **System health:** active/completed/failed workflows, pending approvals, avg workflow duration, status.
- **Agent telemetry:** per-agent executions, success rate, errors, average latency, health.
- **Safety/security:** policy violations, authorization failures, rejected procurements, failed tool calls, approval timeouts.
- **Business outcomes:** low-stock items, high-risk items, pending replenishments, approved/rejected POs, emergency orders, estimated inventory value.

Metrics should derive from real application state where practical; if simulated, label them clearly as prototype telemetry.

---

## 9. DEMO SCENARIOS (ONE-CLICK SIMULATOR)

Provide deterministic, reproducible scenarios (admin/dev controls only):
1. **Routine:** low stock → low risk → auto-approval → PO created → completed.
2. **High risk:** projected stock < safety stock → HIGH → `AWAITING_APPROVAL` → manager approves → PO.
3. **Policy violation:** order value > spend limit → policy flag → manager rejects → `REJECTED` + audit.
4. **Supplier issue:** reliability < 85% → approval required → manager decision.
5. **Fault injection:** tool timeout → `RETRYING` → backoff retry succeeds → completes.

Seed real, deterministic data: 10 products, 5 warehouses, 6 suppliers (with overlapping products), and demand history. No random data on critical demo paths.

---
## 10. DATA MODEL & PERSISTENCE

Entities (with relationships and consistent timestamps):
`users, roles, products, inventory, warehouses, suppliers, supplier_products, demand_history, replenishment_requests, workflow_runs, workflow_events, agent_executions, purchase_orders, approvals, policies, audit_logs, notifications, system_metrics`

Use workflow IDs to correlate: user request → workflow → agent executions → tool calls → approval → purchase order.

Use atomic/transactional handling for critical operations: `Approval + PO Creation + Workflow State Update + Audit Event`.

If Supabase is available, define tables + RLS policies. If it is not configured, fall back cleanly to IndexedDB/LocalStorage so the prototype still runs and persists across refresh.

---

## 11. SECURITY MODEL

Implement prototype-level security (do not claim it equals production enterprise security):
- **Authentication:** Supabase Auth (JWT) when configured; demo/session identity otherwise.
- **Authorization:** server-side RBAC enforcement; never trust client-supplied role/state/permissions.
- **Row-Level Security** where appropriate.
- **Input validation:** Zod on every tool input and mutation.
- **Guardrails:** input (schema/type/range/role), decision (policy limits, mandatory HITL gate), action (output schema, idempotency lock, audit emission).
- **Secrets:** never in frontend source; commit only `.env.example`; exclude `.env`, `.env.*`.
- **Idempotency:** prevent duplicate POs on retry.
- **Optional LLM extension point:** read-only "explanation service" that receives structured agent outputs and returns natural language. It must NEVER approve/reject, modify inventory, create POs, change roles, or bypass authorization. Deterministic fallback if it fails.

---

## 12. DEPLOYMENT STRATEGY (prototype)

```
GitHub → Vercel / Lovable hosting → React + Vite SPA → Supabase Auth + PostgreSQL
```
- Must deploy without any paid AI service.
- Document all env vars in `.env.example` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, optional keys). Never commit real secrets.
- Record the deployed URL in `deployed-link.txt`.
- Production architecture (Kubernetes autoscaling, message queues, ERP connectors, SIEM, secret manager, durable orchestrator) stays in the **deliverables document only**.

---

## 13. ERROR HANDLING & CODE QUALITY

- Handle: no inventory, no suitable supplier, tool failure, invalid request, policy violation, rejection, approval timeout, retry exhaustion. Never fail silently — show useful UI error/empty/loading states.
- Modular structure (no giant single component):

```
src/
├── agents/       # Deterministic agent modules
├── components/   # shadcn/layout/charts UI
├── data/         # Deterministic seed data
├── hooks/        # Custom React hooks
├── pages/        # Application pages
├── services/     # Workflow engine, state machine, persistence adapter
├── tools/        # 10 tool abstractions (Zod validated)
└── types/        # TypeScript interfaces
```
- Do NOT overengineer. No unnecessary infrastructure.

---
## 14. FIVE CAPSTONE DELIVERABLES (must accompany the code)

Produce these five artifacts as documents (Mermaid diagrams where relevant):
1. **Architecture Diagram** — layers, components, trust boundaries (client → identity/RBAC → orchestrator → agents → tool gateway → data + observability), tool integrations.
2. **Agent Workflow Design** — agent roles, tool-permission matrix, states, handoffs, approvals, failure paths.
3. **Deployment Strategy** — prototype runtime, environments, scaling, resilience, release/rollback.
4. **Security Model** — identity, RBAC, guardrails, secrets, privacy, audit, optional-LLM safety.
5. **Monitoring Dashboard Design** — health, trace, quality, safety, cost, business outcomes.

**Repo layout:**
```
Assignment/RollNo-Name/
├── prompt.md
├── documentation.md
├── deliverables.md
├── deployed-link.txt
└── SupplyChainIQ/
    ├── src/  public/  package.json  README.md  .env.example
```
Do not create a separate repository. Explicitly include the statement: *"The prototype simulates agent reasoning using deterministic policy and decision logic. The production architecture can replace these decision modules with enterprise LLM/agent runtimes."*

---

## 15. IMPLEMENTATION ORDER

1. **Foundation:** project setup, persistence adapter (Supabase + fallback), schema, seed data, RBAC + Persona Switcher.
2. **Core views:** Dashboard, Inventory, Suppliers, Replenishment form.
3. **Agent system:** tool layer (Zod), 6 agents, Orchestrator, state machine.
4. **Human oversight:** Approval Center, approve/reject with reason, audit events.
5. **Resilience:** retries, supplier fallback, escalation, simulation controls.
6. **Governance:** audit logs, workflow trace, security controls, policy admin.
7. **Monitoring:** system health, agent telemetry, safety + business metrics.
8. **Production readiness:** error/loading states, production build, deploy, docs.

---

## 16. ACCEPTANCE CRITERIA (checklist)

- [ ] `npm run build` succeeds with 0 TypeScript/Vite errors.
- [ ] 6 agents implemented as modular TypeScript services (no fake UI names).
- [ ] Orchestrator enforces valid state transitions; UI cannot force arbitrary states.
- [ ] Tool layer isolates data access; agents never touch the DB directly.
- [ ] RBAC enforced in logic + data access; Persona Switcher updates nav/actions live.
- [ ] Approval + rejection (with reason) + SLA timeout steps work end-to-end.
- [ ] PO creation is idempotent (no duplicates on retry).
- [ ] 5 failure modes handled and demonstrable.
- [ ] Append-only audit ledger records real events; monitoring metrics update from real state.
- [ ] Refreshing the page preserves seeded data and workflow state.
- [ ] Production build deployed; deployed URL recorded.
- [ ] All 5 capstone artifacts documented.

---

## 17. DO NOT (non-goals)

- Do NOT build a chatbot or AI prompt bar.
- Do NOT hard-code or fake workflow outcomes, audit logs, approvals, or metrics.
- Do NOT allow frontend-only authorization or bypass server-side role checks.
- Do NOT execute direct SQL inside agent modules.
- Do NOT emit synthetic chain-of-thought.
- Do NOT create duplicate purchase orders on retries.
- Do NOT omit failure/escalation paths because the happy path works.
- Do NOT implement production infra (K8s, queues, ERP, SIEM, HSM) at runtime — document it only.
- Do NOT overengineer the prototype.

**Success statement:** SupplyChainIQ is an enterprise agentic workflow platform where specialized agents analyze inventory and supply-chain conditions, deterministic policies govern high-impact decisions, humans approve sensitive actions, controlled tools execute operations, and every significant event is observable and auditable — with enterprise LLM integration treated as an architectural extension, not a runtime dependency.
---