# Enterprise Capstone Deliverables – CampusFix

> **Project:** CampusFix – AI-Powered Campus Issue & Facility Management Platform  
> **Student Name:** Jamuna S  
> **Roll Number:** 2023103567  
> **Repository:** https://github.com/JamunaSenthil/CampusFix-AI-Powered-Campus-Issue-Management-System  
> **Course:** Internet of Computation (IoC) Capstone  
> **Documentation Standard:** Enterprise Architecture Completeness Framework (5 Core Artifacts)

---

## Executive Summary

CampusFix is an enterprise-grade campus operations and issue triage platform built to bridge the gap between student grievances and facilities engineering. This document provides the **Five Capstone Deliverables** demonstrating architectural completeness, resilience, security, and governance.

---

## 1. Architecture Diagram
*Layers, components, trust boundaries, and integrations.*

### 1.1 Enterprise Layered Architecture

```
+===================================================================================+
|                                PRESENTATION LAYER                                 |
|  +-------------------------------------+   +------------------------------------+ |
|  |       Student Web Portal            |   |     Admin Dispatch Console         | |
|  | - Frictionless Registration/Auth    |   | - Real-time Status Board           | |
|  | - Issue Submission + Media Upload   |   | - Department Crew Assignment       | |
|  | - Live Stepper & Notification Hub   |   | - Analytics & SLA Trend Radar      | |
|  +-------------------------------------+   +------------------------------------+ |
|                                React 19 SPA + Tailwind CSS                        |
+=========================================|=========================================+
                                          | HTTPS / REST / JSON
                                          v
+===================================================================================+
|                        API GATEWAY & APPLICATION SERVER                           |
|  +------------------------------------------------------------------------------+ |
|  | Express 4.21 Application Gateway (Port 3000 / Cloud Run Auto-Port)            | |
|  | - Security Headers, Rate Limiting & Strict CORS Configuration                | |
|  | - JWT Bearer Token Verification & Role-Based Access Control (RBAC)           | |
|  +------------------------------------------------------------------------------+ |
|        |                                 |                             |          |
|        v                                 v                             v          |
|  [ Auth Service ]              [ Issues Service ]            [ Notifications ]    |
|  - bcrypt (salt 10)            - CRUD & Timeline Logging     - In-App Alerts      |
|  - Stateless Token Gen         - Search & Multi-Filter       - Read/Unread Cache  |
+=========================================|=========================================+
                       |                                       |
    [Internal AI Gateway]                          [Data Access Object Layer]
                       |                                       |
                       v                                       v
+==================================+      +=========================================+
|      AI ORCHESTRATION ENGINE     |      |          DATA PERSISTENCE LAYER         |
|  +-----------------------------+ |      |  +-----------------------------------+  |
|  | Gemini 3.8 Flash SDK        | |      |  | Remote MongoDB / Atlas Cluster    |  |
|  | - Category Classification   | |      |  | (Primary Connection Pool)         |  |
|  | - Severity Priority Scoring | |      |  +-----------------------------------+  |
|  | - Department Routing Agent  | |      |                  | (Fallback on Err)    |
|  +-----------------------------+ |      |                  v                      |
|                 | (Failover)     |      |  +-----------------------------------+  |
|                 v                |      |  | Embedded BSON/JSON Persistence    |  |
|  +-----------------------------+ |      |  | (Atomic Disk Write & Memory Index)|  |
|  | Rule-Based Heuristic Parser | |      |  +-----------------------------------+  |
+==================================+      +=========================================+
```

### 1.2 Trust Boundaries & Security Enclaves

