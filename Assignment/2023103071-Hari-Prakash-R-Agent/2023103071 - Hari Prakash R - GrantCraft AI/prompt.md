# GrantCraft AI — Lovable Generation Prompt

**Live Deployed Application:** https://pixel-perfect-buddy-326.lovable.app/

\---

## Prompt Used to Generate the Application

Build a complete, production-grade Enterprise Agentic AI Command Center web application called "GrantCraft AI: Scalable Enterprise Multi-Agent Funding \& CSR Copilot for NGOs".

### DESIGN \& UI REQUIREMENTS

* Theme: Modern Dark Enterprise Slate \& Emerald/Indigo theme (deep navy background `#0B0F19`, glassmorphism cards, crisp borders, status badges, and Lucide icons).
* Navigation: Top header with system status badge ("CLUSTER HEALTHY • 99.98% UPTIME • MULTI-TENANT GUARDRAILS ACTIVE"), Role Switcher (NGO Grant Writer, Finance Auditor, NGO Director - HITL Approver), and a 6-tab navigation bar covering the Live Agent Workspace plus the 5 Enterprise Capstone Deliverables:

  1. 🚀 Live Agent Copilot (Interactive Multi-Agent Simulator)
  2. 🏗️ 1. Architecture Diagram
  3. 🔄 2. Agent Workflow Design
  4. ☁️ 3. Deployment Strategy
  5. 🛡️ 4. Security Model
  6. 📊 5. Monitoring Dashboard

### TAB 1: 🚀 LIVE AGENT COPILOT (INTERACTIVE WORKSPACE)

Create an interactive multi-agent execution studio where users can either select from 3 pre-built NGO Scenarios or type a custom NGO funding request:

* Preset 1: "Solar-Powered Digital Classrooms for 50 Rural Schools ($120,000)"
* Preset 2: "Clean Water Filtration \& IoT Sensors for 20 Drought-Prone Villages ($85,000)"
* Preset 3: "Test Failure Path: Unregistered NGO Requesting 25% Admin Overhead ($250,000)"

When the user clicks "Run Multi-Agent Pipeline", animate a realistic step-by-step execution across 4 specialized agents with live state transitions, tool call payloads, latency badges, and token counts:

1. **Grant Scout Agent** (State: `DISCOVERING` -> Tools: `Grant\_Vector\_Search`, `CSR\_Portal\_API`): Displays top 3 matched grants with semantic similarity scores.
2. **Compliance \& Eligibility Agent** (State: `AUDITING` -> Tools: `NGO\_Doc\_Parser`, `Policy\_Rule\_Engine`): Verifies 80G/12A/501(c)(3) tax status and PII redaction. (If Preset 3 is selected, trigger the Failure Path: halt execution and display a red Compliance Exception Alert with remediation steps).
3. **Proposal Architect Agent** (State: `DRAFTING` -> Tools: `Impact\_RAG\_Retriever`, `Citation\_Verifier`): Generates a structured Grant Proposal draft with a RAG Groundedness Score badge (96.4%).
4. **Financial Auditor Agent** (State: `VERIFYING\_MATH` -> Tools: `Python\_Sandbox\_Calc`, `Cap\_Rule\_Checker`): Displays a deterministic budget breakdown table ensuring Admin Overhead <= 10%.
5. **Human-in-the-Loop (HITL) Approval Gate** (State: `AWAITING\_DIRECTOR\_SIGN\_OFF`): Pause the workflow and present interactive buttons ("Approve \& Export Signed Proposal", "Request Budget Revision", "Reject \& Halt").

### TAB 2: 🏗️ DELIVERABLE 1 - ARCHITECTURE DIAGRAM

Build an interactive visual Enterprise Architecture blueprint organized into 4 distinct horizontal layers with clickable component cards and marked Trust Boundaries:

