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

---

## 3. DETERMINISTIC AGENT ARCHITECTURE (6 AGENTS)

Implement as isolated TypeScript modules under `src/agents/`. Agents must NOT run direct SQL or mutate datasets directly — all access goes through the tool layer. Do NOT just print agent names in the UI; each agent must produce real, structure-typed output consumed by later stages.

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

---

## 4. WORKFLOW STATE MACHINE

Implement strict transition validation in `src/services/workflowEngine.ts`. Reject any transition not in the allowed graph; the UI must not be able to force arbitrary states.

**States:** `CREATED, ANALYZING, POLICY_CHECK, RISK_ASSESSMENT, RECOMMENDATION_READY, AWAITING_APPROVAL, APPROVED, REJECTED, PURCHASE_ORDER_CREATED, COMPLETED, RETRYING, ESCALATED, FAILED`

---

## 5. CONTROLLED TOOL LAYER (10 TOOLS)

1. Inventory Tool
2. Demand History Tool
3. Supplier Tool
4. Availability Tool
5. Policy Tool
6. Risk Matrix Tool
7. Purchase Order Tool
8. Notification Tool
9. Audit Tool
10. Telemetry Tool
