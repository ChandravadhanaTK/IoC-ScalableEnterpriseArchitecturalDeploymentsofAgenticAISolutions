# Detour — Agentic Supply-Chain Disruption Responder

**Student Name:** Roshan Kumar K  
**Roll No:** 2023103536  
**Course:** IoC — Scalable Enterprise Architectural Deployments of Agentic AI Solutions  
**Live Deployed Application (Lovable):** [https://motion-flow-control.lovable.app/](https://motion-flow-control.lovable.app/)  
**Lovable Project Workspace:** [https://lovable.dev/projects/972264e4-0b12-47ac-b66e-a74ac82a42c9](https://lovable.dev/projects/972264e4-0b12-47ac-b66e-a74ac82a42c9)  

---

## 📌 Project Overview

**Detour** is an autonomous, agentic supply-chain disruption response platform built for enterprise supply-chain planners. 

When major logistics nodes fail (such as a 5-day closure of a primary container port like Port Meridian), human planners are typically forced into hours of manual spreadsheet reconciliation. **Detour replaces this with a closed-loop agentic workflow:**

$$\text{Observe} \longrightarrow \text{Investigate} \longrightarrow \text{Tool Use} \longrightarrow \text{Reason} \longrightarrow \text{Decide} \longrightarrow \text{Act} \longrightarrow \text{Verify} \longrightarrow \text{Recover / Escalate}$$

### Key Capabilities:
* **Autonomous Disruption Scoping:** Instantly identifies all purchase orders traversing disrupted infrastructure using deterministic tools (`tool_exposed_orders`).
* **Multi-Modal Decision Engine:** Evaluates candidate mitigations (`NO_ACTION`, `REROUTE`, `EXPEDITE`, `SUBSTITUTE`) against stockout deadlines, freight cost, lead time, and vendor reliability.
* **Human-in-the-Loop (HITL) Financial Governance:** Expedites exceeding **₹5,000** additional cost (e.g. PO-106 at +₹6,800) automatically pause for planner authorization before execution.
* **Living Logistics Command Center:** Dark-mode cinematic HUD powered by React Flow with animated shipment particles whose speeds correspond to transit modes (Air rapid pulses, Rail paced intervals, Sea steady currents).
* **Immutable Audit Trail:** Forensic ledger recording every tool call, reasoning step, state change, and verification result into PostgreSQL `audit_logs`.

---

## 🚀 Live Demo & How to Test

1. Visit **[https://motion-flow-control.lovable.app/](https://motion-flow-control.lovable.app/)**.
2. On the **Overview Dashboard**, click the primary **"Simulate Port Closure"** button.
3. Observe:
   - **Port Meridian** pulses red with a shockwave animation, freezing connected route particles.
   - Detour discovers **8 exposed purchase orders (PO-101 to PO-108)**.
   - The agent calls deterministic tools (`stock_cover`, `route_options`, `alt_suppliers`) in real-time.
   - Orders are resolved with distinct outcomes (2 Reroutes, 2 Expedites, 2 Substitutions, 1 Hold, 1 Escalation).
   - **PO-106** triggers the **₹5,000 Human-in-the-Loop approval modal**—click **Approve** or **Reject** to guide the agent.
4. Check the **Action Log** (`/actions`) to view the complete cryptographic audit trail.

---

## 📁 Repository Structure & Deliverables

```text
2023103536-Roshan Kumar/
├── README.md                              <-- Project overview & student details
├── DEPLOYMENT_LINK.md                     <-- Live deployment URL & reviewer guide
├── Prompt.md                              <-- Master generation prompt for Lovable
├── Deliverables/                          <-- 5 Capstone enterprise architecture artifacts
│   ├── README.md                          (Deliverables index)
│   ├── SystemArchitecture.md              (Deliverable 1: Layers, trust boundaries & integrations)
│   ├── AgentWorkflowDesign.md             (Deliverable 2: Roles, states, tools, approvals & failure loops)
│   ├── DeploymentStrategy.md              (Deliverable 3: Runtime, scaling, resilience & environments)
│   ├── SecurityModel.md                   (Deliverable 4: Identity, authorization, secrets & audit)
│   ├── MonitorDashboardDesign.md          (Deliverable 5: Health, telemetry, quality, safety & cost)
│   ├── DeploymentLink.md                  (Live URL documentation copy)
│   └── Prompt.md                          (Generation prompt copy)
└── SOURCE_CODE/                           <-- Complete application source code
    ├── package.json
    ├── vite.config.ts
    ├── src/                               (React 18, TypeScript, React Flow, agent orchestrator)
    ├── supabase/                          (PostgreSQL schema migrations & seed data)
    └── public/
```

---

## 🛠️ Local Development Setup

To run the application locally on your machine:

```bash
cd SOURCE_CODE
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
