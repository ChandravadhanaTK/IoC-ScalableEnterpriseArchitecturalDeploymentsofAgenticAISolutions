# PlacePilot AI — Comprehensive Application Generation Prompt

> **Purpose**: This prompt file is Outcome 1 of the Capstone Deliverables. It can be used directly with modern agentic code-generation platforms (such as Lovable, Claude, Cursor, Antigravity, etc.) to generate the complete PlacePilot AI application from scratch.

---

You are an expert full-stack engineer and AI systems architect.
Build **PlacePilot AI** — an enterprise-grade agentic AI personal placement intelligence and preparation platform for college students.

## 1. PRODUCT MISSION & SCOPE

The application is a personal placement intelligence and preparation assistant for college students navigating campus placements.

- It does **NOT** replace the official college placement portal (registrations and official confirmations still occur on the college portal).
- It turns noisy WhatsApp forwards, departmental emails, and placement circulars into structured eligibility, recruitment milestones, resume gap analysis, and tailored day-by-day preparation plans.

---

## 2. CORE SIX-AGENT WORKFLOW ARCHITECTURE

The system orchestrates six sequential workflow agents under an Orchestrator, with a cross-cutting Monitoring & Observability layer:

1. **Notification Extraction Agent**: Ingests raw text and converts it into a typed Opportunity schema. Supports Real AI LLM extraction with automatic fallback to a deterministic parser.
2. **Eligibility Analysis Agent**: Compares student academic credentials (CGPA, 10th/12th, backlogs, branch, degree, batch) deterministically against company requirements. Missing requirements stay "Not specified" without fabricating criteria.
3. **Recruitment Timeline Agent**: Chronologically orders drive milestones (Registration, PPT, OA, Technical, HR). Undated rounds (e.g. "Post-OA shortlist") display "Date: Not specified" with their status note. Never invents dates.
4. **Resume Matching Agent**: Anonymizes student PII (email, phone, Aadhaar, name) before model ingestion. Performs skill matching. If the company notice provides fewer than 3 structured skills, suppresses percentage score with "Match score unavailable" and provides qualitative "Suggested preparation areas".
5. **Preparation Planner Agent**: Creates a day-by-day prep plan up to the Online Assessment date (DSA, Stack/Frontend, SQL/DBMS, REST APIs, System Design, Mock Assessment, Mock Interview). Includes interactive completion checkboxes and progress percentage.
6. **Reminder & Alert Agent**: Generates T-24h and T-1h reminders for dated milestones. Displays in-app alerts with a "Mark as seen" interaction and provides an explicit opt-in browser Notification API trigger. Strictly no fake SMS claims.

_Cross-Cutting Layer_: **Monitoring & Observability** tracks trace_id, span_id, parent_span_id, latency, token counts, engine mode, and safety flags across every pipeline run.

---

## 3. FIVE ACADEMIC CAPSTONE DELIVERABLES

Implement five dedicated course deliverable pages accessible via primary navigation:

### Deliverable 1: System Architecture (`/architecture`)

- Interactive 7-layer architecture diagram:
  1. User Layer (Student, Placement Coordinator, Auditor)
  2. Experience Layer (TanStack Start, React 19 SSR, Live Agent Stepper, Execution Badges)
  3. AI Orchestration Layer (Pipeline Orchestrator, Engine Router, Guardrails)
  4. Agent Layer (6 workflow agents)
  5. Application Services (Profile Service, Audit Service, Observability)
  6. Data Layer (PostgreSQL with RLS for production; localStorage cache for classroom prototype)
  7. External Integrations (Lovable AI Gateway, notification sources, college placement portal)
- Trust boundaries (Untrusted client, App edge, Trusted server zone, Third-party) and animated request/response data flows.
- Interactive component inspector showing tech stack and responsibilities.

### Deliverable 2: Agent Workflow Design (`/architecture/agents`)

- Visual pipeline and handoff flow.
- Agent states: `IDLE`, `PROCESSING`, `VALIDATING`, `AWAITING_APPROVAL`, `COMPLETED`, `FAILED`, `FALLBACK`.
- Tool JSON input and output schemas for each agent.
- Explicit Human-in-the-Loop (HITL) review checkpoint after extraction.
- Failure circuits, exponential backoff retries, and deterministic fallback rules.

### Deliverable 3: Deployment Strategy (`/architecture/deployment`)

