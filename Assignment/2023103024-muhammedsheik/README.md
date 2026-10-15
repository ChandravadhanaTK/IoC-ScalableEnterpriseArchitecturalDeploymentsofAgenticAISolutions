# Agentic Assistant - Enterprise Autonomous AI Fleet

**Student Roll No / Name:** `2023103024 - Muhammed Sheik`  
**Repository Location:** `2023103024-MuhammedSheik/`  
**Technology Stack:** React 18, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons  

---

## 🌟 Executive Overview

**Agentic Assistant** is an enterprise-grade autonomous AI orchestration platform designed to showcase production-ready multi-agent workflows, Directed Acyclic Graph (DAG) reasoning, Model Context Protocol (MCP) tool sandboxing, and Defense-in-Depth safety guardrails.

The application functions completely out-of-the-box with **zero external API keys required**, featuring realistic simulated multi-agent synthesis, OpenTelemetry distributed tracing, live safety threat mitigation, and Human-in-the-Loop (HITL) authorization gates.

---

## 🚀 Quick Start Instructions

To run the application locally on your machine:

```bash
# 1. Navigate to the project directory
cd 2023103024-MuhammedSheik

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the local development server
npm run dev
```

The application will immediately be accessible in your web browser at:
👉 **`http://127.0.0.1:5173/`**

To produce a production bundle:
```bash
npm run build
```

---

## 🧭 Major Application Sections

### 1. Dashboard (`/dashboard`)
- **Fleet Status & Health**: Live KPIs tracking 142,890 total requests, 99.2% success rate, 1.18s avg latency, and $48.20 daily AI expenditure.
- **Hourly Request Throughput & Latency Trend**: Interactive 24-hour telemetry SVG chart.
- **Active Agent Fleet Matrix**: Live status indicators for Orchestrator, Reasoning Planner, Specialist Worker, Tool Sandbox, and Security Guardrail.
- **Recent Execution Traces & Quick Enterprise Prompts**: One-click prompt dispatch directly into the Assistant.

### 2. Agent Assistant (`/assistant`)
- **Conversational Task Workspace**: Ingests enterprise tasks and requests.
- **Real-Time Lifecycle Stepper**: Visual progression through:  
  `Received` $\rightarrow$ `Planning` $\rightarrow$ `Executing` $\rightarrow$ `Validating` $\rightarrow$ `Completed`
- **Agent Attribution**: Active agent badges (`Orchestrator Agent`, `Planner`, `Specialist Agent`, `Tool Sandbox`, `Security Validator`) and tool invocation indicators.
- **Human-in-the-Loop (HITL) Gate**: Interactive toggle to require explicit administrative sign-off before dangerous tool execution with "Approve" and "Reject" triggers.
- **Collapsible Trace Spans**: Detailed breakdown of reasoning duration, tokens consumed, input parameters, and validation logs.
- **Enterprise Prompt Presets**: One-click scenarios for AWS IAM Security Audit, Microservice Incident Latency Triage, GDPR SAR Redaction, and Ledger Discrepancy Reconciliation.

### 3. Workflow (`/workflow`)
- **Interactive 7-Node DAG Pipeline**:
  `User Request` $\rightarrow$ `Orchestrator Agent` $\rightarrow$ `Planner` $\rightarrow$ `Specialist Agent` $\rightarrow$ `Tool Execution` $\rightarrow$ `Validator` $\rightarrow$ `Final Response`
- **State Visualizer**: Displays `Pending`, `Running`, `Waiting for Approval`, `Completed`, and `Failed`.
- **Simulation Controllers**:
  - `Simulate Full Flow`: Sequential pipeline step-through with pulsing animations.
  - `Simulate HITL Approval`: Pauses at Tool Execution pending approval.
  - `Simulate Failure Recovery`: Triggers automated retry & circuit breaker fallback.
- **Node Inspector Modal**: Click any node to inspect system prompt snippets, telemetry metrics, and input/output schemas.

