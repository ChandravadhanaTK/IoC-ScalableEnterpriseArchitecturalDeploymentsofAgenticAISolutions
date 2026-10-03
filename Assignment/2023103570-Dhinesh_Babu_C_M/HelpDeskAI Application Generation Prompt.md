# HelpDeskAI — Application Generation Prompt

## Objective

Build a complete, runnable full-stack application named **HelpDeskAI — Scalable Enterprise Agentic AI Assistant for IT Support Automation**.

The application must demonstrate these five capstone requirements:

1. Architecture Diagram
2. Agent Workflow Design
3. Deployment Strategy
4. Security Model
5. Monitoring and Operational Observability

Keep the implementation simple, functional, secure, and academically defensible. Do not add unnecessary enterprise infrastructure.

---

## 1. Technology Stack

### Frontend
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- Java 21
- Spring Boot 3.x
- Spring Web
- Spring Data JPA
- Hibernate
- Spring Security
- Maven
- Lombok where useful

### Database
- SQLite
- JPA/Hibernate

### Deployment
- Frontend: Vercel
- Backend: Render

The base project must not require PostgreSQL, Redis, Kafka, Kubernetes, or microservices.

---

## 2. System Architecture

Implement an **N-Tier Service-Oriented Architecture (SOA) enhanced with a central Agentic Orchestration Engine**.

### Presentation Layer
React + TypeScript + Vite + Tailwind CSS.

Responsibilities:
- Login
- Dashboard
- Agent Assistant
- Tickets
- Agent execution history
- Administrator approvals
- Audit information

### Application Layer
Spring Boot containing:
- REST Controllers
- Authentication and authorization
- AgentService
- ToolRegistry
- Ticket services
- Approval services
- Audit services

### Agent Layer
Create a central `AgentService` / Agentic Orchestrator.

The agent must:
1. Receive the request.
2. Analyze intent.
3. Create a plan.
4. Select a registered tool.
5. Evaluate authorization and risk.
6. Request human approval when necessary.
7. Execute the tool.
8. Validate the result.
9. Retry bounded failures.
10. Complete or fail the task.
11. Return a response.
12. Persist execution information.

### Data Layer
Use:
- SQLite
- Hibernate
- Spring Data JPA

---

## 3. Agent Workflow

Implement this finite-state workflow:

```text
RECEIVED
   ↓
ANALYZING
   ↓
PLANNING
   ↓
AUTHORIZATION / RISK EVALUATION
   │
   ├── NORMAL / AUTHORIZED
   │        ↓
   │     EXECUTING
   │        ↓
   │     VALIDATING
   │        ↓
   │     COMPLETED
   │
   └── HIGH-RISK
            ↓
   WAITING_FOR_AUTHORIZATION
            ↓
      ADMIN DECISION
        /        \
   APPROVED     REJECTED
      ↓            ↓
  EXECUTING     CANCELLED

EXECUTING
   ↓
FAILURE
   ↓
RETRYING
   ├── retry available → EXECUTING
   └── retry exhausted → FAILED
```

Required states:
- RECEIVED
- ANALYZING
- PLANNING
- EXECUTING
- VALIDATING
- COMPLETED
- WAITING_FOR_AUTHORIZATION
- RETRYING
- FAILED
- CANCELLED

Persist important state transitions.

---

## 4. Role-Based Access Control

Implement three RBAC access levels.

### Standard Access
- Submit support requests
- Use the assistant
- Create permitted tickets
- View own tickets
- Check ticket status
- Search permitted knowledge

### Support Access
Additional permissions:
- View support tickets
- Update tickets
- Resolve tickets
- Perform authorized support operations

### Administrative Access
Additional permissions:
- Review high-risk approvals
- Approve/reject high-risk agent actions
- Access administrative functions
- Review relevant audit and agent execution records

Enforce RBAC in the backend. Frontend hiding is not sufficient.

Do not allow arbitrary self-registration as an administrator.

---

## 5. Authentication and Security

Use Spring Security.

Requirements:
- Never store plaintext passwords.
- Hash passwords securely.
- Protect authenticated endpoints.
- Enforce backend authorization.
- Keep secrets in environment variables.
- Validate all API input.
- Return proper HTTP status codes.
- Do not expose stack traces or secrets.
- Do not expose backend secrets to the frontend.