| Boundary Zone | Components Included | Security Controls Enforced |
| :--- | :--- | :--- |
| **Zone 0: Public DMZ** | Landing Page, Public Tracking Search (`/api/issues/ref/:refId`), Health Check (`/api/health`) | Rate-limited, payload size limits (10MB), SQL/NoSQL injection sanitation. |
| **Zone 1: Authenticated User** | Student Dashboard, Issue Reporting, Student Profile, Notification Center | Signed JWT Token required in `Authorization: Bearer <token>`, user ownership validation. |
| **Zone 2: Privileged Operations** | Admin Management Board, Department Dispatch, Status Transitions, Resolution Remarks | Signed JWT with `role === "admin"` strictly validated on every administrative route. |
| **Zone 3: Secure Backplane** | Persistence Engine, Gemini API Secret, Audit Ledger | Private environment credentials (`GEMINI_API_KEY`, `JWT_SECRET`, `MONGODB_URI`). |

---

## 2. Agent Workflow Design
*Roles, states, tools, handoffs, approvals, and failure paths.*

### 2.1 Multi-Agent Workflow State Machine

```
      [Student Submits Issue]
                 │
                 ▼
    ┌─────────────────────────┐
    │  Triage Intake Agent    │ ───► Validate Form Schema (Title, Description, Location)
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ Gemini AI Classify Tool │ ───► Evaluates Semantic Intent & Context
    └────────────┬────────────┘
                 │
      ┌──────────┴──────────┐
      │ Primary API Healthy?│
      └──────────┬──────────┘
           YES │     │ NO (Timeout / Rate Limit)
               │     └──────────────────────────────────────┐
               ▼                                            ▼
    ┌─────────────────────────┐              ┌─────────────────────────────┐
    │ GenAI Model Resolution  │              │ Rule-Based Fallback Engine  │
    │ (Gemini 3.8 Flash)      │              │ (Keyword & Heuristic Score) │
    └────────────┬────────────┘              └──────────────┬──────────────┘
                 │                                          │
                 └───────────────────┬──────────────────────┘
                                     ▼
                      ┌─────────────────────────────┐
                      │    Classification Output    │
                      │ - Category (11 taxonomies)  │
                      │ - Priority (Low to Critical)│
                      │ - Target Campus Department  │
                      └──────────────┬──────────────┘
                                     ▼
                        [Database Atomic Commit]
                      Status: PENDING | Stepper: 1/4
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       [In-App Student Alert]               [Admin Triage Queue Alert]
                 │                                       │
                 │                 ┌─────────────────────┘
                 │                 ▼
                 │    ┌─────────────────────────────┐
                 │    │ Human-in-the-Loop Review    │
                 │    │ (Campus Estate / Admin)     │
                 │    └────────────┬────────────────┘
                 │                 │
                 │                 ├─► Approve / Reassign Department ──► Status: ASSIGNED (2/4)
                 │                 │
                 │                 ├─► Dispatch Crew to Site        ──► Status: IN PROGRESS (3/4)
                 │                 │
                 │                 ├─► Official Remarks & Complete  ──► Status: RESOLVED (4/4)
                 │                 │
                 │                 └─► Mark Duplicate or Invalid    ──► Status: REJECTED
                 │
                 ▼
      [Student Notification Feed & Progress Stepper Live Update]
```

### 2.2 Roles, Tools, Handoffs & Failure Paths

| Element | Specification |
| :--- | :--- |
| **Intake Role** | Ingests raw grievance reports, parses base64/URL photo attachments, and ensures no private PII (Aadhaar/Gov ID) is demanded. |
| **Classifier Agent** | Invokes `@google/genai` with structured JSON schema constraints to parse severity and appropriate campus maintenance division. |
| **Failure Path (Fail-Open)** | If the Gemini API call exceeds 2500ms or returns an error, execution gracefully falls back to the deterministic keyword heuristic engine. Zero failed submissions. |
| **Human-in-the-Loop Approval** | Facility managers review AI suggestions with 1-click confirmation or manual override prior to physical maintenance crew dispatch. |

---

## 3. Deployment Strategy
*Runtime, scaling, resilience, environments, and release pipeline.*

### 3.1 Environments & Topology

| Environment | Hosting Target | Scaling Policy | Purpose |
| :--- | :--- | :--- | :--- |
| **Development** | AI Studio Dev Environment | Single instance (`PORT 3000`), live reload enabled | Feature iteration & unit validation |
| **Staging / Preview**| Google Cloud Run (asia-southeast1) | Auto-scale (0 to 5 instances), ephemeral containers | End-to-end integration & QA |
| **Production** | Google Cloud Run Container | Auto-scale (1 to 20 instances), min-instances: 1 | High-availability student portal |

