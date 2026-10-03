# CampusFix – Project & Capstone Deliverables

**Student Name:** Jamuna S  
**Roll Number:** 2023103567  
**Project Title:** CampusFix – AI-Powered Campus Issue Management System  
**GitHub Repository:** https://github.com/JamunaSenthil/CampusFix-AI-Powered-Campus-Issue-Management-System  
**Live URL:** https://ais-pre-n5juj74dytbhepwzp2ttii-196015505867.asia-southeast1.run.app  
**Framework:** React 19, TypeScript, Tailwind CSS, Node.js + Express, MongoDB, Gemini AI  

---

## 🏛️ Enterprise Capstone Deliverables (5 Core Artifacts)

CampusFix implements the complete 5-part Enterprise Architecture Framework documented in **`CAPSTONE_DELIVERABLES.md`**:

```
+─────────────────────────────────────────────────────────────────────────────+
|                          CAPSTONE DELIVERABLES                              |
|  Five artifacts that demonstrate enterprise architecture completeness      |
+───┬──────────────────────────┬──────────────────────────────────────────────+
| 1 | Architecture Diagram     | Layers, components, trust boundaries, APIs   |
| 2 | Agent Workflow Design    | Roles, states, tools, handoffs & failure paths|
| 3 | Deployment Strategy      | Runtime, scaling, resilience & environments  |
| 4 | Security Model           | Identity, authorization, privacy & audit     |
| 5 | Monitoring Dashboard     | Health, latency, AI quality, cost & SLAs     |
+───┴──────────────────────────┴──────────────────────────────────────────────+
```

1. **Artifact 1: Architecture Diagram**  
   - Presentation Layer (React 19 SPA), Application Layer (Express 4.21 Gateway), AI Orchestration Engine (Gemini 3.8 Flash), and Persistence Layer (MongoDB + Embedded BSON fallback).
   - Trust Boundaries: Public DMZ, Authenticated User Zone, Privileged Admin Enclave, and Secure Credential Backplane.

2. **Artifact 2: Agent Workflow Design**  
   - Multi-agent state machine: Intake Agent → Gemini AI Classification Tool → Failover Heuristic Parser → Atomic DB Commit → In-App Notification Dispatch → Human-in-the-Loop Admin Review & Status Escalation.
   - Fail-Open reliability with 100% submission availability.

3. **Artifact 3: Deployment Strategy**  
   - Google Cloud Run production runtime with auto-scaling (1–20 instances).
   - Zero-downtime rolling updates, graceful signal trapping (`SIGTERM`), and dual-engine persistent failover.

4. **Artifact 4: Security Model**  
   - Role-Based Access Control (RBAC), bcrypt credential hashing with 10 salt rounds, signed HS256 JWT tokens.
   - Zero-barrier registration eliminating invasive PII, Aadhaar, government ID, or OTP collection.
   - Comprehensive chronological audit trail on all ticket mutations.

5. **Artifact 5: Monitoring Dashboard Design**  
   - Health check probes (`/api/health`), P95 latency tracking (<250ms target), AI triage accuracy monitoring (>98.5%), and 48-hour resolution SLA funnel observability.

---

## 📋 Implemented Functional Modules

| Deliverable | Description | Status |
| :--- | :--- | :--- |
| **Student Web Portal** | Frictionless registration, analytical dashboard, issue reporting, live tracker | ✅ Completed |
| **Admin Operations Board** | Department assignment, category & severity analytics, status transitions | ✅ Completed |
| **AI Classification Engine** | Gemini GenAI API with deterministic keyword fallback classifier | ✅ Completed |
| **Dual Database Persistence** | MongoDB remote connection with persistent embedded JSON engine | ✅ Completed |
| **In-App Notification Feed** | Real-time status update alerts with unread badge counter | ✅ Completed |
| **Live Production Deployment** | Publicly accessible Cloud Run production environment | ✅ Completed |

---

## 🔑 Demo Access Credentials

- **Campus Administrator:** `admin@campusfix.edu` / `AdminPassword123!`
- **Student Account 1:** `alex.chen@campusfix.edu` / `StudentPass123!`
- **Student Account 2:** `priya.patel@campusfix.edu` / `StudentPass123!`
