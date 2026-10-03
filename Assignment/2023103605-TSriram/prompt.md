# AssetCareHQ — Lovable Build Prompt
Build a polished, working enterprise web application called **AssetCareHQ**.
**Subtitle:** Intelligent IT Asset Lifecycle & Operations Platform
Purpose: demonstrate enterprise agentic AI architecture through a deterministic simulation.
Do NOT use a real LLM/API. Do NOT expose chain-of-thought. Show concise agent events, tools, decisions and results.
Prioritize working functionality, simplicity, cohesive architecture and demo readiness.

## 1. Stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Lucide React + Recharts
- Prefer Lovable Cloud/Supabase for Auth, PostgreSQL and RLS; otherwise use localStorage behind a clean service layer.
- Avoid unnecessary dependencies.

## 2. Roles
**Employee:** dashboard, assets, requests, assigned assets.
**Manager:** Employee features + approve/reject requests and transfers.
**Asset Admin:** full access, asset/user/request/approval management, assign/return/transfer, lifecycle, monitoring, agent operations, audit, demo/reset.

## 3. Authentication
Use email/password authentication and protected routes.
Demo accounts:
- `employee@assetcarehq.demo` / `Demo@1234`
- `manager@assetcarehq.demo` / `Demo@1234`
- `admin@assetcarehq.demo` / `Demo@1234`
Show: "Demo Environment — Agent decisions are simulated."
Unauthenticated users → `/login`; successful login → `/app`; logout/session persistence must work.

## 4. Design
Modern enterprise SaaS, desktop-first and responsive.
Colors: background `#F7F9FC`, sidebar `#0F172A`, primary `#2563EB`, success `#16A34A`, warning `#D97706`, danger `#DC2626`, info `#0891B2`, cards `#FFFFFF`, border `#E5E7EB`, text `#111827`, muted `#6B7280`.
Use rounded cards, subtle shadows, clean tables, status badges, consistent spacing and light transitions.
Avoid excessive gradients, glassmorphism, generic AI imagery, chatbot-heavy UI and unnecessary animation.

## 5. Layout and Navigation
Use a left sidebar, top header and main content area.
Brand: **AssetCareHQ** / **IT Asset Operations**.
Navigation: Overview, Asset Inventory, Request Asset, My Requests, Approvals, Agent Operations, Lifecycle Intelligence, Transfers, Offboarding, Monitoring, Audit Log.
Header: search, notifications, role badge, user menu, logout.
Hide or restrict unauthorized navigation items. Use a collapsible sidebar on smaller screens.

## 6. Routes
Public: `/login`
Protected:
`/app`, `/app/assets`, `/app/assets/:assetId`, `/app/request`, `/app/requests`, `/app/requests/:requestId`, `/app/agent-workflow/:requestId`, `/app/approvals`, `/app/agent-operations`, `/app/lifecycle`, `/app/transfers`, `/app/offboarding`, `/app/monitoring`, `/app/audit`, `/app/admin`

## 7. Dashboard — `/app`
Title: **Asset Operations Center**
Show KPI cards for:
- Total Assets, Available, Assigned, In Repair, Replacement Recommended
- Open Requests, Pending Approvals, Auto Approved, Rejected
Show agent health:
- Orchestrator
- Policy
- Inventory
- Risk
- Lifecycle
- Assignment
Use Recharts for assets by status, requests by status/risk and asset health.
Show recent events such as `REQ-1024 approved automatically`, `LT-1042 assigned`, `REQ-1025 requires approval`, `LT-0911 replacement recommended`.
Employees see their own summary; Managers also see relevant team requests.

## 8. Asset Inventory — `/app/assets`
Create searchable/filterable table with: Asset Tag, Type, Brand, Model, Status, Assigned To, Department, Location, Health, Warranty, Replacement Score, Actions.
Statuses: `AVAILABLE`, `RESERVED`, `ASSIGNED`, `IN_USE`, `REPAIR`, `RETIRED`.
Filters: search, type, status, department, location, health, warranty, replacement recommendation.
Actions: View, Edit, Assign, Transfer, Return.
Asset details show basic information, ownership, lifecycle, health, repairs, replacement score and history timeline.

