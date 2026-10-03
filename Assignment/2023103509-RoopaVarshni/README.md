# OfficeOps — AI Workplace Operations Assistant
**Enterprise Architectural Deployment of Agentic AI Solutions**

**Student Information:**
- **Name:** Roopa Varshni R
- **Roll Number:** 2023103509
- **Course:** Scalable Enterprise Architectural Deployments of Agentic AI Solutions

---

## 🏢 Overview

**OfficeOps** is an enterprise-grade AI workplace operations platform engineered to demonstrate scalable, multi-agent AI architecture for corporate facilities and service logistics. Rather than relying on rigid static forms or monolithic chatbots, OfficeOps coordinates four autonomous micro-agents through a deterministic orchestration pipeline:

1. **Requirement Agent**: Ingests unstructured conversational requests and extracts structured operational parameters.
2. **Resource Agent**: Queries enterprise workplace inventories against capacity and hardware criteria.
3. **Scheduling Agent**: Evaluates calendar availability and pinpoints temporal conflicts.
4. **Recommendation Agent**: Ranks optimal candidate resources using a weighted multi-criteria scoring model.

**Crucially, OfficeOps enforces strict Human-In-The-Loop (HITL) governance**: the AI never executes consequential actions (such as committing a room reservation or modifying resource states) without explicit human confirmation. Every operational step and decision is immutably recorded in the enterprise audit and telemetry ledger.

---

## 🌟 Key Features

- **Enterprise Dashboard**: Unified operational view displaying active room reservations, open workplace service requests (IT, Facilities, Maintenance), agent pipeline status, and pending approvals.
- **Conversational AI Assistant**: Intelligent workplace assistant with real-time multi-agent execution visualization, reasoning transparency, and candidate resource ranking.
- **Meeting Room Management**: Comprehensive inventory of enterprise spaces (**Room Alpha**, **Room Beta**, **Conference Hall**, **Innovation Room**) with live status badges and multi-attribute filters (Capacity, Projector, Video Conferencing, Availability).
- **Workplace Service Requests**: Multi-category ticketing system for IT Support, Maintenance, Visitor Management, Equipment Allocation, and Employee Onboarding.
- **Human-In-The-Loop (HITL) Approval Gate**: Dedicated proposal review stage preventing unauthorized autonomous modifications.
- **Real-Time Monitoring & Telemetry**: Observable metrics dashboard tracking agent executions, pipeline latency, success/failure rates, health statuses, and complete audit trail.
- **Role-Based Access Control (RBAC)**: Switchable enterprise personas for Employee, Operations Manager, and Administrator.

---

## 🏗️ Architecture

```
User / Employee
       ↓
Web Application (React 18 + TypeScript + Vite + Tailwind CSS)
       ↓
Application Layer / Facade (Input Sanitizer & RBAC)
       ↓
Agent Orchestration Layer (State Machine Pipeline)
       ├── 1. Requirement Agent (NLP Slot-Filling)
       ├── 2. Resource Agent (Inventory Query Engine)
       ├── 3. Scheduling Agent (Temporal Conflict Engine)
       └── 4. Recommendation Agent (Multi-Criteria Scorer)
       ↓
Human-In-The-Loop Approval Gate (Approve / Reject)
       ↓
Enterprise Stores (Reservations, Inventory, Audit Logs & Telemetry)
```

For full architectural diagrams, sequence flows, and production deployment topology, refer to [architecture.md](architecture.md).

---

## 🤖 Multi-Agent Workflow

```
[Employee Request]
       │
       ▼
1. Requirement Agent ──> Extracts { type, date, time, duration, capacity, equipment }
       │
       ▼
2. Resource Agent    ──> Scans enterprise inventory for spaces matching minimum requirements
       │
       ▼
3. Scheduling Agent  ──> Detects calendar collisions and flags room availability
       │
       ▼
4. Recommendation Agent ──> Computes composite scores: (Capacity Fit, Equipment Match, Availability)
       │
       ▼
[Human Approval Gate] ──> Explicit user review: [Approve Reservation] or [Reject]
       │
       ├─ [Approved] ──> Commits booking, updates room state, logs audit event
       └─ [Rejected] ──> Aborts transaction, logs reason, releases temporary hold
```

---

## 🛠️ Technology Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (TypeScript) | Reactive, component-based user interface |
| **Tooling & Bundler** | Vite 5 | Fast development server and optimized production build |
| **Styling** | Tailwind CSS 3 | Enterprise design system with Slate/Indigo corporate palette |
| **Icons** | Lucide React | Consistent enterprise iconography |
| **Agent Pipeline** | Modular TypeScript Engine | Deterministic micro-agent services |
| **Persistence** | In-Memory + LocalStorage | Session resilience across browser refreshes |

---

## 📦 Project Structure

