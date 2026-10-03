---

## 2. Agent Workflow Design

### 2.1 Agentic Workflow

CampusFix AI uses a coordinated multi-agent workflow to process campus
maintenance complaints. Each agent performs a specific responsibility and
passes its output to the next stage of the workflow.

```mermaid
flowchart TD

    START([User Reports Issue])
    VALIDATE[Validate Issue]
    CREATE[Create Maintenance Ticket]

    ORCH[Agent Orchestrator]

    TRIAGE[Triage Agent<br/>Categorize Issue]
    PRIORITY[Priority Agent<br/>Determine Priority]
    ASSIGN[Assignment Agent<br/>Select Maintenance Team]
    RESOLVE[Resolution Agent<br/>Generate Resolution]
    
    CHECK{High / Critical<br/>Priority?}

    APPROVAL[Human Approval<br/>Admin Review]
    NOTIFY[Notification Agent]
    UPDATE[Update Ticket]
    
    END([Ticket Ready for Maintenance])

    START --> VALIDATE
    VALIDATE --> CREATE
    CREATE --> ORCH

    ORCH --> TRIAGE
    TRIAGE --> PRIORITY
    PRIORITY --> ASSIGN
    ASSIGN --> RESOLVE

    RESOLVE --> CHECK

    CHECK -->|Yes| APPROVAL
    CHECK -->|No| NOTIFY

    APPROVAL -->|Approved| NOTIFY
    APPROVAL -->|Rejected| UPDATE

    NOTIFY --> UPDATE
    UPDATE --> END

2.2 Agent Responsibilities
Agent	Responsibility	Input	Output
Triage Agent	Understands and categorizes the reported issue	Issue description	Issue category
Priority Agent	Determines the urgency of the issue	Issue category and description	Priority level
Assignment Agent	Selects the appropriate maintenance team	Category and priority	Team assignment
Resolution Agent	Suggests an appropriate resolution	Issue information	Resolution recommendation
Notification Agent	Handles communication about workflow results	Ticket state	Notification/event
Agent Orchestrator	Coordinates the complete workflow	Maintenance ticket	Combined workflow result

2.3 Agent Execution Sequence
The workflow follows these stages:
Stage 1 — Issue Submission
The student or staff member submits a maintenance complaint through the
CampusFix AI frontend.
Stage 2 — Validation
The backend validates the submitted information and creates a maintenance
ticket.
Stage 3 — Triage
The Triage Agent analyses the complaint and identifies the relevant
maintenance category such as network, electrical, plumbing, equipment, or
cleaning.
Stage 4 — Priority Analysis
The Priority Agent evaluates the issue and determines its priority level.
Possible priority levels include:
- LOW
- MEDIUM
- HIGH
- CRITICAL
Stage 5 — Assignment
The Assignment Agent determines which maintenance team should handle the
ticket based on the identified issue category and priority.
Stage 6 — Resolution Recommendation
The Resolution Agent generates a recommended action that can assist the
maintenance team in resolving the issue.
Stage 7 — Human-in-the-Loop
High and critical priority cases can be routed to an administrator for human
approval before the workflow continues.
This provides human oversight for decisions that may require additional
verification or authorization.
Stage 8 — Notification
The Notification Agent handles communication related to the resulting
workflow state.
Stage 9 — Ticket Update
The final workflow result is stored with the ticket, allowing users and
maintenance staff to track its progress.
2.4 Agent Coordination
The Agent Orchestrator acts as the central coordination component.
Maintenance Issue
       |
       v
Agent Orchestrator
       |
       +----> Triage Agent
       |          |
       |          v
       +----> Priority Agent
       |          |
       |          v
       +----> Assignment Agent
       |          |
       |          v
       +----> Resolution Agent
       |          |
       |          v
       +----> Human Approval
       |          |
       |          v
       +----> Notification Agent
                  |
                  v
             Ticket Update

The orchestrator ensures that the agents operate as a coordinated workflow
rather than as independent services.
2.5 Failure Handling
The system should maintain a predictable ticket state if an agent or API
operation encounters an error.
The workflow can record the failure, preserve the ticket information, and
allow the issue to be reviewed or retried rather than silently losing the
maintenance request.
2.6 Human-in-the-Loop Design
CampusFix AI incorporates human oversight into the agentic workflow.
AI Analysis
     |
     v
Priority Decision
     |
     v
Is additional approval required?
     |
   Yes
     |
     v
Administrator Review
     |
   +---+---+
   |       |
Approve   Reject
   |       |
   v       v
Continue  Update Ticket

This design allows autonomous processing for routine maintenance issues while
retaining human control over higher-priority cases.