## 9. Request Asset — `/app/request`
Create a request form with: Asset Type, Purpose, Department, Required Duration, Minimum RAM, Minimum Storage, CPU Requirement, Preferred Location, Business Justification.
Asset types: Laptop, Desktop, Monitor, Phone, Tablet, Headset, Dock, Keyboard, Mouse.
Purposes: Software Development, Data Analysis, General Office Work, Design, Management, Remote Work, Temporary Project.
Primary action: **Analyze & Submit Request**.
Submission creates the request and starts the simulated agent workflow.

## 10. Simulated Agents
Implement six deterministic software agents:
1. **Orchestrator Agent** — coordinates workflow and state.
2. **Policy Agent** — checks policy compliance.
3. **Inventory Agent** — finds and ranks compatible assets.
4. **Risk Agent** — determines LOW/MEDIUM/HIGH risk.
5. **Lifecycle Agent** — analyzes health and replacement score.
6. **Assignment Agent** — assigns approved assets and updates state.
Do not claim these are real LLM agents.

## 11. Simulated Tools
Create simple service/tool functions:
- Asset Search Tool
- Asset Details Tool
- Policy Check Tool
- Risk Evaluation Tool
- Asset Assignment Tool
- Asset Transfer Tool
- Asset Return Tool
- Lifecycle Analysis Tool
- Audit Logging Tool
Agents should invoke tools instead of containing all operations directly.

## 12. Core Workflow
Every request:
```text
REQUEST → TRIAGE → POLICY → INVENTORY → RISK → APPROVAL DECISION → ASSIGNMENT → AUDIT → COMPLETED
```
States:
`RECEIVED`, `ANALYZING`, `POLICY_CHECK`, `INVENTORY_MATCHING`, `RISK_EVALUATION`, `APPROVAL_REQUIRED`, `APPROVED`, `REJECTED`, `ASSIGNING`, `COMPLETED`, `FAILED`
Persist and display the current state.

## 13. Agent Workflow Page — `/app/agent-workflow/:requestId`
Make this a major demo page.
Show Request ID, Requester, Asset Type, Purpose, Risk and Current Status.
Show visual stepper: `Request → Triage → Policy → Inventory → Risk → Approval → Assignment → Completed`
Each stage shows Agent, Status, Tool, Timestamp, Duration and concise Result.
Examples:
- Policy Agent → `Standard laptop policy matched`
- Inventory Agent → `3 compatible assets found`
- Risk Agent → `LOW risk — auto approval allowed`
Never display hidden reasoning.

## 14. Inventory Matching
Eligibility: `AVAILABLE`, correct type, minimum RAM met, minimum storage met, not retired and not under repair.
Recommendation weights: RAM 30%, Storage 20%, CPU 25%, Age 15%, Location 10%.
Formula: `Score = RAM*0.30 + Storage*0.20 + CPU*0.25 + Age*0.15 + Location*0.10`.
Show top 3 matching assets with score and reasons. Example: `LT-1042 — Match 94%`.
This is deterministic scoring, not ML.

## 15. Risk and Approval
Exactly three levels: LOW, MEDIUM, HIGH.
**LOW:** policy compliant + standard request + value < ₹50,000 → **Auto Approve**
**MEDIUM:** value >= ₹50,000 or above-standard requirement → **Manager Approval**
**HIGH:** policy violation, restricted request or high-value special request → **Manager + Asset Admin Review**
Do not create a Security Admin role.

## 16. Approval Center — `/app/approvals`
Tabs: Pending, Approved, Rejected.
Table: Request ID, Requester, Asset, Value, Risk, Reason, Requested At, Action.
Actions: Approve, Reject, View Workflow.
Update request, approval, workflow, assignment when applicable and audit log.
Employees cannot approve; Managers handle applicable approvals; Asset Admin can handle all.

## 17. Auto Approval and Assignment
LOW-risk requests skip approval.
```text
LOW → POLICY COMPLIANT → AUTO APPROVAL → ASSIGNMENT → COMPLETED
```
Show `Auto-approved by policy`.
After approval: `AVAILABLE → ASSIGNED → IN_USE`.
Persist assigned user, date, request ID, asset status and request status.
Create an audit event for assignment.

## 18. My Requests — `/app/requests`
Show logged-in user's requests.
Columns: Request ID, Asset Type, Purpose, Risk, Status, Recommended Asset, Submitted Date.
Statuses: Processing, Pending Approval, Approved, Rejected, Completed.
Open request details/workflow on click.