The agent must never:
- Execute arbitrary Java code.
- Execute shell commands.
- Execute arbitrary SQL.
- Directly manipulate the database.
- Create tools dynamically.
- Grant itself permissions.
- Bypass approval.

---

## 6. Tool Registry

Create a central `ToolRegistry`.

The agent may execute **only registered tools**.

Implement:

| Tool | Risk | Purpose |
|---|---|---|
| `search_knowledge` | LOW | Search IT knowledge |
| `create_ticket` | MEDIUM | Create support ticket |
| `get_my_tickets` | LOW | Get user's tickets |
| `get_ticket_status` | LOW | Get permitted ticket status |
| `update_ticket` | MEDIUM | Update permitted ticket |
| `resolve_ticket` | MEDIUM | Resolve ticket |
| `close_ticket` | HIGH | Close ticket; requires approval |
| `get_system_health` | LOW | Get basic service health |

Each tool should contain metadata:
- Name
- Description
- Risk level
- Required role
- Human approval requirement

Do not expose arbitrary backend methods as tools.

---

## 7. Intent-to-Tool Mapping

Use controlled application logic to map natural-language intent to registered tools.

Examples:

```text
"Show my open tickets"
→ get_my_tickets

"What is the status of HD-1001?"
→ get_ticket_status

"My laptop cannot connect to Wi-Fi"
→ search_knowledge or create_ticket

"Update HD-1001"
→ update_ticket

"Resolve HD-1001"
→ resolve_ticket

"Close HD-1001"
→ close_ticket
→ WAITING_FOR_AUTHORIZATION
```

Unsupported requests must not execute arbitrary tools.

Return a controlled message such as:

> I couldn't identify a supported HelpDeskAI operation for that request.

Treat user input as untrusted data.

---

## 8. Human-in-the-Loop Approval

Implement a real approval workflow.

For a high-risk operation:

1. Create an `Approval` record.
2. Set task state to `WAITING_FOR_AUTHORIZATION`.
3. Store requested action, user, tool, reason, risk and timestamps.
4. Display the pending request to an administrator.
5. Administrator selects Approve or Reject.
6. Approved → continue execution.
7. Rejected → `CANCELLED`.
8. Record the decision in the audit log.

No high-risk tool may execute before approval.

---

## 9. Retry and Failure Handling

Implement bounded retries, maximum 2 or 3 attempts.

```text
EXECUTING
   ↓
RETRYING
   ↓
EXECUTING
```

If retries are exhausted:

```text
RETRYING
   ↓
FAILED
```

Do not create infinite retry loops.

Unsupported intent is a controlled response, not a system failure.

---

## 10. Database Entities

Create JPA entities:

### User
- id
- name
- email
- password
- role
- createdAt

### Ticket
- id
- ticketNumber
- title
- description
- status
- priority
- createdBy
- assignedTo
- createdAt
- updatedAt
- resolvedAt
- closedAt

### KnowledgeArticle
- id
- title
- content
- category
- createdAt

### AgentTask
- id
- user
- request
- detectedIntent
- currentState
- selectedTool
- response
- createdAt
- updatedAt

### AgentExecution
- id
- agentTask
- state
- toolName
- status
- attempt
- errorMessage
- startedAt
- completedAt

### ToolExecution
- id
- agentExecution
- toolName
- riskLevel
- status
- inputSummary
- outputSummary
- executedAt

### Approval
- id
- agentTask
- requestedTool
- requestedBy
- reviewedBy
- status
- reason
- createdAt
- reviewedAt

### AuditLog
- id
- actor
- action
- entityType
- entityId
- details
- timestamp

Keep the relationships understandable and avoid unnecessary complexity.

---

## 11. REST API

Create clean REST endpoints.