### 4. Architecture (`/architecture`)
- **7-Layer Enterprise Specification**:
  1. *Presentation Layer* (React SPA, WebSockets/SSE streaming, API Gateway)
  2. *Agent Orchestration Layer* (Multi-Agent Supervisor, DAG Decomposer, HITL Broker)
  3. *Agent / Reasoning Layer* (Foundation Model Routers, Specialist Workers, Reflection Engine)
  4. *Tool Integration Layer* (MCP Ecosystem, gVisor MicroVM Sandbox, Dynamic Vault Credentials)
  5. *Data Layer* (pgvector Knowledge Base, Redis Session Cache, PostgreSQL Audit Ledger)
  6. *Monitoring Layer* (OpenTelemetry Collector, Prometheus, FinOps Token Cost Attribution)
  7. *Security & Trust Boundaries* (NeMo & Llama Guard, Presidio PII Masker, Immutable Ledger)
- **Interactive Layer Filters**: Toggle between "All Layers", "Security Boundaries", and "Protocols & IPC".

### 5. Deployment (`/deployment`)
- **Environment Topologies**: Development (Local/Minikube), Testing (Automated CI/CD), and Production (Multi-Region Kubernetes).
- **Autonomous Release CI/CD Flow**: Lint $\rightarrow$ Safety Benchmark $\rightarrow$ Agent Eval Gate $\rightarrow$ Canary Deployment $\rightarrow$ Global Rollout.
- **Interactive Canary Controller**: Click `Step Canary (+25%)` to test live traffic progression from 15% to 100%.
- **Autoscaling & Resilience**: HPA policies (75% CPU target, 500 queue limit, 128 max concurrency), Tiered LLM Failover (Claude 3.5 $\rightarrow$ GPT-4o $\rightarrow$ vLLM 70B), and green Kubernetes health probes (`/healthz/liveness` & readiness).

### 6. Security (`/security`)
- **Defense-in-Depth Pillars**: Zero-Trust perimeter, dynamic HashiCorp Vault secrets, zero-data-retention agreements, and SHA-256 cryptographically linked audit chains.
- **Live Threat Interception Simulator**: Interactive testbed for detecting prompt injections, adversarial prefixes ("Ignore previous instructions"), and automated PII scrubbing (SSNs, credit cards, emails).
- **Interactive RBAC Simulator**: Test role permissions across `SecOps Admin`, `Agent Developer`, `Cloud Architect`, `Compliance Auditor`, and `API Guest`.
- **Immutable Audit Ledger**: Searchable, filterable audit log stream with CSV export.

### 7. Monitoring (`/monitoring`)
- **9 Core Platform KPIs**: Agent Health (100%), Total Requests (142,890), Success Rate (99.2%), Avg Response Time (1.18s), Token Cost ($48.20), Failed Tasks (18), Safety Interceptions (142), and Business Outcome Metric (92.4% resolution, 1,240 hrs saved).
- **Visual Analytics**: Token expenditure breakdown by agent role and Latency percentile distributions (p50: 890ms, p95: 1450ms, p99: 2100ms).
- **OpenTelemetry Span Waterfall Explorer**: Click any trace row to open an interactive Gantt timeline displaying distributed span durations and execution telemetry.

---

## 🎨 Enterprise Design Aesthetics

- **Dark Navy Palette**: Enterprise midnight navy background (`#060913`, `#0B0F19`, `#111827`) paired with subtle borders (`#1E293B`, `#334155`).
- **Semantic Accent Hierarchy**:
  - 🔵 **Blue** (`#3B82F6`): Orchestration, primary actions, and volume throughput.
  - 🟣 **Purple** (`#8B5CF6`): Planning, reasoning, and token analytics.
  - 🟢 **Green** (`#10B981`): Validation, health checks, and verified completions.
  - 🟠 **Orange** (`#F59E0B`): Tool execution sandboxes, approval gates, and warnings.
  - 🔷 **Cyan** (`#06B6D4`): Domain specialists and low-latency metrics.
- **Micro-Interactions**: Smooth CSS transitions, pulsing status indicators, and modal blur effects.