## 19. Lifecycle Intelligence — `/app/lifecycle`
Show Healthy, Monitor, Replacement Recommended and In Repair.
Replacement score 0–100:
- Age 25 points
- Warranty 20
- Repair Count 20
- Health 20
- Performance 15
Classification:
- 0–39 Healthy
- 40–69 Monitor
- 70–100 Replacement Recommended
Example: `LT-0911: age 4.7y, warranty expired, repairs 5, health 52, score 84`.
Show recommendation clearly.

## 20. Recurring Repairs
Rule: `Same asset + same issue >= 3 times = Recurring Issue`.
Example: `LT-0911 — Battery Failure — 3 occurrences`.
Show recommendation: `Consider replacement instead of additional repair.`

## 21. Transfers — `/app/transfers`
Fields: Current Employee, Asset, New Employee, Reason.
Initial status: `PENDING_MANAGER_APPROVAL`.
Manager can Approve/Reject.
On approval: update asset assignment, create transfer record and audit event.
Keep logic simple.

## 22. Offboarding — `/app/offboarding`
Asset Admin selects an employee and sees assigned assets.
Flow:
```text
ASSIGNED → RETURN INITIATED → INSPECTION → AVAILABLE / REPAIR / RETIRED
```
Allow Admin to choose final condition. No HR integration required.

## 23. Agent Operations — `/app/agent-operations`
Event table: Timestamp, Request ID, Agent, Tool, Status, Duration, Result.
Example:
```text
10:42  Policy Agent       Policy Check       SUCCESS
10:43  Inventory Agent   Asset Search        SUCCESS
10:44  Risk Agent        Risk Evaluation     SUCCESS
10:45  Assignment Agent  Asset Assignment    SUCCESS
```
Filters: Agent, Status, Request, Date.
This is an audit/event trace, not chain-of-thought.

## 24. Monitoring — `/app/monitoring`
Show Agent Health: Agent, Status, Runs, Success Rate.
Show Workflow Metrics: Total, Completed, Pending Approval, Rejected, Failed.
Show Processing: Average Duration, Auto Approval Rate, Human Approval Rate, Assignment Completion Rate.
Show Business Outcomes: Assets Assigned, Assets Recovered, Replacement Candidates, Auto Approved, Average Processing Time.
Show Simulated AI Usage: Agent Runs, Simulated Tokens, Simulated AI Cost.
Label clearly: **Simulated metrics for demonstration.** Do not present these as real LLM billing.

## 25. Audit Log — `/app/audit`
Filterable table: Timestamp, Actor, Role, Agent, Action, Resource, Resource ID, Status, Details.
Record request creation, policy/risk decisions, approvals/rejections, assignment, transfer, return and lifecycle recommendations.
Normal users cannot edit audit records.

## 26. Admin — `/app/admin`
Asset Admin only.
User table: Name, Email, Role, Department, Assigned Assets, Status.
Allow basic role management. Do not build complex IAM.

## 27. Demo Scenarios
Add a small **Demo Scenarios** panel for Asset Admin.
1. **Standard Developer Laptop** → LOW → Auto Approve → Assign
2. **High Value Workstation** → MEDIUM → Manager Approval → Assign
3. **Restricted Request** → HIGH → Review → Reject
4. **Old Laptop** → High Replacement Score → Replacement Recommended
Include **Reset Demo Data** to restore presentation-ready workflow data.

## 28. Seed Data
Create realistic fictional data.
Users: 10–15 across Engineering, Finance, HR, Operations and Marketing.
Include Employees, Managers and one Asset Admin.
Assets: 30+ including laptops, desktops, monitors, phones, tablets, headsets, docks, keyboards and mice.
Statuses must include AVAILABLE, ASSIGNED, IN_USE, REPAIR and RETIRED.
Include assets with expired warranties, multiple repairs, low health and high replacement scores.
Seed several requests, 2–3 pending approvals, completed workflows, repairs, agent events, audit events, replacement candidates and at least one recurring repair.
Dashboard must look populated immediately.

## 29. Data Model
Use these main tables with appropriate foreign keys and timestamps:
- `profiles`: user identity, role, department, location, manager
- `assets`: tag, type, model, status, owner, specs, value, health, warranty, replacement score
- `asset_requests`: requester, requirements, purpose, risk, status, recommended asset
- `approvals`: request, approver, status, reason, timestamp
- `asset_assignments`: asset, user, request, assignment/return information
- `transfers`: asset, from user, to user, approval and status
- `repairs`: asset, issue, repair date, cost and status
- `agent_events`: request, agent, action, tool, status, result, duration, timestamp
- `audit_logs`: actor, role, agent, action, resource, status, details, timestamp
Use JSON only where useful for flexible event details.

