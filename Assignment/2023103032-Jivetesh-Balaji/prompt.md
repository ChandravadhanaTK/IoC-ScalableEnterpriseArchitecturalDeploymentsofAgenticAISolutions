# Prompt to Generate the Agentic IT Service Assistant

Create a complete enterprise-style Agentic IT Service Assistant named **Enterprise IT Service Agent**.

## Objective
Build a working web application where an employee can ask for IT support. The assistant must behave as an agent: understand the request, create a plan, select tools, enforce authorization before tool execution, request human approval for high-risk operations, execute approved actions, verify the result, and return a useful response.

## Required Capstone Deliverables

The generated application and documentation must demonstrate these five deliverables:

1. **Architecture Diagram**
   - User interface
   - API gateway/backend
   - Agent orchestrator
   - Knowledge retrieval
   - Tool layer
   - Authorization/policy engine
   - Approval service
   - Enterprise data/services
   - Monitoring

2. **Agent Workflow Design**
   - Agent roles
   - States
   - Planning
   - Tool selection
   - Handoffs
   - Authorization
   - Human approval
   - Retry/failure paths
   - Verification

3. **Deployment Strategy**
   - Development, staging and production environments
   - Containerization
   - Health checks
   - Scaling
   - Resilience
   - Release strategy

4. **Security Model**
   - Authentication
   - Role-based authorization
   - Least privilege
   - Tool-boundary authorization
   - Secrets
   - Privacy
   - Guardrails
   - Audit logs
   - Human approval for high-risk operations

5. **Monitoring Dashboard**
   - Request count
   - Success rate
   - Latency
   - Tool calls
   - Authorization denials
   - Approval requests
   - Failures
   - Cost/token placeholders
   - Business outcomes
   - Audit events

## Functional Requirements

The application should support:

- Chat-style employee interface.
- Knowledge/FAQ search.
- IT ticket creation.
- Ticket status lookup.
- Ticket listing.
- Asset/device lookup.
- User profile lookup.
- Password reset request as a high-risk operation that requires approval.
- Role-aware authorization.
- Agent execution trace visible in the UI.
- Monitoring dashboard.
- Health endpoint.
- Audit logging.
- Clear success/failure responses.

## Suggested Technology

Use a simple stack that is easy for a university capstone:

- Python 3.11+
- FastAPI
- SQLite for local development
- HTML/CSS/JavaScript frontend served by FastAPI
- Docker and Docker Compose
- Optional LLM integration can be added later; the baseline application must run without an external paid API.

## Agent Design

Implement an `AgentOrchestrator` that:

1. Receives the user's message and user role.
2. Classifies the intent.
3. Creates a short execution plan.
4. Retrieves knowledge when appropriate.
5. Selects one or more tools.
6. Checks authorization at the tool boundary.
7. Requests approval for high-risk actions.
8. Executes allowed actions.
9. Verifies the result.
10. Records an execution trace and audit event.
11. Returns a final response.

Do not allow the agent to bypass the authorization layer.

## Security Rules

Roles:

- EMPLOYEE
- IT_SUPPORT
- ADMIN

Example permissions:

- Search knowledge: all roles
- Create ticket: all roles
- View own ticket: all roles
- View another employee's ticket: IT_SUPPORT/ADMIN
- Asset lookup: own asset for employee; broader lookup for IT_SUPPORT/ADMIN
- Password reset: IT_SUPPORT/ADMIN and approval required
- Delete account: ADMIN only and approval required

Never expose secrets in responses or logs.

## UI Requirements

Create a clean dark enterprise dashboard with:

- Chat panel
- User role selector for demo purposes
- Quick actions
- Agent plan/trace
- Monitoring cards
- Recent audit events
- Ticket information

The application must be easy to demonstrate in a 5–10 minute capstone presentation.

## Code Quality

- Use modular Python files.
- Add comments for important security and orchestration decisions.
- Use environment variables for configuration.
- Include `.env.example`.
- Include `requirements.txt`.
- Include Dockerfile and docker-compose.yml.
- Include README instructions.
- Include sample data initialization.
- Include a health endpoint.
- Include API error handling.
