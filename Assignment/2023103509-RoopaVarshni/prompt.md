# OFFICEOPS — AI Workplace Operations Assistant
## Enterprise Coding Agent Reusable Specification Prompt

This prompt serves as a complete, deterministic, and reproducible blueprint to instruct an AI coding agent to implement the **OfficeOps — AI Workplace Operations Assistant** enterprise MVP application from scratch.

---

### 1. Problem Statement
In modern enterprise environments, managing workplace operations (conference room reservations, IT equipment requests, facility maintenance, visitor check-in, and employee onboarding logistics) is fragmented across disparate portals and manual email chains. Employees spend unproductive hours navigating room availability, equipment compatibility, and scheduling conflicts. While automated solutions exist, fully autonomous AI systems risk uncoordinated resource locking, hallucinated reservations, or policy violations. Enterprises require an intelligent, agentic workflow that pairs autonomous multi-agent analysis with strict **Human-In-The-Loop (HITL)** governance, comprehensive audit logging, and observable telemetry.

---

### 2. Application Goal
Build **OfficeOps**, a high-fidelity enterprise-grade SaaS Web Application MVP demonstrating a scalable, multi-agent AI architecture for workplace operations. The application orchestrates four specialized agents to ingest natural language workplace requests, extract structured specifications, match resources, detect calendar conflicts, and present ranked recommendations with transparent reasoning—requiring explicit human confirmation before committing any reservation or service change.

---

### 3. Target Users & Personas
1. **Employee (Requester)**: Submits conversational requests for meeting spaces, equipment, and facility support. Reviews agent recommendations and approves/rejects proposed bookings.
2. **Operations Manager**: Oversees workplace resource utilization, reviews pending escalations, monitors room occupancies, and reviews agent decisions.
3. **Enterprise Administrator / IT SecOps**: Audits system compliance, inspects agent execution health and latency telemetry, reviews immutable audit logs, and oversees role-based access control.

---

### 4. Required Pages & UI Navigation
1. **Login Page (`/login`)**:
   - Enterprise authentication interface with demo SSO account switchers:
     - `employee@officeops.enterprise.internal` (Employee role)
     - `ops.manager@officeops.enterprise.internal` (Operations Manager role)
     - `admin@officeops.enterprise.internal` (System Admin role)
   - Visual disclaimer clearly stating mock/demo enterprise authentication.
2. **Dashboard (`/dashboard`)**:
   - Personalized welcome banner with active role badge.
   - High-level KPI cards: Active Reservations, Open Workplace Requests, Pending Approvals, Agent System Health.
   - Pending Human Approval action cards with quick-approve/reject buttons.
   - Active Reservations table and Open Service Tickets preview.
   - Agent execution activity summary.
   - Prominent "Ask OfficeOps AI" action card guiding users to the conversational assistant.
3. **AI Assistant (`/assistant`) — [PRIMARY FEATURE]**:
   - Interactive conversational pane supporting natural language inputs and one-click demo scenario chips.
   - Step-by-step visual execution pipeline showing live agent states:
     - Step 1: Input ingestion & security validation
     - Step 2: Requirement Agent (structured parameter extraction JSON)
     - Step 3: Resource Agent (inventory matching against workplace resources)
     - Step 4: Scheduling Agent (calendar conflict detection & timeslot validation)
     - Step 5: Recommendation Agent (multi-criteria scoring & transparent justification)
     - Step 6: Human Approval Gate (Approve / Reject buttons with resource comparison)
     - Step 7: Confirmation & Audit Commitment (creates reservation, logs event, updates telemetry)
