# Artifact 1: Enterprise Architecture Diagram & System Topology

## 1. Executive Summary & Architectural Overview
NextStep is an enterprise-grade agentic AI assistant engineered for guided student learning workflows. Unlike conversational chatbots that produce monolithic, unstructured responses, NextStep enforces a deterministic, goal-driven state machine. The platform operates on the principle of **Atomic Cognitive Load Reduction**: students are presented with exactly one actionable next step at any given moment, accompanied by active temporal guardrails (Pomodoro timer), continuous state verification, and automated replanning upon task failure.

---

## 2. Layered Architecture Diagram

```
+===================================================================================+
|                              PRESENTATION LAYER                                   |
|   React 18 SPA + TypeScript + Vite + Tailwind CSS Dark Architecture               |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Student Dashboard  |  | Next Action Focus    |  | Stuck Diagnostic Modal    |  |
|  | - Single Action UI |  | - Pomodoro (25m)     |  | - Micro-step Unblocker    |  |
|  | - Multi-goal Switch|  | - Reflection Input   |  | - Direct Skip Pathway     |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Goal Workspace     |  | Admin Monitoring     |  | Activity Audit Stream     |  |
|  | - Milestone Tree   |  | - Telemetry & Health |  | - LangGraph Event Feed    |  |
|  | - Task Status DAG  |  | - User State Control |  | - Decision Trace Log      |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+=========================================|=========================================+
                                          | HTTPS / REST / WSS / JWT Bearer
+=========================================v=========================================+
|                         APPLICATION GATEWAY & SECURITY LAYER                      |
|                         FastAPI Reverse Proxy & Security Hub                      |
|                                                                                   |
|  +-------------------------+  +--------------------------+  +------------------+  |
|  | CORS Policy Filter      |  | JWT Bearer Authenticator |  | RBAC Middleware  |  |
|  | - localhost:5173 / Prod |  | - HS256 Token Validator  |  | - Student Guard  |  |
|  | - Credential Allow List |  | - User Session Resolver  |  | - Admin 403 Gate |  |
|  +-------------------------+  +--------------------------+  +------------------+  |
+=========================================|=========================================+
                                          |
+=========================================v=========================================+
|                              CORE AGENT ENGINE LAYER                              |
|                              LangGraph State Machine                              |
|                                                                                   |
|         +-------------------------------------------------------+                 |
|         |                     Goal Analyzer                     |                 |
|         |   - Intent Taxonomy Categorization (MERN/DSA/ML/Exam) |                 |
|         +---------------------------|---------------------------+                 |
|                                     v                                             |
|         +-------------------------------------------------------+                 |
|         |                     Planner Node                      |                 |
|         |   - Deconstructs Objective into 3-5 Milestones        |                 |
|         |   - Generates DAG-Ordered Actionable Micro-Tasks      |                 |
|         +---------------------------|---------------------------+                 |
|                                     v                                             |
|         +-------------------------------------------------------+                 |
|   +---->|                  Task Selector Node                   |                 |
|   |     |   - Evaluates Unblocked Dependencies (Topological)    |                 |
|   |     |   - Selects Exactly ONE Current Actionable Task       |                 |
|   |     +---------------------------|---------------------------+                 |
|   |                                 v                                             |
|   |     +-------------------------------------------------------+                 |
|   |     |                  Student Action Waiter                |                 |
|   |     |   - User Dispatches: 'done' | 'stuck' | 'skip'        |                 |
|   |     +-------------|-------------|-------------|-------------+                 |
|   |                   |             |             |                               |
|   |       [action=done]       [stuck]        [skip]                               |
|   |                   v             v             v                               |
|   |     +----------------+ +----------------+ +-----------------+                 |
|   |     | Progress       | | Replanner /    | | Task Skipper    |                 |
|   |     | Observer Node  | | Stuck Analysis | | - Recalculates  |                 |
|   |     | - Reflection   | | - Diagnoses    | |   Dependencies  |                 |
|   |     |   Evaluation   | | - Generates    | | - Marks Skipped |                 |
|   |     | - Progress %   | |   Alternatives | +--------|--------+                 |
|   |     +--------|-------+ +--------|-------+          |                          |
|   |              |                  |                  |                          |
|   +--------------+------------------+------------------+                          |
+=========================================|=========================================+
                                          |
+=========================================v=========================================+
|                        PERSISTENCE & MODEL INTEGRATION LAYER                      |
|                                                                                   |
|  +--------------------------+  +-------------------------+  +------------------+  |
|  | SQLAlchemy ORM Models    |  | LLM Provider Adapter    |  | Audit & Events   |  |
|  | - Users (Admin/Student)  |  | - Gemini 3.8 Flash SDK  |  | - AgentEvent Log |  |
|  | - Goals, Milestones, Tasks| | - OpenAI Compatible Fallback| - AuditLog DB  |  |
|  | - AgentState Checkpoints |  | - Deterministic Mock LLM|  | - Latency & QPS  |  |
|  +--------------------------+  +-------------------------+  +------------------+  |
|                                     |                                             |
|  +----------------------------------v------------------------------------------+  |
|  | SQLite (Embedded Zero-Config Dev) / PostgreSQL (Cloud CloudSQL Production)  |  |
|  +-----------------------------------------------------------------------------+  |
+===================================================================================+
```