- 4-stage pipeline: Development (`dev`) → Testing/Staging (`staging`) → Preview Deployment (`preview`) → Production (`prod`).
- CI/CD, zero-downtime releases, serverless elasticity, edge caching, secrets isolation.
- Interactive live health probes: `/api/public/healthz` (liveness) and `/api/public/readyz` (readiness).

### Deliverable 4: Security Model (`/architecture/security`)

- Role-based access control matrix across 3 roles: Student, Placement Coordinator, Auditor.
- Row Level Security (RLS) SQL policies: `auth.uid() = student_id`.
- Distinction note: PostgreSQL/RLS represents the production architecture, while local deterministic persistence represents the current classroom prototype.
- Interactive Resume PII Anonymizer simulator (redacting email, phone, Aadhaar, name).
- Interactive Prompt Injection Guardrail simulator screening for instruction override, role hijack, system prompt exfiltration, and eligibility tampering.
- Tamper-evident audit log with SHA-256 hash-chaining and an interactive "Verify Chain" and "Simulate Tampering" demonstration.

### Deliverable 5: Monitoring Dashboard & Trace Inspector (`/monitoring` & `/monitoring/traces`)

- Monitoring Dashboard with 6 mandatory categories:
  1. Health (Uptime, fallback rate, error rate, p95 latency)
  2. Trace (Trace count, agent span count, latency bar chart)
  3. Quality (HITL approval count, "Not specified" count, schema validity)
  4. Safety (Prompt injection flags, PII redactions, zero keys exposed)
  5. Cost / Usage (Token estimates, real AI vs demo engine runs)
  6. Business Outcomes (Drives tracked, eligible drives, prep completion %)
- Illustrative values labeled with `DEMO METRIC`.
- Deep Trace Inspector displaying span tree, parent-child depth indentation, latency waterfall bars, token estimates, and truthful engine badges (`real-ai`, `rule-engine`, `structured-match`, `ai-assist`/`det-template`, `rule-scheduler`).

---

## 4. PRIMARY DEMO DATASET (PTUM)

Seed the application with the canonical PTUM campus recruitment notice:

```text
📢 Campus Recruitment Drive — 2027 Batch
Company: PTUM
Role: Full Stack Engineer
CTC UG: Not applicable
Annual Salary UG: ₹18 Lakhs
CTC PG: Not applicable
Annual Salary PG: ₹18 Lakhs

Eligible Programs:
- B.E./B.Tech./B.Arch — Computer Science and Engineering
- B.E./B.Tech./B.Arch — Electrical and Electronics
- B.E./B.Tech./B.Arch — Electronics & Communication
- B.E./B.Tech./B.Arch — Information Technology
- B.E./B.Tech./B.Arch — Artificial Intelligence & Data Science
- MCA — Computer Applications

Registration: 30 Sep 2026 2:30 PM to 1 Oct 2026 2:30 PM
Online Assessment: 8 October 2026 1:00 PM
Pre-Placement Talk: 15 October 2026 9:00 AM
Technical & HR Rounds: Post-OA shortlist
Students must register on the placement portal before the deadline.
```
- Preserve exact dates.
- Do NOT invent dates for Technical or HR rounds; display "Date: Not specified" and "Status: Post-OA shortlist".
- Suppress resume match percentage for PTUM ("Match score unavailable").

---

## 5. CONFIGURABLE DEMO STUDENT PROFILE

Seed with a configurable demo student:

- Name: Arjun Raghavan
- Degree: B.Tech, Branch: CSE, Batch: 2027
- CGPA: 8.42, 10th: 92.4%, 12th: 88.6%, Backlogs: 0 active, 1 cleared
- Skills: JavaScript, React, Node.js, SQL, Python, Data Structures, Git
- Clearly presented as a "Demo Student Profile" on dashboard, profile, and navigation.
- Full edit and reset capabilities with instant eligibility re-calculation on save.

---

## 6. UI & DESIGN SYSTEM

- Theme: Dark aviation flight-deck aesthetic (`#0b0f19` background, `#111827` cards, `#1f2937` borders).
- Accents: Amber/Gold primary (`hsl(38 92% 50%)`), Info cyan/blue, Success emerald, Warning amber, Destructive red.
- Fonts: `Space Grotesk` for headings and body; `JetBrains Mono` for code, dates, metrics, and badges.
- Execution Badges: Transparently distinguish `[Real AI Execution]` from `[Deterministic Demo Engine]` and truthful agent-level engines (`Rule Engine`, `Structured Matching`, `Rule-based Scheduler`).