4. **Meeting Rooms (`/rooms`)**:
   - Grid and table view of meeting room resources with live availability indicators.
   - Pre-seeded rooms:
     - **Room Alpha** (Capacity: 15, Projector: Yes, Video Conferencing: Yes, Whiteboard: Yes, Status: Available)
     - **Room Beta** (Capacity: 8, Projector: Yes, Video Conferencing: Yes, Whiteboard: No, Status: Available)
     - **Conference Hall** (Capacity: 30, Projector: Yes, Video Conferencing: Yes, Whiteboard: Yes, Status: Occupied)
     - **Innovation Room** (Capacity: 20, Projector: Yes, Video Conferencing: No, Whiteboard: Yes, Status: Available)
   - Real-time filters: Capacity slider/range, Projector toggle, Video Conferencing toggle, Availability toggle.
   - Resource details modal showing equipment specifications and schedule.
5. **Workplace Requests (`/requests`)**:
   - Unified workplace ticket management table supporting:
     - Request Types: IT Support, Maintenance, Visitor Management, Equipment Request, Employee Onboarding.
     - Attributes: Request ID (`REQ-XXXX`), Request Type, Requester, Status (Pending, In Progress, Approved, Resolved, Rejected), Priority (Low, Medium, High, Urgent), Created Time.
   - "Create Request" modal allowing manual or agent-assisted ticket filing.
   - Role-gated actions (Approve, Resolve, Cancel).
6. **Monitoring & Telemetry (`/monitoring`)**:
   - Executive telemetry dashboard with clear `[SIMULATED DEMO TELEMETRY]` banner.
   - Metric cards: Total Workplace Requests, Agent Pipeline Executions, Success Rate (%), Average Agent Latency (ms), Pending Approvals, Total Confirmed Reservations, Blocked/Failed Executions.
   - Agent Status Matrix for all 4 agents: Health (Healthy/Degraded), State (Idle/Running/Completed/Failed), Executions Count, Latency, Error Rate.
   - Multi-Agent Latency and Utilization distribution charts.
   - Live immutable Audit Log viewer displaying: Timestamp, Event Type, Actor, Target Resource, Decision, Agent Pipeline Run ID, and State Details.
   - Actions to download audit log JSON and reset demo data to initial baseline.

---

### 5. Multi-Agent Architecture & Responsibilities
The system implements a four-stage sequential agent orchestration pipeline:

```
[Employee Request]
       │
       ▼
1. Requirement Agent ──> Extracts { type, date, time, duration, capacity, equipment, constraints }
       │
       ▼
2. Resource Agent    ──> Searches resource inventory & filters matching capacity/equipment
       │
       ▼
3. Scheduling Agent  ──> Verifies calendar slots, identifies bookings & flags temporal conflicts
       │
       ▼
4. Recommendation Agent ──> Computes composite scores (Capacity Fit, Equipment Match, Availability)
       │
       ▼
[Human Approval Gate] ──> User reviews ranking, justification & clicks Approve or Reject
       │
       ├─ [Approved] ──> Commits Reservation, Dispatches Notifications, Writes Audit Event
       └─ [Rejected] ──> Releases Temporary Hold, Logs Decision Reason, Suggests Alternatives
```

#### Agent Specifications:
1. **Requirement Agent**:
   - Ingests freeform English input (e.g., *"I need a meeting room for 12 people tomorrow at 3 PM with a projector"*).
   - Regex/Deterministic parser extracting:
     ```json
     {
       "intent": "ROOM_RESERVATION",
       "capacityNeeded": 12,
       "date": "2026-10-04",
       "time": "15:00",
       "durationHours": 1,
       "requiredEquipment": ["projector"],
       "constraints": []
     }
     ```
2. **Resource Agent**:
   - Scans workplace inventory for rooms matching minimum capacity and equipment.
   - Evaluates capability parity (e.g., handles requests exceeding maximum enterprise capacity).
3. **Scheduling Agent**:
   - Queries reservation registry for targeted date/time window.
   - Detects collision with existing bookings (e.g., Conference Hall booked tomorrow at 15:00).
   - Flags conflict status and suggests adjacent unreserved windows.
