# CareRoute: Healthcare Appointment & Triage Assistant
> **Enterprise Multi-Agent Clinical Triage, Scheduling & Provider Handoff Platform**

**Status:** `Live Deployment` • **URL:** [health-ally-quest.lovable.app](https://health-ally-quest.lovable.app/) • **Standard:** `FHIR R4` • **License:** `MIT`

---

## 🌐 Live Application

The application is deployed and available at:
**[https://health-ally-quest.lovable.app/](https://health-ally-quest.lovable.app/)**

---

## 📌 Executive Summary

Modern ambulatory care faces severe intake bottlenecks, excessive clinician administrative burden, and high rates of inappropriate emergency department visits. 

**CareRoute** is an enterprise-grade multi-agent platform designed to streamline the patient care journey from initial symptom onset to clinician review and post-visit follow-up. Built on a deterministic orchestration state machine, CareRoute combines four specialized AI agents with clinical safety guardrails, automated Emergency Severity Index (ESI) classification, and automated clinician documentation synthesis (SOAP / SBAR).

---

## 🤖 The Multi-Agent Architecture

CareRoute distributes responsibilities across four specialized autonomous agents orchestrated by a centralized state machine:

| Agent | Core Responsibilities | Key Tools & Interfaces | Guardrails & Safety |
| :--- | :--- | :--- | :--- |
| **1. Symptom Triage Agent** | • Multi-turn conversational intake (Chief Complaint, Onset, Pain 1–10, History)<br>• Acuity classification (ESI Levels 1–5)<br>• Specialty routing recommendation | `classifySymptomAcuity`, `detectRedFlags`, `extractClinicalEntities` | **G-01 Red-Flag Lockout**: Halts scheduling on cardiac/stroke/respiratory distress; directs immediately to 911/ED. |
| **2. Scheduling Agent** | • Specialty-to-provider matching<br>• Calendar slot reservation (In-Person vs. Telehealth)<br>• FHIR `Appointment` and `Encounter` creation | `queryAvailableSlots`, `reserveSlot`, `verifyInsuranceEligibility` | **G-02 Slot Conflict Prevention**: Mutex lock on appointment slots, idempotency verification. |
| **3. Doctor Summary Agent** | • Synthesizes transcript into structured SOAP Notes<br>• Generates rapid SBAR clinical handoff briefings<br>• Pre-fills EHR documentation | `generateSOAPNote`, `buildSBARBrief`, `signAndPushToEHR` | **G-03 Human-in-the-Loop Sign-off**: Physician verification and inline edit before committing to EHR. |
| **4. Follow-Up Reminder Agent** | • Post-visit recovery tracking (24h, 48h, 7-day)<br>• Automated check-ins via SMS/Email/Portal<br>• Worsening symptom detection & escalation | `scheduleFollowUpCron`, `dispatchNotification`, `triggerReTriage` | **G-04 Deterioration Escalation**: Real-time nurse notification if patient reports worsening symptoms. |

---

## 🏆 Capstone Deliverables Coverage

CareRoute covers all five enterprise capstone deliverables through dedicated architectural views and interactive workflows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CAPSTONE DELIVERABLES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Architecture Diagram   → Layers, trust boundaries, integrations (/arch) │
│  2. Agent Workflow Design  → Roles, states, tools, handoffs, approvals      │
│  3. Deployment Strategy    → Runtime, scaling, resilience, environments     │
│  4. Security Model         → Identity, authorization, secrets, HIPAA, audit │
│  5. Monitoring Dashboard   → Health, trace, quality, safety, telemetry      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Architecture Diagram (`/architecture?tab=topology`)
- **Patient DMZ Layer**: Public SSL termination, web application firewall (WAF), rate limiting, and anonymous session handling.
- **Agent Orchestration Tier**: Deterministic state machine managing agent context windows, handoff contracts, and schema-validated tool invocations.
- **Tool & Integration Gateway**: FHIR R4 abstraction layer (`Patient`, `Encounter`, `Schedule`, `Appointment`) and external calendar connectors.
- **Isolated PHI Data Layer**: HIPAA-compliant datastore with AES-256 encryption at rest, KMS envelope encryption, and append-only audit trail.

### 2. Agent Workflow Design (`/architecture?tab=workflow`)
- Formal 5-state intake machine: `INTAKE_INITIATED` $\to$ `SYMPTOM_ASSESSMENT` $\to$ `ACUITY_CLASSIFIED` $\to$ `SLOT_RESERVED` $\to$ `CLINICIAN_HANDOFF`.
- Explicit emergency abort branch redirecting ESI-1/2 cases to urgent emergency care.
- Human-in-the-loop approval gates before medical records are synchronized to core hospital systems.

### 3. Deployment Strategy (`/architecture?tab=deployment`)
- **Runtime**: Containerized microservices on Kubernetes with auto-scaling based on queue depth and token generation throughput.
- **Resilience**: Circuit breakers on external EHR integrations, dead-letter queues (DLQ) for asynchronous notification tasks, and multi-region failover.
- **CI/CD & Release**: Automated prompt regression test suites, canary rollouts, and synthetic de-identified clinical test fixtures.

### 4. Security Model (`/architecture?tab=security`)
- **Role-Based Access Control (RBAC)**: Strict permission boundaries for `Patient`, `Triage Nurse`, `Attending Physician`, and `EHR Admin`.
- **PHI / PII Sanitization**: Client-side de-identification pipeline masking direct identifiers before external model inference.
- **Cryptographic Safeguards**: TLS 1.3 in transit, AES-256 at rest, hardware security module (HSM) key rotation.
- **Audit Logging**: Immutable, tamper-evident audit logs capturing every agent decision, tool execution, and clinician override.

### 5. Monitoring Dashboard Design (`/monitoring`)
- **System Health & Performance**: p95/p99 token latency, inference throughput, gateway error rates.
- **Clinical Safety & Quality**: Red-flag escalation rate (%), human clinician override percentage, hallucination/schema failure metrics.
- **Operational & Financial Telemetry**: Average intake duration, appointment booking conversion rate, token cost breakdown per agent.
- **Distributed Traces**: Expandable OpenTelemetry trace visualizer displaying tool spans, model execution timing, and latency waterfalls.

---

## 🚀 Interactive Application Views

The live application features five dedicated portal interfaces accessible via the top navigation:

### 1. Patient Triage & Booking (`/`)
- Natural conversational intake with instant scenario chips (e.g., *Chest Pain & Shortness of Breath*, *Sprained Ankle*, *Routine Hypertension Checkup*).
- Real-time visual progress stepper and active agent orchestration indicator.
- Interactive booking modal with clinician selection, visit mode (In-Person / Telehealth), and slot reservation.

### 2. Clinician Review & SOAP Desk (`/doctor-portal`)
- Clinical review queue displaying triaged patient encounters.
- Automated **SOAP Note** generator with live inline editor.
- **SBAR Handoff** executive briefing card with one-click *"Sign & Push to EHR"* synchronization.
- Complete transcript audit log with highlighted clinical findings.

### 3. Follow-Up & Care Coordination Center (`/follow-ups`)
- Active patient recovery tracking across 24h, 48h, and 7-day milestones.
- Channel delivery simulation (SMS, Email, Patient Portal).
- Interactive escalation testing: click *"Simulate worsening symptoms"* to test live re-triage alerts dispatched to on-call nursing staff.

### 4. Architecture Blueprint (`/architecture`)
- Interactive four-pillar architectural documentation suite:
  1. *Topology & Trust Boundaries*
  2. *State Machine & Handoffs*
  3. *Security & Compliance (RBAC/HIPAA)*
  4. *Deployment & Resilience*

### 5. Monitoring & Observability (`/monitoring`)
- Comprehensive telemetry tracking agent latency, safety override rates, cost per triage session, and live distributed execution traces.

---

## 🛠️ Technology Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) with TypeScript & React
- **Styling & Components**: Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/), Lucide Icons
- **State Management & Routing**: TanStack Router with reactive in-memory clinical session store
- **Standards**: HL7 FHIR R4 data models, Emergency Severity Index (ESI) clinical decision support logic

---

## 💻 Local Development

```bash
# Clone the repository
git clone <repository-url>
cd health-ally-quest

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## ⚖️ Clinical Disclaimer

*This application is an educational prototype and clinical decision support demonstration. It is not a certified Medical Device and does not provide formal medical diagnoses or prescriptions. In any real-world emergency, dial 911 or visit the nearest emergency department.*
