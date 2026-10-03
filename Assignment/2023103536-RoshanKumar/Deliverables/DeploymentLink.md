# Detour Command Center — Deployment & Live Demo

**Course:** IoC — Scalable Enterprise Architectural Deployments of Agentic AI Solutions  
**Student Name:** Roshan Kumar K  
**Roll Number:** 2023103536  
**Project Name:** Detour — Autonomous Agentic Supply-Chain Disruption Responder  

---

## Live Deployed Application

* **Primary Application URL:**  
  👉 **[https://motion-flow-control.lovable.app/](https://motion-flow-control.lovable.app/)**

* **Lovable Project Workspace:**  
  [https://lovable.dev/projects/972264e4-0b12-47ac-b66e-a74ac82a42c9](https://lovable.dev/projects/972264e4-0b12-47ac-b66e-a74ac82a42c9)

---

## Quick Start & Evaluation Guide for Reviewers

### 1. Primary One-Click Demo Scenario
1. Open **[https://motion-flow-control.lovable.app/](https://motion-flow-control.lovable.app/)**.
2. On the **Overview Dashboard**, locate the prominent **"Simulate Port Closure"** hero button.
3. Click **"Simulate Port Closure"** to trigger a 5-day closure of **Port Meridian**.

### 2. What to Observe (Agentic Closed-Loop Workflow)
* **Visual Shockwave:** Port Meridian pulses red with a shockwave animation; connected route particles freeze in place.
* **Exposed Orders Discovery:** The agent invokes `tool_exposed_orders()` and immediately flags **8 purchase orders (PO-101 through PO-108)** traversing the disrupted corridor.
* **Autonomous Investigation:** In the activity stream, observe the agent calling `tool_stock_cover()`, `tool_route_options()`, and `tool_alt_suppliers()` for each exposed order.
* **Multi-Modal Decision Execution:**
  - **PO-101 & PO-105:** Autonomous vendor substitution (`tool_substitute_supplier`).
  - **PO-102 & PO-103:** Autonomous corridor rerouting via Port Atlas (`tool_reroute_po`).
  - **PO-104:** Autonomous hold decision (`NO_ACTION`) because stock covers 18 days.
  - **PO-107:** Autonomous standard expedite via Air courier (`tool_expedite_po`).
  - **PO-108:** Autonomous escalation to human planner because no feasible route or supplier avoids stockout.
* **Human-in-the-Loop (HITL) Expedite Approval Gate:**
  - For **PO-106 (Battery Packs)**, the expedited Air freight cost increases by **+₹6,800**, exceeding the financial threshold of **₹5,000**.
  - Execution automatically **pauses** and spotlights the approval modal.
  - Review the trade-off card and click **"Approve"** (to execute the expedite) or **"Reject"** (to force the agent to search for secondary alternatives).
* **Forensic Auditability:** Navigate to the **Action Log** tab to inspect the timestamped, immutable event timeline sourced from `audit_logs`.

---

## Core Application Navigation

| Route | View Name | Description |
|---|---|---|
| `/` | **Overview Dashboard** | Real-time KPI telemetry, network health hero visualization, and primary simulation controls. |
| `/network` | **Network Canvas** | Interactive React Flow 4-tier supply graph (Suppliers $\to$ Ports $\to$ Corridors $\to$ Pune Plant) with transit particles. |
| `/orders` | **Purchase Orders** | Comprehensive data table with search, filtering, stock cover days, risk badges, and execution statuses. |
| `/disruptions` | **Disruptions Catalog** | Predefined operational scenarios with severity indicators and trigger actions. |
| `/disruptions/:id` | **Scenario Workspace** | Real-time agent execution cockpit with live telemetry stream, queue depth, and HITL approval cards. |
| `/compare` | **Scenario Compare** | Side-by-side trade-off matrix evaluating candidate options by cost, arrival day, risk, and rationale. |
| `/actions` | **Action Log** | Chronological, filterable forensic audit timeline with interactive tool payload inspection. |
| `/agent-runs` | **Agent Runs History** | Historical logs of previous agent simulation runs, durations, and outcome distributions. |

---

## Local Verification Alternative

If you wish to run the application source code locally:

```bash
cd SOURCE_CODE
npm install
npm run dev
```

Then visit `http://localhost:5173`.