### Authentication
```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Agent
```text
POST /api/agent/execute
GET  /api/agent/tasks
GET  /api/agent/tasks/{id}
GET  /api/agent/executions/{id}
```

### Tickets
```text
POST /api/tickets
GET  /api/tickets
GET  /api/tickets/{id}
PUT  /api/tickets/{id}
POST /api/tickets/{id}/resolve
POST /api/tickets/{id}/close
```

### Knowledge
```text
GET /api/knowledge/search
GET /api/knowledge
```

### Approvals
```text
GET  /api/approvals/pending
GET  /api/approvals/{id}
POST /api/approvals/{id}/approve
POST /api/approvals/{id}/reject
```

### Audit
```text
GET /api/audit
GET /api/audit/{id}
```

### Health
```text
GET /api/health
```

Adapt names only when necessary, while keeping the API RESTful.

---

## 12. Frontend Pages

Build these pages:

### Login
- Email
- Password
- Login
- Validation/errors

### Register
- Name
- Email
- Password
- Appropriate development/demo role handling
- Registration

Do not allow normal users to assign themselves admin privileges.

### Dashboard
Show:
- Welcome message
- Current role
- Recent requests
- Ticket summary
- Recent agent executions
- Pending approvals for administrators

### Agent Assistant
Provide:
- Natural-language input
- Submit button
- Request history
- Current agent state
- Selected tool
- Result
- Errors
- Execution trace

Example:

```text
Request
  ↓
Analyzing
  ↓
Planning
  ↓
Tool Selected: get_ticket_status
  ↓
Executing
  ↓
Validating
  ↓
