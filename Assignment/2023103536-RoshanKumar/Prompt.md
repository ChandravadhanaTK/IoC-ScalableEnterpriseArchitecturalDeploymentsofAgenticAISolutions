# MASTER APPLICATION GENERATION PROMPT: DETOUR COMMAND CENTER

> **Role & Objective:** You are an elite Principal Agentic AI Systems Architect and Senior Full-Stack Engineer. Your task is to build **Detour** — a production-ready, autonomous supply-chain disruption response platform with a motion-first cinematic logistics command center interface.
>
> **Live Target Application:** https://motion-flow-control.lovable.app/  
> **Student / Author:** Roshan Kumar K (Roll No: 2023103536)  
> **Course:** IoC — Scalable Enterprise Architectural Deployments of Agentic AI Solutions  

---

## 1. Executive Vision & Core Operating Principle

Build **Detour**, an enterprise-grade agentic supply-chain disruption responder designed for supply-chain planners and logistics directors.

* **The Problem:** Global supply chains are routinely crippled by unexpected shocks — port strikes, weather closures, supplier shutdowns, and canal blockages. Human planners spend hours in spreadsheets manually checking inventory, calling freight forwarders, and calculating stockout deadlines while factory lines risk shutdown.
* **The Solution:** When a port, supplier, or transit corridor fails, Detour autonomously senses the disruption, determines exposed purchase orders, gathers deterministic telemetry via backend tools, evaluates multi-modal alternatives, enforces financial guardrails, executes validated actions, verifies service-level guarantees, and maintains an immutable audit trail.
* **Core Operating Principle:** **Detour is NOT a conversational chatbot.** It does not give passive text recommendations. It is a closed-loop operational control system:
  $$\text{Observe} \longrightarrow \text{Investigate} \longrightarrow \text{Tool Execution} \longrightarrow \text{Reason} \longrightarrow \text{Decide} \longrightarrow \text{Act} \longrightarrow \text{Verify} \longrightarrow \text{Recover / Escalate}$$

---

## 2. Technology Stack & Technical Constraints

* **Frontend:** React 18 + TypeScript bundled with Vite.
* **Styling & HUD Design:** Tailwind CSS with `shadcn/ui` component primitives, styled for a dark, high-contrast logistics command center aesthetic.
* **Network Graph Canvas:** `@xyflow/react` (React Flow) rendering an interactive multi-tier supply network topology.
* **Motion & Particle System:** Custom SVG keyframe particles dynamically animated across active edges, tuned to transit velocity.
* **Routing & Client State:** TanStack Router and TanStack Query for reactive polling, optimistic UI updates, and smooth view transitions.
* **Backend & Persistence:** Supabase PostgreSQL with relational tables, foreign key constraints, and server-side RPC functions.
* **AI Gateway:** Lovable AI Gateway (`google/gemini-3.1-flash-lite`) used strictly for natural language explanation summarization, with 100% resilient deterministic template fallback.
* **Security & Secret Constraints:**
  - Absolute zero client-side secrets. API keys (`LOVABLE_API_KEY`, Supabase service keys) must stay strictly server-side.
  - Zero direct LLM database mutation privileges. The LLM only proposes formatted text; only validated backend tools commit state modifications.

---

## 3. Relational Data Model & Schema Specifications

Create the following relational tables in PostgreSQL/Supabase with complete foreign key integrity:

```sql
-- 1. Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT NOT NULL, -- e.g., 'East Asia', 'Southeast Asia', 'Domestic India', 'Europe'
    lead_days INT NOT NULL DEFAULT 5,
    reliability_score NUMERIC(3,2) NOT NULL DEFAULT 0.95, -- 0.00 to 1.00
    status TEXT NOT NULL DEFAULT 'ACTIVE' -- 'ACTIVE' | 'SHUTDOWN' | 'CONSTRAINED'
);

-- 2. Ports & Logistics Hubs
CREATE TABLE ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    coordinates POINT,
    status TEXT NOT NULL DEFAULT 'OPEN' -- 'OPEN' | 'CONGESTED' | 'CLOSED'
);

-- 3. Products / SKUs
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL
);

-- 4. Routes / Transit Corridors
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL DEFAULT 'Pune Plant',
    transport_mode TEXT NOT NULL, -- 'SEA' | 'RAIL' | 'AIR' | 'ROAD'
    transit_days INT NOT NULL,
    cost NUMERIC(10,2) NOT NULL,
    reliability NUMERIC(3,2) NOT NULL,
    associated_port_id UUID REFERENCES ports(id),
    active BOOLEAN NOT NULL DEFAULT true
);

-- 5. Supplier Products (Catalog & Capacity)
CREATE TABLE supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id),
    product_id UUID REFERENCES products(id),
    available_quantity INT NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL
);

-- 6. Factory Inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    location TEXT NOT NULL DEFAULT 'Pune Plant',
    quantity INT NOT NULL,
    daily_demand INT NOT NULL DEFAULT 10,
    safety_stock INT NOT NULL DEFAULT 50
);

-- 7. Purchase Orders (Orders retain original attributes for auditability)
CREATE TABLE purchase_orders (
    id TEXT PRIMARY KEY, -- e.g. 'PO-101'
    product_id UUID REFERENCES products(id),
    supplier_id UUID REFERENCES suppliers(id),
    original_supplier_id UUID REFERENCES suppliers(id),
    quantity INT NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    current_route_id UUID REFERENCES routes(id),
    original_route_id UUID REFERENCES routes(id),
    required_date DATE NOT NULL,
    expected_arrival DATE NOT NULL,
    eta_offset_days INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ON_SCHEDULE', -- 'ON_SCHEDULE' | 'AT_RISK' | 'REROUTED' | 'EXPEDITED' | 'SUBSTITUTED' | 'ESCALATED'
    disruption_status TEXT NOT NULL DEFAULT 'NORMAL' -- 'NORMAL' | 'EXPOSED' | 'AWAITING_APPROVAL' | 'RESOLVED' | 'STOCKOUT_RISK'
);

-- 8. Disruptions
CREATE TABLE disruptions (
    id TEXT PRIMARY KEY, -- e.g. 'disruption_port_meridian'
    title TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'PORT' | 'ROUTE' | 'SUPPLIER'
    target_id UUID NOT NULL,
    severity TEXT NOT NULL, -- 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    duration_days INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'INACTIVE' -- 'INACTIVE' | 'ANALYZING' | 'ACTIVE' | 'RESOLVED'
);

-- 9. Agent Runs & Telemetry
CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disruption_id TEXT REFERENCES disruptions(id),
    status TEXT NOT NULL DEFAULT 'IDLE', -- 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED'
    total_pos INT NOT NULL DEFAULT 0,
    processed_pos INT NOT NULL DEFAULT 0,
    queue JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 10. Agent Actions
CREATE TABLE agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID REFERENCES agent_runs(id),
    po_id TEXT REFERENCES purchase_orders(id),
    action_type TEXT NOT NULL, -- 'NO_ACTION' | 'REROUTE' | 'EXPEDITE' | 'SUBSTITUTE' | 'ESCALATE'
    route_id UUID REFERENCES routes(id),
    supplier_id UUID REFERENCES suppliers(id),
    reason TEXT NOT NULL,
    confidence NUMERIC(3,2) NOT NULL,
    estimated_cost NUMERIC(10,2) NOT NULL,
    expected_arrival DATE,
    stockout_risk TEXT NOT NULL,
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    approval_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED', -- 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
    execution_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'EXECUTED' | 'FAILED'
    candidates JSONB,
    attempt INT NOT NULL DEFAULT 1,
    executed_at TIMESTAMPTZ
);

-- 11. Immutable Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID REFERENCES agent_runs(id),
    po_id TEXT,
    event_type TEXT NOT NULL, -- 'DISRUPTION_DETECTED' | 'TOOL_CALL' | 'TOOL_RESULT' | 'REASONING' | 'DECISION' | 'APPROVAL_REQUIRED' | 'ACTION_EXECUTED' | 'ACTION_FAILED' | 'VERIFIED' | 'ESCALATED'
    message TEXT NOT NULL,
    metadata JSONB,
    actor TEXT NOT NULL DEFAULT 'AGENT', -- 'AGENT' | 'PLANNER' | 'SYSTEM'
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Realistic Seed Dataset & Primary Scenario Setup

Seed realistic fictional Indian manufacturing data:
* **Manufacturing Hub:** Pune Automotive & Electronics Manufacturing Plant.
* **10 Suppliers:** East Asia Components, Semico India, VoltEdge Electronics, Precision Cable Works, Alpine Sensors, Continental Fasteners, Bharat Dynamics, Pacific Optics, Nippon Power, Deccan Metalworks.
* **6 Ports:** Port Meridian (Primary deepwater hub), Port Atlas (Secondary maritime container terminal), Nhava Sheva (JNPT), Mundra Port, Chennai Port, Colombo Hub.
* **15 Products:** Microcontrollers, Wire Harnesses, Battery Packs, Display Panels, Fasteners, Sensor ICs, Power Modules, Capacitors, Inverters, Actuators, Custom Moldings, Brake Assemblies, Logic Controllers, Relays, Radiators.
* **6 Routes:** 
  1. *Meridian Deepwater Route* (Sea — 8 days, transit via Port Meridian)
  2. *Atlas Rail Express* (Rail — 6 days, transit via Port Atlas)
  3. *Atlas Coastal Feeder* (Sea/Road — 7 days, transit via Port Atlas)
  4. *Air Priority Corridor* (Air — 2 days, direct express air freight)
  5. *Western Highway Corridor* (Road — 4 days, domestic transit)
  6. *Eastern Freight Corridor* (Rail — 5 days, domestic rail freight)
* **40 Purchase Orders:** Distributed across all products and routes.
* **The Benchmark Disruption Scenario:**
  - **Disruption:** **Port Meridian Closure**
  - **Duration:** 5 days
  - **Severity:** HIGH
  - **Target:** Port Meridian hub shutdown
  - **Impact:** Exactly **8 Purchase Orders (PO-101 through PO-108)** are actively exposed because their active route traverses Port Meridian.

---

## 5. Specification of the 8 Deterministic Backend Tools

Implement all 8 backend tools in `src/lib/agent.server.ts` with strict TypeScript validation:

1. `tool_exposed_orders(disruption)`: Queries open POs whose transit route traverses the disrupted hub or shut-down supplier. Returns array with explicit exposure reason.
2. `tool_stock_cover(po)`: Queries on-hand warehouse inventory at Pune Plant, calculates daily demand consumption rate, computes stock cover days ($\lfloor \text{Inventory} / \text{Daily Demand} \rfloor$), and identifies stockout calendar date.
3. `tool_alt_suppliers(productId, quantity, excludeSupplierId)`: Scans qualified replacement vendors from `supplier_products` with `available_quantity >= quantity`, returning capacity, lead days, unit costs, and reliability ratings.
4. `tool_route_options(origin, requiredDay, disruption)`: Discovers active freight routes from origin to Pune Plant bypassing the closed port/route.
5. `tool_reroute_po(poId, routeId, disruption)`: Validates route status, rebinds PO route to alternate surface corridor, updates expected arrival, and commits status `REROUTED`.
6. `tool_substitute_supplier(poId, supplierId, routeId, disruption)`: Asserts replacement supplier status and capacity, rebinds supplier and route, updates unit purchase cost, and commits status `SUBSTITUTED`.
7. `tool_expedite_po(poId, routeId, disruption)`: Asserts transport mode is `AIR`, applies premium freight tariff, and commits status `EXPEDITED`.
8. `tool_verify_service_impact(poId)`: Assesses post-execution arrival date against stock cover deadline and required date, validating SLA compliance (`SAFE`, `AT_RISK`, `STOCKOUT`).

---

## 6. Multi-Criteria Decision Engine & Candidate Policy

For every exposed order, formulate 4 discrete candidates (`NO_ACTION`, `REROUTE`, `EXPEDITE`, `SUBSTITUTE`).

### Hierarchical Decision Logic:
1. **Feasibility Assertion (Hard Constraint):**
   $$\text{Arrival Day} \le \text{Stock Cover Days}$$
   Any candidate that fails this constraint is marked `INFEASIBLE` (violating this means factory line stoppage).
2. **Priority 1 (Meet Delivery Date):**
   Candidates where $\text{Arrival Day} \le \text{Required Delivery Date}$ are prioritized over tardy options.
3. **Priority 2 (Minimize Incremental Cost):**
   Select the candidate incurring the lowest additional expenditure (freight tariff delta + supplier cost delta).
4. **Priority 3 (Reliability Score):**
   When cost deltas are equivalent, select the path with higher historical reliability.

### Resilient AI Explanations:
Pass the chosen candidate through the AI gateway (`gemini-3.1-flash-lite`) to generate a punchy, 1-sentence explanation for the planner. If the gateway times out (>6000ms) or errors, gracefully fall back to the deterministic programmatic string generator (`explain()`).

---

## 7. Human-in-the-Loop (HITL) Financial Governance

* **Approval Rule:**
  $$\text{Incremental Cost} > ₹5,000 \implies \text{Pause for Human Approval}$$
* When an `EXPEDITE` action incurs over ₹5,000 in additional cost (e.g., PO-106 at +₹6,800), do NOT execute automatically.
* Flag order as `AWAITING_APPROVAL` and render an interactive approval modal on the UI.
* **On Planner Approval:** Execute `tool_expedite_po()`, record the planner’s identity, and proceed.
* **On Planner Rejection:** Add action key to `excluded_candidates` list, re-trigger the candidate evaluation loop, and test remaining alternatives or escalate.

---

## 8. Motion-First UI & Cinematic Command Center

The application must feel like a **living, breathing logistics command center**, not a static spreadsheet:

1. **Dark Cinematic Theme:** Deep navy/slate background (`#0B0F19`), subtle animated grid backdrop, high-contrast cyan/amber/emerald HUD typography.
2. **React Flow Network Graph Canvas:**
   - 4-Tier Interactive Supply Graph: Suppliers $\to$ Transit Ports $\to$ Multi-modal Corridors $\to$ Factory Plant.
   - Continuous animated SVG shipment particles flowing along edges.
   - Particle speed tuned to transport mode: rapid pulses for Air, paced intervals for Rail, steady flow for Sea.
