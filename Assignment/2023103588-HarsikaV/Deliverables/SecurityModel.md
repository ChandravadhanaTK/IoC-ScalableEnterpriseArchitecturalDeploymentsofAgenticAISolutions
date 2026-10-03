---

## 4. Security Model

### 4.1 Security Overview

CampusFix AI follows a defense-in-depth security model covering
authentication, authorization, API security, data protection, agent
controls, secret management, and auditability.

The security architecture is designed to ensure that users can access only
the functionality permitted by their role and that agent-driven actions
remain controlled and traceable.

### 4.2 Security Architecture

```mermaid
flowchart TB

    USER[Campus User]

    subgraph AUTH["Authentication & Authorization"]
        LOGIN[Login]
        JWT[Authenticated Session / Token]
        RBAC[Role-Based Access Control]
    end

    subgraph API["API Security"]
        VALIDATE[Request Validation]
        APIAUTH[Protected API Endpoints]
        ERROR[Controlled Error Responses]
    end

    subgraph AGENT["Agent Security"]
        ORCH[Agent Orchestrator]
        POLICY[Workflow / Policy Controls]
        HUMAN[Human Approval]
    end

    subgraph DATA["Data Protection"]
        DB[(Application Database)]
        AUDIT[Audit Records]
    end

    subgraph SECRETS["Secret Management"]
        ENV[Environment Variables]
        SECRET[Application Secrets]
    end

    USER --> LOGIN
    LOGIN --> JWT
    JWT --> RBAC

    RBAC --> APIAUTH
    APIAUTH --> VALIDATE
    VALIDATE --> ORCH

    ORCH --> POLICY
    POLICY --> HUMAN

    APIAUTH --> DB
    ORCH --> DB

    APIAUTH --> AUDIT
    ORCH --> AUDIT

    ENV --> SECRET
    SECRET --> APIAUTH

4.3 Authentication
CampusFix AI requires users to authenticate before accessing protected
application functionality.
The authentication layer provides:
- Username/password-based login
- Protected application routes
- Authenticated API requests
- Session/token validation
- Logout functionality
- Protection against unauthenticated access
Unauthenticated users should not be allowed to access protected ticket,
maintenance, or administrative functionality.
4.4 Role-Based Access Control
The application uses role-based authorization to separate the capabilities
of different campus users.
The primary roles are:
Role	Typical Access
Student	Report issues and view own tickets
Staff	Report and track maintenance issues
Maintenance	View assigned tickets and update maintenance status
Admin	Manage users, tickets, approvals, and administrative operations


Authorization should be enforced at the backend API level rather than
relying only on frontend navigation controls.
This prevents a user from bypassing the frontend and directly calling a
restricted API endpoint.
4.5 API Security
The FastAPI backend acts as the security boundary between the frontend and
the application services.
Important controls include:
1. Validate incoming request data.
2. Authenticate protected requests.
3. Verify the user's role before sensitive operations.
4. Validate ticket identifiers and parameters.
5. Return controlled error responses.
6. Avoid exposing internal implementation details through error messages.
7. Prevent unauthorized modification of tickets.
The frontend should never be treated as a trusted security boundary.
4.6 Ticket-Level Authorization
CampusFix AI should enforce access according to the user's role and ticket
ownership.
For example:
Student
   |
   +----> Create Issue
   |
   +----> View Own Tickets
   |
   X----> Modify Other Users' Tickets

Maintenance
   |
   +----> View Assigned Tickets
   |
   +----> Update Maintenance Status
   |
   X----> Manage Administrative Users

Admin
   |
   +----> Administrative Operations
   +----> Review High/Critical Tickets
   +----> Human Approval

This minimizes unauthorized access to maintenance information.
4.7 Agent Security
Agentic AI introduces additional security requirements because agents can
make decisions based on user-provided information.
CampusFix AI therefore separates agent responsibilities.
User Input
    |
    v
Validation
    |
    v
Triage Agent
    |
    v
Priority Agent
    |
    v
Assignment Agent
    |
    v
Resolution Agent
    |
    v
Policy / Approval Check
    |
    +----> Human Approval when required
    |
    v
Notification / Ticket Update

The agents should operate within predefined responsibilities rather than
having unrestricted access to the entire application.
4.8 Human-in-the-Loop Security
High and critical priority issues can require administrator review before
the workflow proceeds.
Agent Decision
      |
      v
Priority Check
      |
      v
HIGH / CRITICAL?
    /       \
  YES        NO
   |          |
   v          v
Admin       Continue
Review      Workflow
   |
 +---+---+
 |       |
Approve Reject
 |       |
 v       v
Continue Update

Human approval provides an additional control against incorrect or
unexpected automated decisions.
4.9 Input Validation
User-submitted issue descriptions and ticket information should be
validated before being processed.
Validation should include:
- Required field validation
- Data type validation
- Length restrictions
- Valid ticket identifiers
- Valid priority/status values
- Valid user and role values
Input validation reduces malformed requests and helps prevent unexpected
application behavior.
4.10 Secret Management
Sensitive configuration should never be committed directly into the
repository.
Examples include:
- JWT secrets
- AI provider API keys
- Database credentials
- Authentication secrets
- Production configuration values
Environment variables should be used to provide sensitive configuration.
The repository can contain:
.env.example

as a template containing variable names without exposing real credentials.
The actual .env file should remain outside version control.
4.11 Database Security
The database stores important application information such as users,
tickets, ticket status, and workflow information.
Security controls should include:
- Controlled database access
- Parameterized database operations
- Restricted modification privileges
- Regular backups in production
- Protection of database credentials
- Avoiding direct database access from the frontend
The current SQLite database is suitable for the project-scale deployment.
A production deployment can use a managed relational database with stronger
concurrency, backup, and access-control capabilities.
4.12 Auditability
Important security-sensitive operations should be traceable through
application logs or audit records.
Examples include:
- Login attempts
- Unauthorized API requests
- Ticket modifications
- Priority changes
- Assignment changes
- Administrative approvals
- Agent workflow failures
- Status transitions
An audit trail helps administrators investigate unexpected behavior and
provides accountability for important system actions.
4.13 Error Handling
Security-related errors should not reveal sensitive internal information.
For example, the application should avoid exposing:
Database connection strings
Secret keys
Internal file paths
Stack traces
Authentication tokens

to normal end users.
Instead, the API should return a controlled error response while detailed
diagnostic information is recorded in application logs.
4.14 Security Principles
CampusFix AI follows these core security principles:
- Least Privilege — users and agents receive only the permissions they
  require.
- Defense in Depth — multiple security controls protect the system.
- Backend Authorization — sensitive operations are protected at the API
  layer.
- Human Oversight — high-impact automated decisions can require human
  approval.
- Secret Isolation — credentials and API keys are kept outside source
  code.
- Auditability — important operations should be traceable.
- Secure Failure — errors should fail without exposing sensitive
  implementation details.
4.15 Security Flow Summary
Authenticate User
       |
       v
Validate Role
       |
       v
Authorize API Request
       |
       v
Validate Input
       |
       v
Execute Ticket / Agent Workflow
       |
       v
Apply Agent Policies
       |
       v
Human Approval if Required
       |
       v
Store Result
       |
       v
Record Relevant Activity

This security model provides a foundation for safely operating CampusFix AI
while maintaining the control and accountability required for an
agentic campus maintenance platform.