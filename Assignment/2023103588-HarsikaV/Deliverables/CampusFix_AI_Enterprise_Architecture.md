# CampusFix AI — Enterprise Architecture Deliverables

## 1. Architecture Diagram

### 1.1 System Overview

CampusFix AI is an agentic AI-based campus maintenance system that allows
students and staff to report maintenance issues and enables intelligent
analysis, prioritization, assignment, resolution recommendation, and
notification.

The system follows a layered architecture consisting of the presentation
layer, API/backend layer, agentic AI layer, data layer, and monitoring/testing
components.

### 1.2 Architecture

```mermaid
flowchart TB

    U1[Student]
    U2[Staff]
    U3[Maintenance Staff]
    U4[Admin]

    subgraph Frontend["Presentation Layer"]
        UI[CampusFix AI Web Application<br/>React + TypeScript]
        DASH[Dashboard]
        REPORT[Issue Reporting]
        TICKETS[Ticket Management]
        PROFILE[User Profile]
    end

    subgraph Backend["Application / API Layer"]
        API[FastAPI Backend]
        AUTH[Authentication & RBAC]
        TICKET_API[Ticket Management APIs]
        AGENT_API[Agent Orchestration APIs]
    end

    subgraph AI["Agentic AI Layer"]
        ORCH[Agent Orchestrator]

        TRIAGE[Triage Agent]
        PRIORITY[Priority Agent]
        ASSIGN[Assignment Agent]
        RESOLUTION[Resolution Agent]
        NOTIFY[Notification Agent]

        APPROVAL[Human Approval]
    end

    subgraph Data["Data Layer"]
        DB[(SQLite Database)]
        AUDIT[Audit / Activity Data]
    end

    subgraph Quality["Quality & Operations"]
        TESTS[Automated Tests]
        LOGS[Application Logs]
        HEALTH[Health / Error Monitoring]
    end

    U1 --> UI
    U2 --> UI
    U3 --> UI
    U4 --> UI

    UI --> DASH
    UI --> REPORT
    UI --> TICKETS
    UI --> PROFILE

    UI --> API

    API --> AUTH
    API --> TICKET_API
    API --> AGENT_API

    TICKET_API --> DB
    AGENT_API --> ORCH

    ORCH --> TRIAGE
    TRIAGE --> PRIORITY
    PRIORITY --> ASSIGN
    ASSIGN --> RESOLUTION
    RESOLUTION --> APPROVAL

    APPROVAL --> ASSIGN
    RESOLUTION --> NOTIFY

    ORCH --> DB
    AUTH --> DB
    TICKET_API --> DB

    API --> AUDIT
    ORCH --> AUDIT

    API --> LOGS
    ORCH --> LOGS

    TESTS --> API
    TESTS --> ORCH

    LOGS --> HEALTH

1.3 Architecture Components
Layer	Component	Responsibility
Presentation	React Frontend	Provides the user interface for campus users
Presentation	Dashboard	Displays ticket and maintenance information
Presentation	Issue Reporting	Allows users to submit campus issues
Application	FastAPI Backend	Provides REST APIs and application logic
Application	Authentication & RBAC	Controls user authentication and role-based access
AI	Agent Orchestrator	Coordinates the multi-agent maintenance workflow
AI	Triage Agent	Analyses and categorizes reported issues
AI	Priority Agent	Determines the priority of an issue
AI	Assignment Agent	Determines the appropriate maintenance team
AI	Resolution Agent	Provides a suggested resolution
AI	Notification Agent	Handles notifications related to ticket processing
AI	Human Approval	Provides human oversight for high-risk decisions
Data	SQLite	Stores application and ticket information
Quality	Automated Tests	Validates backend and agent functionality
Operations	Logging	Records application and workflow activity

1.4 Main Data Flow
1. A student or staff member logs into CampusFix AI.
2. The user submits a campus maintenance issue.
3. The frontend sends the issue to the FastAPI backend.
4. The backend creates and stores the ticket.
5. The Agent Orchestrator initiates the agent workflow.
6. The Triage Agent analyses the issue category.
7. The Priority Agent determines the ticket priority.
8. The Assignment Agent determines the appropriate maintenance team.
9. The Resolution Agent generates a recommended resolution.
10. High-priority or sensitive decisions can be routed through human approval.
11. The Notification Agent communicates the resulting ticket state.
12. The ticket status is updated and stored in the database.
13. Users can view the ticket and its current status through the dashboard.