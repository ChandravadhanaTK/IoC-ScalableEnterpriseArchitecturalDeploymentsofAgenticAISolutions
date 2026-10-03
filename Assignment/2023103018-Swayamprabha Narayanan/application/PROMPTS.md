# MediFlow AI — Prompts & Specifications Log

This document records the prompt specifications used to engineer the **MediFlow AI** hospital operations platform for Northstar Medical Center.

---

## 1. Primary Specification Prompt

> **Project Brief**: Build a polished enterprise SaaS web application called **"MediFlow AI"**.
> 
> MediFlow AI is a fictional hospital OPERATIONS management platform. It uses an AI operations assistant to classify operational requests, prioritize them, recommend departments, and suggest workflow actions.
> 
> ### Guardrails & Constraints
> - Use mock/demo data only (fictional facility: "Northstar Medical Center").
> - Do not implement medical diagnosis or clinical treatment.
> - Do not use real patient or PHI data.
> - Do not use hardcoded production secrets or API keys.
> 
> ### Design System Guidelines
> - **Theme**: Deep navy (`#0B132B`, `#1C2541`), slate blue, and medical teal accents.
> - **Layout**: Enterprise sidebar navigation with top operational app bar.
> - **Components**: Rounded cards (`border-slate-800`), status badges, charts, data tables with pagination/filters, and confirmation dialogs.
> - **Typography**: Clean, high-density sans-serif hierarchy for operations teams.

---

## 2. Page & Functional Specifications

### Page 1: Operations Dashboard (`/`)
- **Key Metrics (8 KPIs)**: Active requests, New requests, In-progress, Resolved, High-priority count, Avg response time, SLA compliance rate, and AI triage success rate.
- **Visualizations**: 7-day request volume trend line, departmental distribution donut/bar, and priority breakdown.
- **Operational Feeds**: Recent requests data table and live AI Operations Briefing summary card.

### Page 2: Request Management (`/requests`)
- **Interactive Table**: Request ID, Title, Category, Priority (P1–P4), Department, Status, Assigned Team, Timestamp, SLA target.
- **Taxonomy**:
  - *Categories*: Facilities, IT, Housekeeping, Equipment Maintenance, Security, Transportation, Administration, Patient Services.
  - *Statuses*: New, AI Analyzing, Awaiting Approval, Assigned, In Progress, Escalated, Resolved, Closed.
- **Interactions**: Full-text search, multi-filter dropdowns, column sorting, detail drawer with manual triage, status transitions, and escalation confirmation dialogs.

### Page 3: New Operational Request (`/new-request`)
- **Form Controls**: Request Title, Description, Department, Location/Room, Category, Priority, Preferred Completion Window, and Additional Context.
- **Real-Time AI Suggestion**: Dynamic category and priority recommendation generated as the user inputs description text.
- **Submission Lifecycle**: Synthetic ID generation (`REQ-2026-XXXX`), toast confirmation, and reactive insertion into the shared store.

### Page 4: AI Triage & Orchestration Engine (`/triage`)
- **10-Stage Pipeline Visualization**:
  $$\text{Request} \rightarrow \text{Validation} \rightarrow \text{Classification} \rightarrow \text{Priority} \rightarrow \text{Routing} \rightarrow \text{SLA Analysis} \rightarrow \text{Recommendation} \rightarrow \text{Human Approval} \rightarrow \text{Resolution} \rightarrow \text{Audit}$$
- **AI Decision Card**: Classification label, priority score, target department, recommended action playbook, SLA risk index, model confidence percentage, and Human Approval gate.
- **Human-in-the-Loop Gateway**: Accept with confirmation or override routing with justification.

### Page 5: Department Workload & Capacity (`/departments`)
- **7 Operational Departments**: Facilities, IT Systems, Environmental Services (Housekeeping), Hospital Security, Biomedical Equipment Maintenance, Patient Services, and Hospital Administration.
- **Department Metrics**: Open volume, critical backlog, avg resolution time, SLA adherence percentage, staff allocation capacity gauge, and workload comparison chart.

### Page 6: Agent Telemetry & System Monitoring (`/monitoring`)
- **Observability KPIs (9 Metrics)**: Agent operational status, total analyzed, recommendations dispatched, human approvals recorded, model response latency, API p99 latency, error rate, SLA compliance, and uptime.
- **Diagnostics**: Real-time throughput graph, latency history, audit timeline, and an interactive "Simulate Outage" switch verifying fault-tolerant fallback UI.

### Page 7: Governance, Security & Settings (`/security`)
- **Role-Based Access Control (RBAC)**: Matrix for Operations Staff, Department Manager, Hospital Administrator, and System Administrator.
- **Security Controls**: Active session manager with revocation prompts, immutable audit log viewer, data encryption at rest/transit disclosures, and role switching for demo validation.
- **Settings**: Profile configuration, alert thresholds, AI automation confidence gates, and appearance controls.