### 3.2 Resilience & Self-Healing Architecture
- **Stateless Web Tier**: Express server holds no session state in process memory; authentication is validated via cryptographic JWT signatures.
- **Graceful Shutdown**: Traps `SIGTERM` and `SIGINT` signals, drains ongoing HTTP transactions for 5 seconds before terminating DB pools.
- **Dual-Engine Persistence Resilience**: If an external MongoDB cluster fails or connection times out, the backend auto-switches to the high-performance local embedded engine with zero downtime.

---

## 4. Security Model
*Identity, authorization, secrets, privacy, guardrails, and audit.*

### 4.1 Threat Model & Mitigations

```
Threat Vector                       Architectural Mitigation
─────────────────────────────────────────────────────────────────────────────
Credential Stuffing / Brute Force   ▶ bcrypt adaptive hashing with 10 salt rounds
Tampered Authentication Tokens      ▶ Cryptographically signed HS256 JWT tokens
Privilege Escalation                ▶ Server-side role guard middleware ('admin' vs 'student')
Invasive PII Tracking               ▶ Zero-barrier registration (Strictly NO Aadhaar, Gov ID)
Injection & Payload Attacks         ▶ Parameterized queries, schema sanitization, 10MB limits
API Secret Leakage                  ▶ Zero secrets on frontend; backend-only proxy architecture
```

### 4.2 Comprehensive Audit Ledger
Every issue state transition records an immutable audit log entry containing:
- `timestamp`: ISO 8601 UTC timestamp
- `actorId`: User ID of student or administrator
- `action`: State change event (e.g., `CREATED`, `ASSIGNED`, `STATUS_UPDATED`, `REMARK_ADDED`)
- `previousState` & `newState`: State delta
- `remarks`: Inspection notes added by the administrator

---

## 5. Monitoring Dashboard Design
*Health, trace, quality, safety, cost, and business outcomes.*

### 5.1 Monitoring Metrics Matrix

| Category | Metric Tracked | Target SLA | Alarm Threshold |
| :--- | :--- | :--- | :--- |
| **System Health** | HTTP 200 on `/api/health` | > 99.9% uptime | Any non-200 response |
| **API Latency** | P95 Server Response Time | < 250 ms | > 800 ms over 2 min |
| **AI Reliability** | Gemini Classification Success Rate | > 98.5% | > 5% fallback to heuristic |
| **Security Guardrails**| 401/403 Authentication Failures | < 0.5% | > 25 failed attempts / min |
| **Business SLA** | Campus Complaint Resolution Time | < 48 Hours | Issues pending > 72 Hours |
| **Cost Optimization** | LLM Token Utilization per Issue | < 250 tokens / issue | > 1000 tokens / issue |

### 5.2 Synthetic Monitoring Layout

```
+-----------------------------------------------------------------------------------+
|  CAMPUSFIX SYSTEM HEALTH & SLA OBSERVABILITY MATRIX                               |
+--------------------------+--------------------------+-----------------------------+
| Uptime: 99.98% (Healthy) | Avg Latency: 42ms        | AI Triage Accuracy: 99.4%   |
+--------------------------+--------------------------+-----------------------------+
| Active Incidents by Category:                       | Resolution Funnel (SLA):    |
| [Hostel]     ████████████████████ 38%               | New Reported:   100%        |
| [Electricity]████████████ 24%                       | Under Triage:    92%        |
| [Classroom]  ████████ 16%                           | Crew Dispatched: 78%        |
| [Sanitation] ██████ 12%                             | Resolved <48h:   84%        |
| [Internet]   ████ 10%                               |                             |
+-----------------------------------------------------+-----------------------------+
| Trace Log: [2026-10-02 19:20:12] POST /api/issues 201 Created (18ms) - OK         |
+-----------------------------------------------------------------------------------+
```
