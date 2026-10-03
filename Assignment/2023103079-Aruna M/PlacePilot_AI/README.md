# Placement Compass

Build PlacePilot AI — an enterprise-grade agentic AI personal placement intelligence and preparation platform for college students.

Core requirements:
1. Five Academic Course Deliverables (highest priority, fully implemented and demonstrable):
   - Architecture Diagram (/architecture): 7 layers (User Layer, Experience Layer, AI Orchestration Layer, Agent Layer with 6 workflow agents, Application Services, Data Layer with PostgreSQL/RLS, External Integrations), interactive component inspection, trust boundaries, and animated data flows.
   - Agent Workflow Design (/architecture/agents): 6 workflow agents (Notification Extraction, Eligibility Analysis, Recruitment Timeline, Resume Matching, Preparation Planner, Reminder & Alert) plus Monitoring & Observability cross-cutting layer. States (IDLE, PROCESSING, VALIDATING, AWAITING_APPROVAL, COMPLETED, FAILED, FALLBACK), tool JSON schemas, handoffs, human-in-the-loop review, retries, and failure circuits.
   - Deployment Strategy (/architecture/deployment): 4-stage pipeline (Development → Testing/Staging → Preview Deployment → Production), CI/CD, zero-downtime, edge caching, serverless elasticity, health check probes (/healthz and /readyz), environment separation, and secrets management.
   - Security Model (/architecture/security): 3 roles (Student, Placement Coordinator, Auditor), RLS data isolation, resume PII anonymization before LLM ingestion, prompt injection guardrail simulator, tamper-evident audit logging, and trust boundaries.
   - Monitoring Dashboard (/monitoring & /monitoring/traces): 6 mandatory categories (Health, Trace, Quality, Safety, Cost/Usage, Business Outcomes), deep trace inspector with parent/child spans, latency, token estimates, and clearly labeled demo metrics.

2. Dual Execution Engine:
   - Real AI Execution Mode (via Lovable AI edge functions)
   - Deterministic Demo/Fallback Engine (100% offline & classroom presentation resilience)
   - Clear UI execution badges on all cards and traces: [Real AI Execution] vs [Deterministic Demo Engine].

3. Regional Indian Engineering Campus Placement Context:
   - B.E./B.Tech/MCA, branches (CSE, ECE, EEE, IT, AI/DS, etc.), 10-point CGPA, 10th/12th percentages, active/cleared backlogs, CTC in LPA, internship stipend, PPT, OA, Technical, HR rounds, bond and probation details.
   - Missing fields must display "Not specified" (never invent dates or criteria). Tentative dates preserve tentative status.

4. Primary Demo Opportunity:
   - PTUM Full Stack Engineer (₹18 Lakhs UG/PG, 2027 batch, branches CSE/EEE/ECE/IT/AI&DS/MCA, Registration: 30 Sep 2026 2:30 PM to 1 Oct 2026 2:30 PM, Online Assessment: 8 October 2026 1:00 PM, Pre-Placement Talk: 15 October 2026 9:00 AM, Technical & HR Rounds: Post-OA shortlist without invented dates).

5. Configurable Demo Student Profile:
   - Indian B.Tech Computer Science student demo profile with editable academic credentials.

6. End-to-End Workflow & Ingestion:
   - Notification ingestion (/opportunities/new) with raw paste, sample selectors, live agent stepper, human review checkpoint, eligibility assessment, recruitment timeline, resume gap analysis (suppress percentage when role specs are insufficient), company study planner, and 24h/1h reminders.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/07a7b224-e91c-4d52-a1f1-26398075ec9c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