## 30. Code Structure
Use a clear separation of UI, services, agents, tools and data access:
```text
src/
  components/  pages/  layouts/  hooks/
  services/agent/  services/tools/
  lib/  types/  routes/  utils/
```
Recommended agents: orchestrator, policyAgent, inventoryAgent, riskAgent, lifecycleAgent, assignmentAgent.
Recommended tools: assetSearch, policyCheck, riskEvaluation, assetAssignment, assetTransfer, assetReturn, lifecycleAnalysis, auditLogging.
Agents should invoke tools instead of containing all operations directly.

## 31. Failure Handling
If a tool fails:
1. Mark event `FAILED`.
2. Store the error.
3. Keep the request recoverable.
4. Show a friendly error.
5. Allow Asset Admin to retry.
Example: `Inventory Tool temporarily unavailable. Workflow paused. Retry available.`
Never expose stack traces.

## 32. Notifications
Add simple in-app notifications for request approval, approval required, replacement recommendation, transfer approval and asset return.
Use a header notification icon. No email integration is required.

## 33. Security
Use route protection and role-based permissions.
- Employees cannot approve requests or modify arbitrary assets.
- Managers access applicable approvals/transfers.
- Asset Admin has full operational access.
If using Supabase: enable RLS and restrict sensitive reads/writes by role; protect audit records.
Never expose service-role keys, database passwords or private API keys.

## 34. UX
Every major page needs Loading, Empty, Error and Success states.
Support desktop, tablet and mobile.
Use semantic HTML, accessible labels, keyboard support, visible focus states and sufficient contrast.
Do not rely only on color for meaning.

## 35. Main Demo
### Demo 1 — Standard Laptop
Employee → Request Laptop → Software Development → 16 GB RAM → 512 GB → Submit.
Expected: `Orchestrator → Policy → Inventory → Risk → LOW → AUTO APPROVED → Assignment → Completed`.
Show recommendation, workflow timeline and audit event.
### Demo 2 — High Value Workstation
Submit a high-performance request with value >= ₹50,000 → MEDIUM → Manager Approval → approve → assigned.
### Demo 3 — Restricted Request
Submit a policy-violating request → HIGH → review → reject → audit event.
### Demo 4 — Lifecycle
Open an old asset → show age, warranty, repairs, health and score → Replacement Recommended.

## 36. Agentic AI Rules
The application must demonstrate: Agent orchestration, tool use, policy evaluation, risk assessment, human-in-the-loop, lifecycle intelligence, auditability and monitoring.
Do not pretend deterministic rules are ML, simulated tokens are real usage, or workflow events are chain-of-thought.
Do not add a generic chatbot merely to label the project as AI.

## 37. Product Identity
Use exactly:
**AssetCareHQ**
**Intelligent IT Asset Lifecycle & Operations Platform**
Short description: `Coordinate IT assets, automate operational decisions, and keep every lifecycle action governed, traceable, and visible.`
Dashboard: **Asset Operations Center**
Agent section: **AssetCareHQ Agent Operations**
Lifecycle section: **Asset Lifecycle Intelligence**

## 38. Implementation Priority
Build in this order:
1. Authentication + roles
2. Layout + navigation
3. Dashboard + seed data
4. Asset Inventory
5. Request Asset
6. Agent workflow + Policy + Inventory + Risk
7. Approval Center + Assignment
8. Audit + Agent Operations + Monitoring
9. Lifecycle Intelligence
10. Transfers + Offboarding
11. Demo Scenarios
12. Responsive/UI polish
Make the request → decision → approval/auto-approval → assignment → audit path fully functional before secondary features.

## 39. Definition of Done
Verify that:
- Authentication and role-based access work.
- Seed data is populated and assets can be searched/filtered.
- Requests, agent workflow, policy, matching, scoring and risk work.
- Auto approval, manager approval and Asset Admin review work.
- Assignment, lifecycle, recurring repair, transfers and offboarding persist.
- Agent events, audit logs and monitoring work.
- Demo scenarios and Reset Demo Data work.
- Loading/empty/error states exist; no secrets or major build/console errors remain.
- UI is responsive, cohesive and presentation-ready.

Build the complete application and ensure the employee request → agent workflow → approval/auto-approval → assignment → audit flow works end-to-end.