```
Assignment/2023103509-RoopaVarshni/
├── prompt.md                # Reusable prompt for coding agents to recreate OfficeOps
├── architecture.md          # Comprehensive enterprise architecture documentation
├── README.md                # Project documentation and quickstart guide
├── screenshots/             # Application screenshots and demo evidence
└── OfficeOps/               # Complete source code of the application
    ├── index.html           # HTML entry point
    ├── package.json         # Dependencies and build scripts
    ├── tsconfig.json        # TypeScript configuration
    ├── vite.config.ts       # Vite configuration
    ├── tailwind.config.js   # Tailwind design tokens
    ├── postcss.config.js    # PostCSS plugins
    ├── .env.example         # Environment variable template
    └── src/
        ├── main.tsx         # Application root mount
        ├── App.tsx          # Root routing and global layout
        ├── index.css        # Tailwind directives and custom scrollbars
        ├── types/           # Strong TypeScript interfaces
        ├── data/            # Pre-seeded enterprise rooms, tickets, and logs
        ├── services/        # Storage, Audit, Telemetry, and Orchestrator services
        ├── agents/          # Specialized micro-agents (Requirement, Resource, Scheduling, Recommendation)
        ├── components/      # Modular UI components (Sidebar, Navbar, Badges, Modals, Toasts)
        └── pages/           # Views: Login, Dashboard, Assistant, MeetingRooms, Requests, Monitoring
```

---

## 🚀 How to Install & Run Locally

### Prerequisites
- Node.js (v18.0.0 or higher recommended, tested on v22.16.0)
- npm (v9.0.0 or higher)

### Steps

1. **Navigate to the OfficeOps directory**:
   ```bash
   cd "Assignment/2023103509-RoopaVarshni/OfficeOps"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:5173`.

5. **Build for production**:
   ```bash
   npm run build
   ```
   The production-ready static assets will be compiled into the `dist/` directory.

---

## 🎯 Demo Scenarios

The AI Assistant includes one-click demo scenario chips to test key agent behaviors:

### Scenario 1: Standard Fit
- **Input:** *"I need a meeting room for 12 people tomorrow at 3 PM with a projector."*
- **Outcome:**
  - Requirement Agent parses: 12 attendees, tomorrow, 15:00, Projector.
  - Resource Agent finds candidates with capacity $\ge 12$.
  - Scheduling Agent verifies availability.
  - Recommendation Agent scores **Room Alpha** highest (Capacity 15, projector equipped, 100% match).
  - System presents proposal and awaits **explicit human approval**.

### Scenario 2: Exceeds Facility Capacity
- **Input:** *"I need a room for 50 people."*
- **Outcome:**
  - Resource Agent detects that maximum facility capacity is 30 (Conference Hall).
  - System emits an informative constraint notice: *"No suitable room found. Maximum capacity in the facility is 30 people."*

### Scenario 3: Optimal Fit & Alternatives
- **Input:** *"I need a room for 5 people with a projector."*
- **Outcome:**
  - Recommends **Room Beta** (capacity 8) to optimize space utilization.
  - Offers **Room Alpha** (capacity 15) and **Innovation Room** as secondary alternatives.

### Scenario 4: Schedule Conflict Detection
- **Input:** *"I need Conference Hall tomorrow at 3 PM."*
- **Outcome:**
  - Scheduling Agent detects an existing booking on Conference Hall at 3 PM.
  - Flags the conflict and recommends alternative rooms (**Room Alpha** or **Innovation Room**) or adjacent available time slots.

---

## 🔒 Security Model

- **Authentication & RBAC**: Provides three test accounts:
  - **Employee**: Can book rooms, view available spaces, and submit requests.
  - **Operations Manager**: Can manage inventory statuses, resolve requests, and inspect audit logs.
  - **System Admin**: Can view telemetry, audit logs, and trigger system data resets.
- **Input Sanitization**: User inputs are sanitized to protect against XSS and control character injection.
- **Strict HITL Gate**: Consequential reservation actions cannot be committed by the agent alone.
- **Immutable Audit Trail**: All pipeline actions, decisions, actor IDs, and timestamps are committed to the audit store.
- **Zero Secrets Committed**: Environment configuration follows the `.env.example` standard.

---

## 🌐 Deployment

### Deployed Application URL
- **Production URL**: `https://officeops-mvp.vercel.app` *(Placeholder for deployment)*

### Manual Deployment Instructions

#### Deploy to Vercel
```bash
npm install -g vercel
cd "Assignment/2023103509-RoopaVarshni/OfficeOps"
vercel --prod
```

#### Deploy via Docker
A containerized deployment can be launched using the following multi-stage build:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## ⚠️ Limitations & Future Enhancements

### Current Limitations (MVP Scope)
- Agents use deterministic slot-filling and multi-factor rule-based scoring engines rather than live external LLM API keys to guarantee 100% offline reproducibility without API rate-limit failures.
- Data persistence is maintained in browser memory and `localStorage` rather than a cloud-hosted PostgreSQL database.
- Telemetry includes baseline enterprise simulation metrics alongside real in-session pipeline metrics (clearly labeled as `[SIMULATED DEMO TELEMETRY]`).

### Future Enhancements
- Integration with Google Workspace and Microsoft 365 Outlook Calendar APIs via OAuth2.
- LLM Gateway integration supporting streaming reasoning tokens from Gemini 1.5 Pro / Claude 3.5 Sonnet.
- Slack / Microsoft Teams bot adapter for direct chat-based HITL approvals.
- IoT occupancy sensor integration for automated real-time no-show room releases.