Completed
```

### Tickets
Allow permitted users to:
- View tickets
- View ticket details
- Create tickets
- Update tickets
- Resolve tickets
- View status

### Approvals
Administrator-only:
- Requested action
- Requesting user
- Tool
- Risk
- Reason
- Time
- Approve
- Reject

### Agent History / Audit
Show permitted execution and audit information.

---

## 13. UI Design

Use a professional enterprise help-desk style.

Requirements:
- Clean dashboard
- Responsive layout
- Sidebar navigation
- Clear cards
- Status badges
- Loading states
- Empty states
- Error states
- Confirmation dialogs
- Accessible controls
- Consistent typography
- Minimal animation
- No excessive gradients
- No futuristic AI effects

The application should look like a professional academic/enterprise project.

Navigation:

```text
Dashboard
Assistant
Tickets
Agent History
Approvals       [Admin only]
Audit Logs      [Authorized roles]
Profile
Logout
```

---

## 14. Knowledge Base

Seed SQLite with sample IT knowledge articles:

- Password Reset
- VPN Troubleshooting
- Wi-Fi Troubleshooting
- Email Configuration
- Software Installation
- Account Lockout
- Printer Troubleshooting

Simple keyword/text matching is sufficient.

Do not add vector databases or complex RAG infrastructure.

---

## 15. Demo Data

Seed:
- Standard user
- Support user
- Administrative user
- Sample tickets
- Sample knowledge articles

Document demo credentials in the README.

Do not hardcode production secrets.

---

## 16. Security Guardrails

Implement:

### Registered-tools-only
Agent executes only Tool Registry tools.

### Backend authorization
Every protected operation is checked by the backend.

### Role-aware execution
Required role is checked before tool execution.

### High-risk approval
High-risk tools require administrator approval.

### Input validation
Validate API requests.

### No arbitrary execution
Never execute user-provided code, SQL, shell commands, or arbitrary method names.

### Auditability
Record important:
- Agent executions
- Tool executions
- Approvals
- Rejections
- Administrative actions
- Relevant security events

### Prompt-injection resistance
User input cannot:
- Create tools
- Change permissions
- Bypass approval
- Change roles
- Access another user's data

The backend remains the final authority.

---

## 17. Monitoring and Operational Observability

Do **not** build a separate centralized monitoring dashboard inside HelpDeskAI.

Use:
- **Vercel** for frontend deployment/hosting monitoring.
- **Render** for backend service monitoring, logs, availability, deployments and runtime resource usage.

Within HelpDeskAI, retain application-level records for:
- Agent execution states
- Tool activity
- Approval decisions
- Failures/retries
- Audit events
- Ticket outcomes

Expose:

```text
GET /api/health
```

for backend health checks.

Do not claim that HelpDeskAI contains an infrastructure monitoring platform.

---

## 18. Deployment Configuration

### Frontend — Vercel

Use:

```text
VITE_API_BASE_URL
```

Example:

```text
VITE_API_BASE_URL=https://<render-backend-url>
```

Do not hardcode production URLs.

### Backend — Render

Use environment variables such as:

```text
PORT
DATABASE_URL
JWT_SECRET
CORS_ALLOWED_ORIGINS
```

Document SQLite persistence limitations when deployed.

Do not falsely claim that SQLite supports production-grade horizontal multi-instance persistence.

---

## 19. CORS

Configure backend CORS using an environment-configurable frontend origin.

Example:

```text
CORS_ALLOWED_ORIGINS=https://<vercel-frontend-url>
```

Allow localhost during development.

Do not use unrestricted wildcard CORS for production.

---

## 20. Project Structure

Use a structure similar to:

```text
HelpDeskAI/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── context/
│   │   └── App.tsx
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── src/main/java/com/helpdeskai/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── agent/
│   │   ├── tool/
│   │   ├── security/
│   │   └── exception/
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── pom.xml
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── agent-workflow.md
│   ├── deployment.md
│   ├── security.md
│   └── monitoring.md
│
├── .gitignore
└── README.md
```

---

## 21. Error Handling

Implement centralized backend exception handling.

Example:

```json
{
  "timestamp": "2026-10-02T10:30:00",
  "status": 403,
  "error": "FORBIDDEN",
  "message": "You are not authorized to perform this operation."
}
```

Never expose stack traces to clients.

Frontend must show user-friendly errors.

---

## 22. Logging

Log:
- Agent task received
- Tool selected
- Tool execution started/completed
- Approval requested
- Approval decision
- Failure
- Retry
- Final state

Never log passwords, JWT secrets or sensitive credentials.

---

## 23. README

Create a complete README containing:

- Project overview
- Architecture
- Agent workflow
- Tool Registry
- RBAC
- Security
- Human-in-the-loop
- Local setup
- Environment variables
- Demo credentials
- Deployment to Vercel and Render
- Limitations

Explicitly state:
- SQLite is appropriate for this demonstration but has limitations for horizontally scaled production deployments.
- Vercel and Render provide deployment-level monitoring.
- HelpDeskAI does not include a separate centralized monitoring platform.
- The initial agent uses controlled application logic/tool mapping rather than unrestricted autonomous code generation.

---

## 24. Agentic AI Requirement

The application must clearly demonstrate agentic behavior.

The agent must:

1. Interpret natural language.
2. Determine intent.
3. Create a plan.
4. Select a registered tool.
5. Evaluate authorization and risk.
6. Request human approval when necessary.
7. Execute the tool.
8. Validate the result.
9. Retry bounded failures.
10. Produce a final response.
11. Persist the execution trace.

The execution workflow must be visible in the UI.

---

## 25. Acceptance Tests

### Scenario 1 — Knowledge Search

Request:

> How do I troubleshoot VPN connection problems?

Expected:

```text
RECEIVED
→ ANALYZING
→ PLANNING
→ EXECUTING
→ VALIDATING
→ COMPLETED
```

### Scenario 2 — Create Ticket

Request:

> My laptop cannot connect to Wi-Fi. Create a ticket.

Expected:
- `create_ticket`
- Ticket created
- Execution recorded
- Ticket number returned

### Scenario 3 — Check Tickets

Request:

> Show my open tickets.

Expected:
- `get_my_tickets`
- Only permitted tickets returned

### Scenario 4 — High-Risk Operation

Request:

> Close ticket HD-1001.

Expected:

```text
PLANNING
→ WAITING_FOR_AUTHORIZATION
```

After approval:

```text
APPROVED
→ EXECUTING
→ VALIDATING
→ COMPLETED
```

After rejection:

```text
REJECTED
→ CANCELLED
```

### Scenario 5 — Unauthorized Operation

Insufficient-role operation:

```text
403 FORBIDDEN
```

No tool execution must occur.

### Scenario 6 — Failure and Retry

Simulate a controlled tool failure:

```text
EXECUTING
→ RETRYING
→ EXECUTING
```

After the retry limit:

```text
FAILED
```

Record the failure.

---

## 26. Documentation Deliverables

Generate:

```text
README.md
docs/architecture.md
docs/agent-workflow.md
docs/deployment.md
docs/security.md
docs/monitoring.md
```

Documentation must match the actual implementation. Never document unimplemented infrastructure or capabilities.

---

## 27. Final Instruction

Build **HelpDeskAI** as a complete, coherent, runnable full-stack project.

Priorities:

1. Correct functionality
2. Clear agent workflow
3. Security and authorization
4. Human-in-the-loop approval
5. Traceable execution
6. Clean architecture
7. Simple deployment
8. Professional UI
9. Accurate documentation

The final application must be suitable for the academic capstone:

**“Scalable Enterprise Architectural Deployments of Agentic AI Solutions.”**

Keep it simple, defensible and genuinely functional. Do not artificially increase complexity just to make the project appear more enterprise-grade.