---

## 3. Component Specification & Responsibilities

| Component | Responsibility | Technology |
| :--- | :--- | :--- |
| **Frontend Client** | Single Page Application presenting the focused Next Action, Pomodoro timer, stuck resolution workflow, multi-goal switcher, and admin portal. | React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons |
| **API Gateway** | REST API endpoints, security authentication, CORS validation, parameter serialization, error formatting. | FastAPI, Starlette, Pydantic V2 |
| **Auth Provider** | Identity management, password salting with BCrypt, JWT claim issuance, role resolution (Student vs Admin). | Python-JOSE, Passlib, BCrypt |
| **Agent State Machine** | Orchestrates the cycle: Goal $\to$ Plan $\to$ Select $\to$ Wait $\to$ Observe $\to$ Replan. Persists state checkpoints. | LangGraph, Python 3.11 |
| **LLM Service Adapter** | Unified prompt orchestration layer supporting Google Gemini (`gemini-3.8-flash`), OpenAI, or deterministic Mock. | Google GenAI SDK (`google-genai`), Requests, JSON |
| **Relational Data Store** | Normalized schemas for Users, Goals, Milestones, Tasks, AgentState, AgentEvents, MemoryItems, and AuditLogs. | SQLite (Dev) / PostgreSQL (Prod), SQLAlchemy 2.0 |

---

## 4. Trust Boundaries & Security Enclaves

```
+---------------------------------------------------------------------------------+
| TRUST BOUNDARY 0: PUBLIC INTERNET                                               |
| - Web Browsers, Public Networks                                                 |
| - Unauthenticated requests restricted to /api/auth/login and /api/auth/register |
+---------------------------------------|-----------------------------------------+
                                        | TLS 1.3 / HTTPS
+---------------------------------------v-----------------------------------------+
| TRUST BOUNDARY 1: APPLICATION DEMILITARIZED ZONE (DMZ)                          |
| - FastAPI Ingress Controller / Reverse Proxy                                    |
| - Enforces CORS, rate-limiting, and parses HTTP Authorization header            |
+---------------------------------------|-----------------------------------------+
                                        | Validated JWT Claims (sub, role, exp)
+---------------------------------------v-----------------------------------------+
| TRUST BOUNDARY 2: INTERNAL SERVICE & AGENT ORCHESTRATION ENCLAVE               |
| - LangGraph Workflow Engine & State Checkpointers                              |
| - Student Isolation: Database queries strictly scoped to User ID                |
| - Admin Enclave: Role Verification (role == 'admin') required for /api/admin/*  |
+---------------------------------------|-----------------------------------------+
                                        | Internal Socket / TLS
+---------------------------------------v-----------------------------------------+
| TRUST BOUNDARY 3: SECURE DATA & THIRD-PARTY LLM STORAGE                         |
| - Relational Database (nextstep.db / CloudSQL PostgreSQL)                       |
| - External Google Gemini API via HTTPS (Outbound Only with Secret Token)        |
+---------------------------------------------------------------------------------+
```

---

## 5. Integration Data Flows

### Flow A: Student Goal Creation to First Action
1. Student enters goal title and description in React client.
2. Client sends `POST /api/goals` with Bearer JWT token.
3. Gateway authenticates student identity (`sub = user_id`).
4. LangGraph executes `node_analyze_goal` $\to$ `node_create_plan`.
5. LLM generates structured JSON containing 3-5 milestones and 9-15 actionable tasks.
6. Milestones and tasks are committed into relational tables.
7. `node_select_next_task` evaluates DAG dependencies and selects Task #1.
8. State machine checkpoints `waiting_for_student` into `AgentState` table.
9. Client receives 201 Created and renders the Next Action card.

### Flow B: Unblocking Stuck Students
1. Student clicks "I'm Stuck" on their dashboard.
2. `StuckModal` appears with target task context and option to describe roadblock.
3. Modal triggers `POST /api/agent/goals/{id}/action` with `{ action: 'stuck', message: '...' }`.
4. LangGraph executes `node_analyze_stuck` $\to$ computes diagnosis, micro-steps, and alternatives.
5. Modal renders recommendations with immediate pathways:
   - **Resume Task**: Close and apply recommended steps.
   - **Skip & Move to Next**: Directly invokes `action: 'skip'` to advance to the next unblocked task.
