# CareRoute: Healthcare Appointment & Triage Assistant
> **Enterprise Multi-Agent Clinical Triage, Scheduling & Provider Handoff Platform**

**Student Name:** Kokhulash M S  
**Roll Number:** 2023103063  
**Course:** Scalable Enterprise Architectural Deployments of Agentic AI Solutions (IoC)  
**Instructor:** Chandravadhana T.K., Senior AI/ML Architect  
**Guidance:** Dr. K. Saravanan, Department of Information and Communication Engineering, Anna University (CEG, Guindy)  
**Live Application URL:** [https://health-ally-quest.lovable.app/](https://health-ally-quest.lovable.app/)  

---

## 📂 Submission Deliverables & Directory Contents

This directory contains the complete Capstone Project submission for the Industry Oriented Course:

| File / Folder | Description |
| :--- | :--- |
| 📄 [`deliverables.md`](deliverables.md) | **Comprehensive Capstone Deliverables**: Architecture Diagram, Agent Workflow Design, Deployment Strategy, Security Model, and Monitoring Dashboard Design. |
| 📄 [`prompt.md`](prompt.md) | **Master Build / Generation Prompt**: Full prompt specification used to generate the CareRoute application. |
| 📄 [`deployed-link.md`](deployed-link.md) | **Live Deployed Application Link**: Direct link to the live production deployment. |
| 📁 [`health-ally-quest-main/`](health-ally-quest-main/) | **Source Code Directory**: Complete React / TanStack Start / TypeScript enterprise web application codebase. |

---

## 🌐 Live Application

The application is deployed and operational at:  
👉 **[https://health-ally-quest.lovable.app/](https://health-ally-quest.lovable.app/)**

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

## 🏆 Capstone Deliverables Summary

Detailed documentation for all five deliverables is available in [`deliverables.md`](deliverables.md) and inside the live application at `/architecture` and `/monitoring`:

1. **Architecture Diagram** (`/architecture#topology`): Three-tier trust zones (Client DMZ, Agent Orchestration Gateway, PHI-Isolated Data Tier) with mTLS, WAF, and FHIR R4 abstraction.
2. **Agent Workflow Design** (`/architecture#workflow`): Deterministic state machine governing intake, triage, slot reservation, and physician approval gates.
3. **Deployment Strategy** (`/architecture#deployment`): Kubernetes containerized microservices, HPA auto-scaling (2 to 40 replicas), circuit breakers, dead-letter queues, and multi-region failover.
4. **Security Model** (`/architecture#security`): HIPAA safeguards, RBAC permission matrix (`Patient`, `Triage Nurse`, `Physician`, `EHR Admin`), and synthetic client-side PII de-identification pipeline.
5. **Monitoring Dashboard Design** (`/monitoring`): OpenTelemetry distributed tracing, P95 latency tracking, clinical safety override metrics, and token cost breakdown.

---

## 🚀 Key Interactive Portals in Live App

- **Patient Triage & Booking** (`/`): Conversational triage with instant scenario quick-starters (Cardiac red flag, urgent sprain, routine checkup) and interactive calendar booking.
- **Clinician Review Desk** (`/doctor-portal`): Review queue with auto-generated SOAP notes, SBAR handoff briefings, and "Sign & Push to EHR" action.
- **Follow-Up & Care Coordination** (`/follow-ups`): Milestone recovery tracking (24h, 48h, 7-day) with interactive worsening symptom escalation simulation.
- **Enterprise Architecture Blueprint** (`/architecture`): Interactive tabs for Topology, State Machine, Security/RBAC, and Deployment.
- **Observability Dashboard** (`/monitoring`): Real-time streaming telemetry charts and OpenTelemetry span trace visualizer.

---

## 💻 Local Development & Setup

```bash
# Navigate to the source code folder
cd health-ally-quest-main

# Install dependencies (Node 18+ or Bun)
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` (or the port specified by Vite/TanStack Start).

---

## ⚖️ Clinical Disclaimer

*This application is an educational prototype and clinical decision support demonstration built for the Industry Oriented Course on Scalable Enterprise Architectural Deployments of Agentic AI Solutions (Anna University CEG). It is not a certified Medical Device and does not provide formal medical diagnoses or prescriptions. In any real-world emergency, dial 911 or visit the nearest emergency department.*