4. **Recommendation Agent**:
   - Applies transparent scoring formula:
     $$\text{Score} = w_{\text{cap}} \cdot S_{\text{capacity}} + w_{\text{eq}} \cdot S_{\text{equipment}} + w_{\text{avail}} \cdot S_{\text{availability}}$$
   - Penalizes oversized spaces (waste of capacity) and penalizes conflicts.
   - Produces top recommended room, ranked alternatives, and human-readable explanation.

---

### 6. Human-In-The-Loop (HITL) Governance
- **Zero Autonomous Consequential Actions**: The system is architecturally prohibited from making an irreversible booking or resource state mutation directly from an agent recommendation.
- **Explicit Approval Trigger**: The user must explicitly press **"Approve Reservation"** or **"Reject"**.
- **Audit Traceability**: Approval/rejection metadata (User ID, Role, Timestamp, Agent Run ID, Chosen Room) is committed to the audit ledger.

---

### 7. Demo Scenarios to Validate
1. **Scenario 1 (Standard Fit)**:
   - Input: *"I need a meeting room for 12 people tomorrow at 3 PM with a projector."*
   - Outcome: Identifies **Room Alpha** (Capacity 15, has projector, available). Presents recommendation card and asks for approval.
2. **Scenario 2 (Exceeds Capacity)**:
   - Input: *"I need a room for 50 people."*
   - Outcome: Identifies that the maximum available room is Conference Hall (capacity 30). Returns clear failure explanation: *"No suitable room found. Maximum room capacity in the facility is 30 people."*
3. **Scenario 3 (Optimal Fit & Alternatives)**:
   - Input: *"I need a room for 5 people with a projector."*
   - Outcome: Recommends **Room Beta** (capacity 8, best capacity efficiency) and offers **Room Alpha** (capacity 15) and **Innovation Room** as secondary alternatives.
4. **Scenario 4 (Conflict Detection)**:
   - Input: *"I need Conference Hall tomorrow at 3 PM."*
   - Outcome: Detects that Conference Hall is already occupied at 3 PM tomorrow. Recommends alternative available spaces (Room Alpha or Innovation Room) and suggests alternative time slots.

---

### 8. Data Model & Storage Schema
- Implement clean TypeScript interfaces:
  - `User`: `{ id, name, email, role, avatar }`
  - `Room`: `{ id, name, capacity, equipment: { projector, videoConferencing, whiteboard }, status, floor, image }`
  - `Reservation`: `{ id, roomId, roomName, requesterName, requesterEmail, date, time, durationHours, attendeeCount, purpose, status, createdAt, agentRunId }`
  - `WorkplaceRequest`: `{ id, type, requester, department, priority, status, description, createdAt, resolvedAt }`
  - `AgentStepLog`: `{ agentName, status, input, output, durationMs, timestamp }`
  - `AuditEvent`: `{ id, timestamp, actor, action, targetResource, details, agentRunId, status }`
  - `TelemetryMetrics`: `{ totalRequests, agentExecutions, successCount, failureCount, avgResponseTimeMs, pendingApprovals, totalReservations }`
- Persistence: Reactive in-memory state with synchronous `localStorage` fallback to persist sessions and actions across page refreshes.

---

### 9. Security & Governance Guidelines
- Input sanitization against script injection and prompt manipulation patterns.
- Role-Based Access Control (RBAC): Employee can create requests and reserve; Operations Manager can manage room statuses and approve high-priority tickets; Admin has access to full audit log export and reset functions.
- Strict isolation between Agent Recommendation Phase (read-only) and Action Dispatch Phase (write transaction requiring human token).
- Zero secrets committed to source; use environment variable placeholders (`.env.example`).

---

### 10. Technology Stack & Build Requirements
- **Framework**: React 18+ with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS with modern enterprise slate palette
- **Icons**: Lucide React
- **Build verification**: `npm run build` must compile cleanly without TypeScript or bundler errors. Zero third-party backend blockers for instant deployment on Vercel, Netlify, or Docker.