3. **Signature Reroute Animation Sequence:**
   $$\text{Port Meridian closes} \longrightarrow \text{Node pulses red with concentric shockwave} \longrightarrow \text{Corridor particles freeze}$$
   $$\longrightarrow \text{Agent evaluates alternatives} \longrightarrow \text{Glowing cyan vector traces path via Port Atlas} \longrightarrow \text{Shipment particles resume}$$
4. **Human-in-the-Loop Spotlight:** Dims the surrounding dashboard and highlights pending approval cards with a pulsating micro-border.
5. **Rolling Numeric Counters:** Dashboard metrics use smooth numerical interpolation during state changes.
6. **Accessibility:** Full support for `prefers-reduced-motion` with clean, high-contrast static indicators.

---

## 9. Required Screen Navigation & Architecture

Persistent responsive sidebar with 6 core navigation items:

1. **Overview Dashboard (`/`):**
   - KPI telemetry bar (Total POs, Active Disruptions, At-Risk Orders, Pending Approvals, Resolved POs, Escalations).
   - Live Network Health hero visualization with animated particles.
   - Prominent, primary **"Simulate Port Closure"** demo button and **"Reset Demo"** control.
   - Recent agent activity feed.
2. **Network Canvas (`/network`):** Fullscreen interactive React Flow supply chain graph with node filtering and zoom controls.
3. **Purchase Orders (`/orders`):** Comprehensive, searchable, filterable table with PO ID, Product, Supplier, Qty, Required Date, Expected Arrival, Stock Cover, Risk Badge, and Current Status.
4. **Disruptions (`/disruptions`):** Catalog of predefined disruption scenarios with severity ratings and trigger controls.
5. **Scenario Workspace (`/disruptions/:id`):** Deep-dive command workspace during an active run showing exposed order queue, live agent activity terminal, candidate trade-off matrix, and interactive HITL approval cards.
6. **Scenario Compare (`/compare`):** Side-by-side trade-off matrix comparing candidate actions by cost, arrival date, risk, and rationale.
7. **Action Log (`/actions`):** Filterable, chronological forensic audit timeline sourced directly from `audit_logs` with interactive tool call payload expansion.
8. **Agent Runs (`/agent-runs`):** Historical record of past disruption simulations with execution durations, affected PO counts, and outcome distributions.

---

## 10. Primary Demo Scenario Outcome Verification

When the planner clicks **Simulate Port Closure**, the application must process exactly 8 exposed purchase orders with the following distinct, realistic outcomes:

1. **PO-101:** `SUBSTITUTE` (Semico India, +₹1,200) — Auto-executed.
2. **PO-102:** `REROUTE` (Port Atlas Rail, +₹800) — Auto-executed.
3. **PO-103:** `REROUTE` (Port Atlas Coastal Feeder, +₹1,450) — Auto-executed.
4. **PO-104:** `NO_ACTION` (Stock covers 18 days, holds safely, ₹0) — Auto-executed.
5. **PO-105:** `SUBSTITUTE` (VoltEdge Electronics, +₹2,100) — Auto-executed.
6. **PO-106:** `EXPEDITE` (Air Priority Corridor, +₹6,800) — **PAUSES FOR APPROVAL** (Cost > ₹5,000 threshold). Upon planner approval, executes and verifies.
7. **PO-107:** `EXPEDITE` (Air Express Courier, +₹3,900) — Auto-executed.
8. **PO-108:** `ESCALATE` (No alternative avoids stockout deadline) — **Escalates to Planner** with high-risk warning.
