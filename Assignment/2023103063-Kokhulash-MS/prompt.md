# Comprehensive Build Prompt: Healthcare Appointment & Triage Assistant

Build a production-ready, interactive enterprise prototype for a **Healthcare Appointment & Triage Assistant** — an autonomous multi-agent healthcare platform featuring 4 specialized agents, clinical safety guardrails, doctor-facing review portals, and real-time observability telemetry.

---

## 1. System Overview & Core Agents

The application implements an orchestrated multi-agent workflow covering patient intake, clinical acuity evaluation, slot scheduling, clinician note generation, and post-encounter follow-ups:

1. **Symptom Triage Agent**:
   - Conversational intake collecting chief complaint, onset, pain score (1–10), associated symptoms, medical history, and current medications.
   - Clinical acuity classification based on the Emergency Severity Index (ESI Levels 1–5):
     - **ESI 1 & 2 (Immediate/Emergency)**: Red-flag triggers (e.g., crushing chest pain, acute dyspnea, stroke signs, sudden severe neurological deficit). Instantly halts automated scheduling and triggers high-visibility emergency directives (Call 911 / Immediate Emergency Room redirect).
     - **ESI 3 (Urgent)**: Same-day / urgent care consultation recommended.
     - **ESI 4 & 5 (Less Urgent / Non-urgent)**: Routine outpatient appointment scheduling.
   - Enforces prominent medical disclaimers and safety boundaries (no prescriptive medication advice or definitive diagnosis).

2. **Scheduling Agent**:
   - Matches triage output to appropriate medical specialty (e.g., Cardiology, Pulmonology, Orthopedics, Family Medicine).
   - Simulates FHIR-compliant scheduling (`Schedule`, `Slot`, `Appointment` mock models) or calendar integration.
   - Interactive calendar and time slot picker with doctor availability, visit type selection (In-Person vs. Telehealth), insurance verification check, and appointment confirmation.

3. **Doctor Summary Agent**:
   - Synthesizes patient conversation and triage signals into structured clinician documentation:
     - **SOAP Note**: Subjective (patient narrative, HPI), Objective (reported vitals, pain level), Assessment (triage acuity rating, differential considerations), and Plan (recommended diagnostic workup / clinic visit).
     - **SBAR Briefing**: Situation, Background, Assessment, Recommendation for rapid handoff.
   - Formatted for direct copy/export to EHR formats with human-in-the-loop clinician sign-off.

4. **Follow-Up Reminder Agent**:
   - Schedules automated check-ins (e.g., 24h, 48h, 7-day post-visit check-ins).
   - Simulates SMS/email notifications for medication adherence, symptom progression check, and red-flag re-evaluation.
   - Allows simulated patient response handling with escalation back to triage if symptoms worsen.

---

## 2. Deliverables & Dedicated Views (Aligned with Capstone Requirements)

Create a sleek, modern, healthcare-grade UI (using Tailwind CSS, Lucide icons, and shadcn component patterns) with a global navigation bar providing seamless switching between these 5 dedicated views:

### View 1: Patient Triage & Booking Experience (`/triage` or Home)
- Split-screen layout:
  - **Left / Center**: Interactive chat interface with pre-built clinical scenario quick-starters:
    1. *Cardiac Red-Flag (Chest Pain & Shortness of Breath)* $\to$ triggers emergency lockout.
    2. *Acute Musculoskeletal (Severe Sprain / Suspected Fracture)* $\to$ triggers Urgent ESI-3 booking.
    3. *Routine Chronic Follow-up (Hypertension Checkup)* $\to$ triggers Non-urgent ESI-5 booking.
    4. *Pediatric Fever with Rash* $\to$ triggers pediatric clinic priority triage.
  - **Right Panel (Live Agent Orchestration State)**:
    - Real-time visual progress stepper: `Intake` $\to$ `Triage Assessment` $\to$ `Specialty Match` $\to$ `Slot Selection` $\to$ `Confirmation`.
    - Active agent indicator showing which agent is processing context.
    - Live risk score, detected red flags, and confidence indicators.
  - Interactive appointment booking drawer/modal appearing seamlessly once triage authorizes scheduling.

### View 2: Clinician Review & SOAP Desk (`/doctor-portal`)
- Provider queue showing triaged patients awaiting review or incoming appointments.
- Detailed patient view displaying:
  - Auto-generated **SOAP Note** with inline editing capability for the physician.
  - **SBAR Handoff card** with one-click "Approve & Push to EHR".
  - Audio summary / dictation playback simulation.
  - Full audit trail of the patient-agent intake transcript with flagged clinical terms.

### View 3: Follow-Up & Care Coordination Center (`/follow-ups`)
- Timeline view of automated follow-up sequences across active patients.
- Simulated patient outreach channels (SMS, Email, Patient Portal Notification).
- Interactive escalation testing: click "Patient reports worsening symptoms" to see real-time alert dispatch to clinical staff.

### View 4: Enterprise Architecture & Security Blueprint (`/architecture`)
- Interactive, visual representation of the 5 capstone architecture pillars:
  1. **Layered System Topology**: Client DMZ, Agent Orchestration Gateway, PHI-Isolated Data Tier.
  2. **Agent State Machine & Handoffs**: Visual node-based workflow showing state transitions, guardrails, and failure fallbacks.
  3. **Security & Compliance Model**: HIPAA safeguards, encryption standards (TLS 1.3, AES-256), RBAC permission matrix (`Patient`, `Triage Nurse`, `Physician`, `EHR Admin`), and synthetic PII de-identification pipeline.
  4. **Deployment & Resilience Strategy**: Circuit breakers, dead-letter queues, zero-data-retention LLM endpoints, and multi-region failover.

### View 5: Live Monitoring & Telemetry Dashboard (`/monitoring`)
- Real-time observability dashboard tracking:
  - **Agent Performance**: P95 response times, token throughput, tool call success rates.
  - **Clinical Safety Metrics**: Red-flag escalation rate (%), human clinician override rate, safety filter trigger count.
  - **Operational Metrics**: Total triaged encounters, appointment conversion rate, average intake duration.
  - **Cost Telemetry**: Token cost breakdown per agent (Triage vs. Doctor Summary vs. Follow-up).
  - Trace inspector: expandable trace tree simulating OpenTelemetry spans for agent interactions.

---

## 3. UI/UX & Design Guidelines

- **Theme & Aesthetics**: Professional, trustworthy healthcare design system. Clean slate/neutral background, soft medical blue/cyan accents (`#0284c7`, `#0ea5e9`), clear badge color codings for triage severity:
  - ESI 1/2 (Emergency): Crimson / Red badge (`bg-rose-500/10 text-rose-600 border-rose-200`)
  - ESI 3 (Urgent): Amber / Yellow badge (`bg-amber-500/10 text-amber-600 border-amber-200`)
  - ESI 4/5 (Non-urgent): Emerald / Green badge (`bg-emerald-500/10 text-emerald-600 border-emerald-200`)
- **Safety First**: Persistent disclaimer banner: *"Prototype / Clinical Decision Support Demonstration Only — In medical emergencies, dial 911 immediately."*
- **Interactive Feedback**: Rich animations on agent state transitions, loading skeletons during agent generation, toast notifications on booking/SOAP approvals.
- **Sample Data**: Realistic pre-populated doctor schedules, mock patient records, and clinic rosters so the app feels fully operational out of the box.
