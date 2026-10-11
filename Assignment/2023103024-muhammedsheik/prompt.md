# Consolidated Specification & Master Prompt: Agentic Assistant Application

> **Purpose:** This document contains the master prompt and technical specification to regenerate the complete, production-grade **Agentic Assistant** web application from scratch.

---

```markdown
You are an expert AI system architect and full-stack software engineer working inside a repository using Antigravity.

Build a complete, polished, runnable web application called "Agentic Assistant" that demonstrates an enterprise-ready autonomous agentic AI architecture.

CRITICAL INSTRUCTIONS:
- Do NOT use Lovable.
- Build the entire application inside the project folder: <ROLLNO-NAME>/
- Make the application runnable locally using standard node/npm commands (e.g. `npm run dev`).
- The application MUST work out-of-the-box WITHOUT requiring external LLM API keys by implementing a realistic, deterministic simulated agent reasoning and execution engine.
- Every navigation tab, button, modal, chart, and interactive control must be fully functional. Do NOT leave placeholder screens, dummy TODOs, or broken buttons.
- Follow enterprise aesthetics: Dark Navy background theme (#060913 to #0B0F19), cards (#0E1424, #111827), subtle borders (#1E293B, #334155), professional typography, smooth CSS micro-interactions, and color-coded accents (Blue #3B82F6, Purple #8B5CF6, Green #10B981, Orange #F59E0B, Cyan #06B6D4).

---

## 1. PROJECT OBJECTIVE

Create an enterprise-ready Autonomous Multi-Agent AI Platform that models end-to-end task decomposition, dynamic planning Directed Acyclic Graphs (DAG), tool integration sandboxes, Model Context Protocol (MCP) execution, Human-in-the-Loop (HITL) approval gates, and Defense-in-Depth safety guardrails with OpenTelemetry distributed tracing.

---

## 2. FUNCTIONAL REQUIREMENTS

The application must implement seven primary views accessible via a fixed left sidebar navigation:

### A. Dashboard (`/dashboard`)
- Executive fleet summary KPI cards: Total Requests Processed (e.g. 142,890), Overall Success Rate (99.2%), Avg Latency (1.18s), Token Cost Estimate ($48.20), Security Interceptions (142).
- Hourly Throughput & Latency Trend Chart: 24-hour interactive SVG volume and latency distribution.
- Active Agent Fleet Matrix: Real-time status, model versions, uptime, and queue health for all core agent nodes.
- Quick Launch Scenarios & Recent Trace Feed: One-click enterprise task templates that automatically dispatch into the Assistant.

### B. Agent Assistant (`/assistant`)
- Split-screen workspace: Conversational Chat Interface on the left; Real-Time "Live Agent Execution Pipeline" panel on the right.
- Real-Time Execution Pipeline:
  User Request → Intent Detection → Task Planning → Agent Selection → Tool Execution → Validation → Final Response.
- For each pipeline step, display in real-time:
  - Step Name
  - Agent Responsible
  - Status (pending, running, completed, failed)
  - Start Time
  - Duration (ms)
  - Result summary
  - Success/Failure indicator
  - Tool Invoked
  - Expandable Input Parameters Drawer
- Intelligent Agent & Tool Selection based on prompt keywords:
  - "Analyze this data" / data / metrics / latency → Analysis Agent with Data Analyzer tool.
  - "Find information about..." / research / search → Research Agent with Knowledge Search / Web Search simulation tool.
  - "Calculate..." / math / formula → Analysis Agent with Calculator tool.
  - "Check whether..." / verify / compliant / audit → Validation Agent with Document Search tool.
  - Unsupported / general queries → General Assistant with Knowledge Search tool.
- Human-in-the-Loop (HITL) Mode: Toggle to suspend execution prior to sensitive operations, requiring an administrative operator to click "Approve" or "Reject".
- Interactive step-by-step trace accordion, duration metrics, token tallies, and prompt preset chips.

### C. Workflow (`/workflow`)
- Visual interactive 7-node DAG pipeline:
  User Request → Orchestrator Agent → Planner → Specialist Agent → Tool Execution → Validator → Final Response.
- Node state visualizer: `Pending`, `Running`, `Waiting for Approval`, `Completed`, `Failed`.
- Interactive simulation triggers:
  - "Simulate Full Flow": Sequential animated progression through all nodes.
  - "Simulate HITL Approval": Pauses at Tool Execution pending Approve/Reject actions.
  - "Simulate Failure Recovery": Simulates worker failure and automatic retry/circuit breaker.
- Node Inspector Modal: Clicking any node displays input/output schemas, system prompts, latency, and call metrics.

### D. Architecture (`/architecture`)
- Comprehensive 7-Layer Enterprise Specification:
  1. Presentation Layer (React SPA, WebSocket/SSE streaming, Reverse Proxy)
  2. Agent Orchestration Layer (Multi-Agent Supervisor, DAG Decomposer, HITL Broker)
  3. Agent / Reasoning Layer (Foundation Model Routers, Specialist Workers, Reflection Engine)
  4. Tool Integration Layer (MCP Connectors, gVisor MicroVM Sandbox, Dynamic Vault Credentials)
  5. Data Layer (pgvector Knowledge Base, Redis Session Cache, PostgreSQL Audit Ledger)
  6. Monitoring Layer (OpenTelemetry Collector, Prometheus, FinOps Token Cost Attribution)
  7. Security & Trust Boundaries (NeMo & Llama Guard, Presidio PII Masker, Immutable Ledger)
- Interactive Filters: Toggle between "All Layers", "Security Boundaries", and "Protocols & IPC".
- Component deep dive cards displaying communication protocols (mTLS, gRPC, REST, stdio).

### E. Deployment (`/deployment`)
- Environment Topologies: Development (Local/Minikube), Testing (Eval Benchmarks), Production (Multi-Region Kubernetes).
- Autonomous CI/CD Release Flow: Lint → Safety Benchmark → Agent Eval Gate → Canary Rollout → Global Rollout.
- Interactive Canary Stepper: Button to step canary traffic split (+25%) from 15% to 100%.
- Infrastructure Specifications: Autoscaling (HPA rules, concurrency caps), Fault Tolerance (Tiered model failover), and Health Probes (`/healthz/liveness` & readiness).

### F. Security (`/security`)
- Core Pillars: OAuth 2.0 / OIDC with PKCE, HashiCorp Vault dynamic ephemeral secrets, Zero-Data-Retention guarantees, and SHA-256 tamper-evident ledgers.
- Live Threat Interception Simulator: Interactive bench where users can test adversarial prompt injections (e.g. "Ignore previous instructions") and confidential PII strings (SSNs, credit card numbers, emails), viewing real-time sanitization and decision (`PASSED` vs `BLOCKED`).
- Role-Based Access Control (RBAC) Matrix: Interactive simulator allowing testing of permissions for SecOps Admin, Agent Developer, Cloud Architect, Compliance Auditor, and API Guest.
- Immutable Audit Log Table: Searchable, filterable audit event ledger with CSV export simulation.

### G. Monitoring (`/monitoring`)
- 8 Core Platform KPIs: Agent Health (100%), Total Requests, Success Rate, Avg Response Time, Token Cost, Failed Tasks, Safety Interceptions, and Business Outcome Metric.
- Visual Charts: Token consumption by Agent role and Latency percentile distributions (p50, p95, p99).
- Trace Execution History: Filterable table of past multi-agent execution traces.
- OpenTelemetry Span Waterfall Explorer: Clicking any trace opens an interactive Gantt waterfall modal detailing distributed span timings, agent assignments, and execution logs.

---

## 3. TECHNICAL & STACK REQUIREMENTS

- **Frontend Core:** React 18+ with TypeScript in strict mode.
- **Build Tool:** Vite for fast HMR and optimized production bundles.
- **Styling:** Vanilla CSS design tokens (`index.css`) with CSS custom properties, responsive flex/grid layouts, custom scrollbars, and dark navy glassmorphism. Avoid external CSS frameworks (no Tailwind unless explicitly confirmed).
- **Icons:** `lucide-react` for clean enterprise iconography.
- **State Management:** Clean, decoupled modular service layers (`src/services/agentService.ts`, `src/services/mockData.ts`).
- **Zero API Key Requirement:** Realistic, responsive simulation functions that generate rich markdown, code blocks, tables, and telemetry traces with deterministic latency timers.

---

## 4. EXPECTED OUTPUT STRUCTURE

```
<ROLLNO-NAME>/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
├── README.md
├── prompt.md
├── deliverables.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── agent.ts
    ├── services/
    │   ├── agentService.ts
    │   └── mockData.ts
    └── components/
        ├── layout/
        │   ├── Header.tsx
        │   └── Sidebar.tsx
        ├── common/
        │   ├── Badge.tsx
        │   └── StatCard.tsx
        ├── dashboard/
        │   └── DashboardView.tsx
        ├── assistant/
        │   ├── AssistantView.tsx
        │   ├── AgentExecutionPanel.tsx
        │   └── TraceViewer.tsx
        ├── workflow/
        │   ├── WorkflowView.tsx
        │   └── NodeDetailModal.tsx
        ├── architecture/
        │   └── ArchitectureView.tsx
        ├── deployment/
        │   └── DeploymentView.tsx
        ├── security/
        │   ├── SecurityView.tsx
        │   └── GuardrailSimulator.tsx
        └── monitoring/
            ├── MonitoringView.tsx
            └── TraceWaterfallModal.tsx
```

Ensure the application compiles cleanly (`npm run build` exits with code 0) and starts with `npm run dev` at `http://127.0.0.1:5173/`.
```
