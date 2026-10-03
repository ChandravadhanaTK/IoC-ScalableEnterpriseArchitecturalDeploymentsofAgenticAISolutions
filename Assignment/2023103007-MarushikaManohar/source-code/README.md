# SupplyChainIQ — Agentic Inventory & Replenishment Platform

> *"The prototype simulates agent reasoning using deterministic policy and decision logic. The production architecture can replace these decision modules with enterprise LLM/agent runtimes."*

SupplyChainIQ is an enterprise-grade agentic inventory management and replenishment orchestration platform. It is a high-density, real-time operations dashboard (NOT a chatbot) driven by 6 deterministic TypeScript agent engines, an explicit state machine, a controlled tool gateway, strict RBAC, human-in-the-loop approvals, and an append-only audit ledger.

---

## Key Features

- **6 Specialized Agent Engines:** Orchestrator, Demand (moving averages), Inventory (projected stock), Supplier (multi-attribute scoring), Risk & Policy (HITL governance), and Procurement (idempotent PO issuing).
- **Explicit Workflow State Machine:** Strict linear progression (`CREATED → ANALYZING → POLICY_CHECK → RISK_ASSESSMENT → RECOMMENDATION_READY → APPROVED → PURCHASE_ORDER_CREATED → COMPLETED`) with failure and retry branches.
- **Controlled Tool Gateway (10 Tools):** Modular Zod-validated tool wrappers with least-privilege permission grants.
- **Role-Based Access Control (RBAC):** Server-side enforcement with live Persona Switcher (Elena Rostova, Marcus Vance, Sarah Chen, Alex Mercer).
- **Human-in-the-Loop Approval Center:** Auditable evidence display with mandatory justification for rejections.
- **SHA-256 Idempotency:** Guaranteed duplicate-prevention on repeated procurement invocations.
- **Append-Only Audit Ledger & Telemetry:** Immutable trace of all decisions, state transitions, and tool calls.
- **Zero-Config Resilience:** Automatic LocalStorage / IndexedDB fallback with pristine deterministic seed data.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run unit and integration tests (11 tests covering all scenarios, agents, idempotency, RBAC)
npm test

# 3. Build production bundle (Strict TypeScript checks + Nitro)
npm run build

# 4. Start local development server
npm run dev
```

---

## Deliverables & Documentation

- [prompt.md](file:///Users/marushikamanohar/Programming/ioc/pixel-perfect-preview/prompt.md) — Master build specification and requirements.
- [documentation.md](file:///Users/marushikamanohar/Programming/ioc/pixel-perfect-preview/documentation.md) — Comprehensive technical system architecture and guide.
- [deliverables.md](file:///Users/marushikamanohar/Programming/ioc/pixel-perfect-preview/deliverables.md) — 5 Capstone Deliverables with detailed Mermaid diagrams.
- [deployed-link.txt](file:///Users/marushikamanohar/Programming/ioc/pixel-perfect-preview/deployed-link.txt) — Production deployment and repository links.
