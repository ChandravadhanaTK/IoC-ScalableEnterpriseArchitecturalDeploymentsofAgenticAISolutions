# 📋 AI Meeting Action Tracker — Capstone Project Deliverables

**Student:** Abhijith.M  
**Roll No:** 2023103095  
**Course:** Scalable Enterprise Architectural Deployments of Agentic AI Solutions (IoC – SEM 7)  
**Instructor:** Chandravadhana T.K., Senior AI/ML Architect  
**Platform Used:** [Lovable](https://lovable.dev) (AI-assisted full-stack builder)  
**Deployed Application:** [https://meeting-action-tracker.lovable.app/](https://meeting-action-tracker.lovable.app/)  
**Source Code:** Included in the `meeting-action-tracker/` directory of this submission

---

## 📌 Project Overview

**AI Meeting Action Tracker** is an enterprise-oriented, full-stack agentic AI web application that systematically converts raw meeting transcripts into approved, tracked tasks with proactive deadline reminders. The application is an academic demonstration developed for *"IoC - Scalable Enterprise Architectural Deployments of Agentic AI Solutions"*.

Rather than functioning as a conversational chatbot, this system implements a deterministic, multi-agent pipeline governed by a backend Orchestrator:
1. **Meeting Analysis Agent:** Ingests transcripts, screens against prompt injection threats, masks PII, extracts action items using a real server-side LLM, and enforces strict lexical grounding verification.
2. **Task Management Agent:** Consumes human decisions at a mandatory Human-in-the-Loop (HITL) approval gate, translating verified action items into auditable relational task matrices.
3. **Reminder Agent:** Evaluates task deadlines, triggers state transitions for approaching and overdue tasks, and dispatches deduplicated in-app notifications.

### Key Highlights

- **3 Clearly Separated Specialized Agents** coordinated by an authoritative backend Orchestrator state machine.
- **Mandatory Human-in-the-Loop Checkpoint** — Tasks are never provisioned or written prior to explicit user approval.
- **Enterprise-Grade AI Safety & Guardrails** — Pre-execution prompt injection regex screening (8 attack signatures), automated PII redaction (`[EMAIL]`, `[PHONE]`), isolated `<transcript>` framing, zero-tool sandboxing, and $\ge 80\%$ lexical grounding verification.
- **Six-Domain Observability Architecture** — Live telemetry and execution trace watermarking covering Health, Trace, Quality, Safety, Cost/Usage, and Business Outcomes.
- **Robust Role-Based Access Control (RBAC)** — Separation of `user` and `admin` roles, secured by PostgreSQL Row-Level Security (RLS) policies and security definer functions.
- **Interactive Architectural & Monitoring Views** — Built-in visual system topology at `/architecture`, `/architecture/agents`, `/architecture/deployment`, `/architecture/security`, `/monitoring`, and `/monitoring/traces`.

---

## 📦 Submission Contents

| # | File / Folder | Description |
|---|---|---|
| 1 | `Prompt.md` | The complete AI specification prompt used to build AI Meeting Action Tracker |
| 2 | `Deliverables.md` | This document — formal architectural and operational documentation across five enterprise deliverables |
| 3 | `meeting-action-tracker/` | Complete application source code and database migrations |

---

## 🏗️ Deliverable 1: Architecture Diagram

### 1.1 Layered Architecture Overview
The system is built on a 7-tier decoupled architecture separating presentation, orchestration, agentic logic, and persistence.

```text
+-----------------------------------------------------------------------------------+
|  1. PRESENTATION LAYER (Client Browser)                                           |
|  - TanStack Start v1 (React 19, SSR + Hydration)                                   |
|  - Tailwind CSS v4 Semantic Tokens & Dark Modern Theme                            |
|  - Dynamic Route Views: Dashboard, Meetings, Tasks, Monitoring, Traces, Security  |
|  - Client-side Auth Token Attacher & Session Gate (AppShell)                      |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON RPC (Bearer Session Token)
                                           v [TRUST BOUNDARY 1: Web Request Gate]
+-----------------------------------------------------------------------------------+
|  2. APPLICATION / API LAYER (Edge Server Runtime)                                 |
|  - TanStack Server Functions (src/lib/agents.functions.ts)                        |
|  - Authentication Middleware (requireSupabaseAuth)                                |
|  - Input Validation & Payload Enforcement (Zod Schemas)                           |
+------------------------------------------+----------------------------------------+
                                           | Context Injection (userId, dbClient)
                                           v
+-----------------------------------------------------------------------------------+
|  3. ORCHESTRATION LAYER (State Machine & Telemetry Dispatcher)                    |
|  - Session Context & State Coordination (IDLE -> PROCESSING -> VALIDATING ... )   |
|  - Trace Generator (UUIDv4 trace_id lifecycle spanning all agent steps)           |
|  - Step Tracer & Spans Writer (agent_runs table)                                  |
|  - Audit Log Emitter (audit_logs table)                                           |
+------------------------------------------+----------------------------------------+
                                           | Structured Handoff
                                           v
+-----------------------------------------------------------------------------------+
|  4. AGENTS LAYER                                                                  |
|  +----------------------------+  +--------------------------+  +----------------+ |
|  | Meeting Analysis Agent     |  | Task Management Agent    |  | Reminder Agent | |
|  | - Injection Screening      |  | - Human Decision Intake  |  | - Deadline Scan| |
|  | - PII Redaction            |  | - Relational Task Matrix |  | - State Shift  | |
|  | - LLM Prompt Packaging     |  | - Trace Continuity       |  | - Notification | |
|  | - Grounding Validator      |  |                          |  |   Deduplication| |
|  +--------------+-------------+  +-------------^------------+  +--------^-------+ |
+-----------------|------------------------------|------------------------|---------+
                  |                              |                        |
                  | [TRUST BOUNDARY 2: AI Gateway]                        |
                  v                              |                        |
+------------------------------------+           |                        |
|  5. AI & LLM GATEWAY               |           |                        |
|  - OpenAI GPT-6-Astra via Gateway  |           |                        |
|  - Enforced JSON Structured Output |           |                        |
|  - Zero-Tool Sandbox               |           |                        |
+------------------------------------+           |                        |
                                                 |                        |
                  +------------------------------+------------------------+
                  v [TRUST BOUNDARY 3: Relational Persistence]
+-----------------------------------------------------------------------------------+
|  6. DATA ACCESS LAYER (Managed PostgreSQL Engine)                                 |
|  - Row-Level Security (RLS) on all public tables: auth.uid() = user_id            |
|  - Security Definer Function: has_role(_user_id, _role)                           |
|  - Entities: user_roles, profiles, meetings, action_items, tasks, notifications   |
|  - Immutable Audit & Observability: agent_runs, security_events, audit_logs       |
+-----------------------------------------------------------------------------------+
|  7. OBSERVABILITY & TELEMETRY LAYER                                               |
|  - Real-time Trace Waterfall & Event Spans                                        |
|  - Multi-agent Health & Error Rate Aggregations                                    |
|  - Safety Incident Tracking (Prompt injection & PII counters)                     |
|  - Cost & Token Accounting (Input/Output tokens, prompt latencies)                |
+-----------------------------------------------------------------------------------+
```

### 1.2 Trust Boundaries and Protocol Controls

| Trust Boundary | Interacting Entities | Authentication / Validation Mechanism | Failure & Containment Protocol |
| :--- | :--- | :--- | :--- |
| **Boundary 1: Web Gate** | Browser Client $\leftrightarrow$ Server Functions | Bearer JWT attached via client-side function middleware; validated against database auth provider. | Unauthenticated requests are rejected with `401 Unauthorized` before function handler execution. |
| **Boundary 2: LLM Gateway** | Server Agents $\leftrightarrow$ LLM Provider | Server-held secret key (`LOVABLE_API_KEY`), strict PII redaction regex pre-filter, `<transcript>` encapsulation tags. | Model output passes through JSON schema validation and an 80% lexical grounding filter; non-grounded outputs are discarded. |
| **Boundary 3: Persistence** | Server Context $\leftrightarrow$ PostgreSQL Database | Client queries scoped via `auth.uid()`; server operations run with user-authenticated client applying PostgreSQL RLS policies. | Unauthorized queries return 0 rows or throw policy violations; role escalation blocked via independent `user_roles` table. |

---

## 🤖 Deliverable 2: Agent Workflow Design

### 2.1 Multi-Agent State Machine

The orchestration flow enforces a strict multi-stage lifecycle with a mandatory **Human-in-the-Loop (HITL)** approval checkpoint and explicit **backtracking retry loops**:

```text
       [Input Transcript]
               │
               ▼
┌───────────────────────────────┐ ◄─────────────────────────────────────────┐
│ State: IDLE                   │                                           │
└──────────────┬────────────────┘                                           │
               │ Dispatch with Trace ID                                     │
               ▼                                                            │
┌───────────────────────────────┐ ◄──────────────────────────┐              │
│ State: PROCESSING             │                            │              │
│ (Analysis, Screening & PII)   │                            │              │
└──────────────┬────────────────┘                            │              │
               │                                             │              │
               ▼                                             │              │
┌───────────────────────────────┐                            │ (Retry Loop) │
│ State: VALIDATING             │                            │              │
│ (Lexical Grounding & Owners)  │                            │              │
└──────────────┬────────────────┘                            │              │
               │                                             │              │
               ├────────────────────────► ┌───────────────────────────────┐ │
               │ Grounding Passed         │ State: FAILED                 │─┘
               │                          │ (LLM / Schema Error; Logged)  │
               ▼                          └───────────────────────────────┘
┌───────────────────────────────┐
│ State: AWAITING_APPROVAL      │
└──────────────┬────────────────┘
               │
               ▼
 ╔══════════════════════════════════════════════════════════════════════════╗
 ║                     HUMAN-IN-THE-LOOP CHECKPOINT                         ║
 ║                   User Review & Decision Gate                            ║
 ╚═════════════╤════════════════════════════════════════════════════════════╝
               │
       ┌───────┴────────────────────────┐
       │ Approved Items                 │ All Rejected / Edit Needed
       ▼                                ▼ [BACKTRACKING ARROW]
┌───────────────────────────────┐       └───────────────────────────────────┘
│ Task Management Agent         │             (Backtracks to IDLE for re-ingest)
│ - Writes tasks (Status: TODO) │
└──────────────┬────────────────┘
               │ Structured Handoff
               ▼
┌───────────────────────────────┐
│ Reminder Agent                │───► Scans deadlines; transitions OVERDUE tasks;
└──────────────┬────────────────┘     writes unique notifications
               │
               ▼
┌───────────────────────────────┐
│ State: COMPLETED              │
└───────────────────────────────┘
```

### 2.2 Agent Specifications

#### Agent 1: Meeting Analysis Agent
* **Role:** Ingest raw meeting transcripts, sanitize input against injection threats, mask PII, and extract structured action items.
* **Input:** Transcript string (max 50,000 characters), meeting date (`YYYY-MM-DD`).
* **Tools / Libraries:** `openai/gpt-6-astra` via AI Gateway, Regex Injection Classifier, PII Masker, Lexical Grounding Validator.
* **Outputs:** Array of candidate action items (`title`, `owner`, `deadline_text`, `deadline_date`, `priority`, `context`, `source_text`).
* **States:** `PROCESSING` $\rightarrow$ `VALIDATING` $\rightarrow$ `AWAITING_APPROVAL` (or `FAILED`).
* **Failure Handling:**
  * LLM 429 (Rate Limit) or 402 (Credits Exhausted): Handled with explicit user-facing exceptions.
  * Schema Mismatch / Invalid JSON: Trapped in `try/catch`, marked `FAILED`, zero orphaned records created.

#### Agent 2: Task Management Agent
* **Role:** Translate human-reviewed action items into auditable, actionable enterprise task records.
* **Input:** Meeting ID, approved action item UUIDs, rejected action item UUIDs.
* **Tools / Libraries:** PostgreSQL client executing under active user session context with RLS enforcement.
* **Outputs:** Inserted rows in `tasks` table with initial status `TODO`; status transitions for action items (`APPROVED` or `REJECTED`).
* **States:** `PROCESSING` $\rightarrow$ `COMPLETED` (or `FAILED`).
* **Failure Handling:** Atomic batch transaction. If task insertion fails, the meeting remains in `FAILED` state while review states are preserved for administrative inspection.

#### Agent 3: Reminder Agent
* **Role:** Continuously evaluate active task deadlines, identify approaching milestones and overdue work, and dispatch alert notifications.
* **Input:** Active tasks (`status != 'COMPLETED'`) associated with the user.
* **Tools / Libraries:** PostgreSQL query engine, database upsert engine with `(task_id, kind)` unique constraint.
* **Outputs:**
  * Status transition: `TODO` $\rightarrow$ `OVERDUE` for past-due tasks.
  * Notification records: `UPCOMING` ($\le 3$ days out) or `OVERDUE`.
* **States:** `PROCESSING` $\rightarrow$ `COMPLETED`.
* **Failure Handling / Idempotency:** Fully idempotent. Duplicate reminders for the same task and warning category are ignored via `ON CONFLICT (task_id, kind) DO NOTHING`.

---

## 🚀 Deliverable 3: Deployment Strategy

### 3.1 Environment Staging Pipeline

```text
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
|  1. DEVELOPMENT       |     |  2. TESTING           |     |  3. STAGING           |     |  4. PRODUCTION        |
|  - Local sandbox      | --> |  - Automated CI       | --> |  - Production mirror  | --> |  - Edge worker mesh   |
|  - Live HMR / Dev SSR |     |  - tsgo typecheck     |     |  - LLM eval benchmark |     |  - High-availability  |
|  - Mock transcripts   |     |  - Unit & guard tests |     |  - RBAC policy verify |     |  - Monitored traces   |
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
      Gate: Lint & TS               Gate: Test Suite              Gate: Quality Eval            Gate: Manual Sign-off
```

### 3.2 Resilience and Scaling Specifications

1. **Stateless Compute:** Server functions run in an edge worker environment. Workers spin up on demand with zero warm-up penalty, scaling horizontally with incoming traffic.
2. **Database Connection Pooling:** Relational persistence uses managed connection pooling to absorb concurrency spikes and prevent exhaustion during batch analysis.
3. **Zero-Downtime Rolling Releases:** Edge routing supports atomic asset swapping. In-flight requests are served by the running worker; subsequent traffic cuts over immediately.
4. **Schema Evolution:** Database migrations are strictly additive (new tables, nullable columns, backward-compatible enum extensions), ensuring backward compatibility with in-flight worker code.
5. **Circuit Breaking:** LLM API calls are bounded by client timeouts and streaming buffer validation to avoid dangling compute processes.

---

## 🔒 Deliverable 4: Security Model

### 4.1 Identity, Authentication & RBAC Matrix

* **Authentication Providers:** Supabase Auth integration supporting PKCE OAuth (Google) and Email/Password with encrypted JWT session credentials.
* **RBAC Architecture:** Roles are separated from user profiles and stored in `public.user_roles` using the `app_role` enum (`'admin'`, `'user'`). This structure prevents privilege escalation via direct profile update attacks.
* **Security Definer Authorization:** Role verification is performed through the cached PostgreSQL function:
  ```sql
  create or replace function public.has_role(_user_id uuid, _role app_role)
  returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
  $$;
  ```

| Capability / Entity | Unauthenticated | Role: `user` | Role: `admin` |
| :--- | :---: | :---: | :---: |
| Access Public Landing / Login | Allowed | Allowed | Allowed |
| Ingest Meeting Transcripts | Denied | Own records only | Own records only |
| Trigger Analysis Server Function | Denied | Allowed (Self-scoped) | Allowed (Self-scoped) |
| Review / Approve Action Items | Denied | Own records only | Own records only |
| View System Monitoring & Metrics | Denied | Own execution traces | Global aggregate metrics |
| Read Security Incidents & Audit Logs | Denied | Own audit events | System-wide audit logs |

### 4.2 AI Safety and Guardrail Mechanics

```text
Untrusted Input (Transcript)
          │
          ▼
┌───────────────────────────────────────────┐
│ 1. Regex Injection Screening              │
│    - Scans for system overrides,          │
│      role hijacking, tool exfiltration    │
│    - Detections logged to security_events │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ 2. PII Masking Engine                     │
│    - Emails masked: [EMAIL]               │
│    - Phone numbers masked: [PHONE]        │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ 3. Isolated LLM Prompt Framing            │
│    - Encapsulated in <transcript> tags    │
│    - Structured JSON schema enforcement   │
│    - Zero tool-execution permissions      │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ 4. Grounding Validation Layer             │
│    - Verifies source text against input   │
│    - Confirms owner matches named entity  │
│    - Rejects hallucinations prior to DB   │
└───────────────────────────────────────────┘
```

1. **Prompt Injection Screen:** Scans for 8 attack patterns (e.g., `ignore previous instructions`, `you are now`, `system:`, `DROP TABLE`). Detected patterns are written to `security_events` with text snippets and correlated to the active `trace_id`.
2. **PII Redaction:** Regex engines replace identifiable email addresses and telephone strings with tokenized placeholders (`[EMAIL]`, `[PHONE]`) before payloads leave the trust boundary.
3. **Structured Hallucination Defense:**
   * Model outputs are restricted to a typed JSON schema (`itemSchema`).
   * The Grounding Validator verifies that $\ge 80\%$ of words in `source_text` exist verbatim in the original transcript.
   * Items referencing owners not present in the transcript are automatically discarded.

---

## 📊 Deliverable 5: Monitoring Dashboard Design

The monitoring architecture tracks live telemetry from `agent_runs`, `security_events`, and relational operational tables. It is structured into six monitoring domains:

```text
+------------------------------------------------------------------------------------+
|                                MONITORING DASHBOARD                                |
+-----------------------------------------+------------------------------------------+
|  1. HEALTH PANEL                        |  2. TRACE WATERFALL PANEL                |
|  - Agent Name                           |  - Trace ID (UUIDv4)                     |
|  - Cumulative Execution Count           |  - Operation Kind (Analysis, Review)     |
|  - Success Percentage (e.g., 98.4%)     |  - Latency Breakdown (ms)                |
|  - Timestamp of Last Execution          |  - Final State Badge (COMPLETED/FAILED)  |
+-----------------------------------------+------------------------------------------+
|  3. QUALITY & GROUNDING PANEL           |  4. SAFETY & GUARDRAILS PANEL            |
|  - Items Accepted (Passed Grounding)    |  - Prompt Injection Flags Count          |
|  - Items Dropped (Hallucination Guard)  |  - PII Masked Counter                    |
|  - Human Approval Conversion Rate (%)   |  - Real-Time Attack Snippet Feed         |
+-----------------------------------------+------------------------------------------+
|  5. COST & USAGE PANEL                  |  6. BUSINESS OUTCOMES PANEL              |
|  - Total LLM Calls (Success / Fail)     |  - Total Managed Tasks                   |
|  - Ingestion Token Count (Prompt)       |  - Open Backlog (TODO / IN_PROGRESS)     |
|  - Generation Token Count (Completion)  |  - Overdue Task Count                    |
|  - Average Model Latency (seconds)      |  - Task Completion Velocity (%)          |
+-----------------------------------------+------------------------------------------+
```

### Telemetry Schema and KPI Definitions

* **Health:** Computed directly from `agent_runs.success` grouped by `agent_runs.agent`. Visualizes agent availability and identifies degraded pipeline steps.
* **Trace Waterfall:** Queries `agent_runs` ordered by `created_at` matching a specific `trace_id`. Provides step-by-step latency inspection:
  $$\text{Latency}_{\text{Total}} = T_{\text{dispatch}} + T_{\text{LLM}} + T_{\text{validation}} + T_{\text{persistence}}$$
* **Quality:**
  $$\text{Grounding Retention Rate} = \frac{\text{Accepted Items}}{\text{Accepted Items} + \text{Dropped Items}} \times 100$$
  $$\text{Human Alignment Score} = \frac{\text{Approved Action Items}}{\text{Total Reviewed Items}} \times 100$$
* **Safety:** Sums detected patterns in `security_events` and counts total redaction events in `agent_runs.details->>'pii_masked'`.
* **Cost / Usage:** Tracks input and output token consumption for model calls using `gpt-6-astra` to monitor cost and identify prompt bloat.
* **Business Outcomes:** Tracks downstream operational impact from `tasks`, measuring overdue task counts and completion velocity.

---

## 💻 Technology Stack Summary

| Layer | Technology | Version | Description |
|---|---|---|---|
| **UI Framework** | React | 19.2.0 | Modern UI runtime with concurrent features |
| **Routing** | TanStack Router | 1.170.41 | Type-safe client/server routing |
| **SSR Framework** | TanStack Start | 1.168.60 | Full-stack server functions & SSR orchestration |
| **Build Tool** | Vite | 8.1.5 | Fast bundling and HMR developer runtime |
| **Styling** | Tailwind CSS | 4.2.1 | Semantic utility CSS with modern token engine |
| **Component Library** | Radix UI / shadcn | Latest | Accessible, unstyled UI primitives |
| **Form Handling** | React Hook Form + Zod | 7.71.2 / 3.25.76 | Type-safe schema validation and form controllers |
| **Charts & Metrics** | Recharts | 2.15.4 | Declarative chart components for telemetry |
| **Icons** | Lucide React | 0.575.0 | Enterprise icon set |
| **Server Runtime** | Nitro | 3.0.260603-beta | Lightweight edge-compatible server engine |
| **Persistence / Auth** | PostgreSQL / Supabase | 2.117.2 | RLS-enforced database and JWT authentication |
| **Language** | TypeScript | 5.8.3 | Strict static type checking |
| **AI Model & Gateway** | OpenAI GPT-6-Astra | Auto-provisioned | Real server-side LLM inference via Lovable AI Gateway |

---

## 📂 Source Code Structure

```text
meeting-action-tracker/
├── package.json                   # Dependencies, scripts, and overrides
├── vite.config.ts                 # Vite + TanStack Start bundler configuration
├── tsconfig.json                  # TypeScript compiler settings
├── eslint.config.js               # Code quality and linting configuration
├── supabase/
│   ├── config.toml                # Supabase local and remote configuration
│   └── migrations/                # Additive SQL migrations (RLS, RBAC, tables)
│       ├── 20261001163258_fe737424-abb9-43ad-a4e1-c520a6cd8c23.sql
│       └── 20261001163317_629bfb0e-bdf3-465c-8a0e-4139e8a899b3.sql
├── public/                        # Static assets and favicons
└── src/
    ├── components/                # Reusable presentation components
    │   ├── AppShell.tsx           # Session gate, navigation, and auth context
    │   ├── Diagram.tsx            # SVG / card architectural diagram renderer
    │   ├── StatusBadge.tsx        # Standardized agent & task status badges
    │   └── ui/                    # 40+ Radix/shadcn enterprise UI components
    ├── hooks/
    │   └── use-mobile.tsx         # Responsive layout hook
    ├── integrations/
    │   ├── lovable/               # Lovable platform integration bindings
    │   └── supabase/              # Supabase client initialization & types
    ├── lib/                       # Core orchestration & agentic business logic
    │   ├── agents.functions.ts    # Server functions for Meeting, Task, and Reminder agents
    │   ├── agents.server.ts       # Server-only execution engine & LLM gateway caller
    │   ├── monitoring.ts          # Telemetry queries & metric calculations
    │   ├── error-capture.ts       # Unified exception handling & trace recording
    │   ├── lovable-error-reporting.ts # Edge error reporting bridge
    │   └── utils.ts               # CSS class merging (clsx + tailwind-merge)
    ├── routes/                    # Type-safe file-based route definitions
    │   ├── __root.tsx             # Root layout with providers & navigation
    │   ├── index.tsx              # Landing & overview page
    │   ├── auth.tsx               # Login, registration, and session gate
    │   ├── profile.tsx            # User profile and role verification
    │   ├── tasks.tsx              # Task management matrix and filter controls
    │   ├── notifications.tsx      # In-app notifications & reminder feed
    │   ├── meetings.index.tsx     # Meetings repository list and search
    │   ├── meetings.new.tsx       # Transcript ingestion & analysis trigger
    │   ├── meetings.$id.tsx       # Meeting details, HITL approval, and task view
    │   ├── architecture.index.tsx # System topology and 7-layer architecture page
    │   ├── architecture.agents.tsx # Agent state machine and handoff visualization
    │   ├── architecture.deployment.tsx # Staging pipeline and scaling specs
    │   ├── architecture.security.tsx # RBAC matrix and AI safety mechanisms
    │   ├── monitoring.index.tsx   # 6-category observability dashboard
    │   ├── monitoring.traces.index.tsx # Execution trace listing
    │   └── monitoring.traces.$traceId.tsx # Granular trace waterfall detail view
    ├── router.tsx                 # Router instance creation
    ├── routeTree.gen.ts           # Auto-generated TanStack route tree
    ├── server.ts                  # Nitro / SSR entry point with error handling
    ├── start.ts                   # TanStack Start bootstrap
    └── styles.css                 # Design tokens and theme definition
```

---

## 🔗 Links

| Resource | URL |
|---|---|
| **Live Deployed Application** | [https://meeting-action-tracker.lovable.app/](https://meeting-action-tracker.lovable.app/) |
| **Platform** | [https://lovable.dev](https://lovable.dev) |