* Layer 1: Client \& Presentation Layer (React Portal, Role-Based Views, HITL Approval Console)
* Trust Boundary 1 (Public Edge -> API Gateway): TLS 1.3, OAuth2/JWT Auth, WAF, Rate Limiting.
* Layer 2: Security \& Guardrail Gateway (Input Prompt Injection Filter, Microsoft Presidio PII Redactor, Output Hallucination \& Math Guardrail).
* Trust Boundary 2 (Gateway -> Agent Runtime): Zero-Trust Internal Service Mesh (mTLS).
* Layer 3: Stateful Multi-Agent Orchestration Layer (LangGraph Orchestrator, Shared State Store in Redis, Episodic Memory, LiteLLM Model Router with Primary Claude 3.5 Sonnet / GPT-4o -> Fallback Gemini 1.5 Pro).
* Trust Boundary 3 (Orchestrator -> External Tools \& Tenant Data): Sandboxed Tool Execution \& Row-Level Security (RLS).
* Layer 4: Knowledge, Tooling \& Data Layer (Pinecone Vector DB with Tenant Namespaces, PostgreSQL Compliance DB, Isolated Python Math Sandbox, External CSR Portal APIs).

### TAB 3: 🔄 DELIVERABLE 2 - AGENT WORKFLOW DESIGN

Create a visual State Machine and Orchestration Specification view showing:

* Agent Roles \& Responsibilities Matrix: Detailed cards for all 4 agents + Supervisor Router.
* Interactive State Machine Diagram: Visual flow (`IDLE` -> `DISCOVERING` -> `AUDITING` -> `DRAFTING` -> `VERIFYING\_MATH` -> `HITL\_REVIEW` -> `COMPLETED` / `FAILED\_SAFE`).
* Tool Contracts \& Handoff Schemas: JSON schema viewer showing the exact structured state payload passed between agents.
* Failure Paths \& Recovery Simulator: Interactive toggle switches allowing the user to simulate 4 enterprise failure modes and see the exact system mitigation.

### TAB 4: ☁️ DELIVERABLE 3 - DEPLOYMENT STRATEGY

Create an interactive Cloud-Native Deployment \& Resilience Operations view:

* Runtime \& Horizontal Scaling Architecture: Containerized stateless FastAPI Agent Workers on Cloud Run / Kubernetes (EKS) with KEDA auto-scaling based on Redis queue depth.
* Multi-Model Resilience \& Failover Simulator: Interactive toggle to simulate a Primary LLM Outage and visually show the Circuit Breaker tripping and routing traffic to the Fallback LLM.
* Environments \& CI/CD Release Pipeline: Visual pipeline flow across `Development` -> `Staging` -> `Production (Blue/Green \& 10% Canary Rollout)`.

### TAB 5: 🛡️ DELIVERABLE 4 - SECURITY MODEL

Create an interactive Enterprise Security, Privacy \& Governance Center:

* Identity \& RBAC Permission Matrix: Table showing granular permissions for Grant Writer, Finance Officer, NGO Director, and System Auditor.
* Interactive PII \& Secret Redaction Sandbox: Live text box pre-filled with sample sensitive NGO text where clicking "Test Guardrail Redaction" masks sensitive tokens before LLM ingestion.
* Secrets \& Tenant Isolation: Details on HashiCorp Vault / KMS key rotation and strict Vector DB namespace isolation.
* Immutable Audit Trail Log: Live filterable table of cryptographically signed agent actions, tool invocations, guardrail blocks, and HITL approvals.

### TAB 6: 📊 DELIVERABLE 5 - MONITORING DASHBOARD DESIGN

Build a comprehensive Executive \& SRE Observability Dashboard using Recharts with 6 metric categories:

1. System Health (Uptime, P50/P95 Latency per Agent, Active Worker Pods, Error Rate).
2. Distributed Trace Explorer (Waterfall trace view across Guardrails, Vector Search, Agent LLM calls, and Python Sandbox).
3. Quality Metrics (RAG Faithfulness Score, Answer Relevance, Citation Accuracy, Budget Math Pass Rate).
4. Safety \& Guardrails (Blocked prompt injections, PII tokens redacted, compliance policy halts).
5. Cost Telemetry (Token usage breakdown by agent, average cost per grant proposal, daily budget burn).
6. Business Outcomes (Total Grants Audited, Average NGO Time Saved, Compliance Pass Rate, Total CSR Funding Unlocked).

