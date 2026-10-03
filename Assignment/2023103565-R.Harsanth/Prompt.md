# AEGISDESK — Agentic IT Support Demonstrator

## 1. Project Overview

**AEGISDESK** is an enterprise-oriented **Agentic IT Support Demonstrator** designed to show how an AI-assisted IT support system can safely plan, route, diagnose, and respond to employee support requests.

The system demonstrates an agentic workflow in which a user's request is:

1. Received and interpreted.
2. Classified and routed to an appropriate support workflow.
3. Matched against internal knowledge.
4. Evaluated against safety and authorization policies.
5. Handled using simulated IT tools where appropriate.
6. Escalated for human approval when a protected action is requested.
7. Recorded through workflow tracing and audit events.
8. Reflected in operational monitoring metrics.

The application is intentionally designed as a **safe demonstrator**. It does not connect to real enterprise infrastructure or automatically execute sensitive actions.

---

## 2. Problem Statement

Traditional IT support workflows often require users to submit tickets and wait for manual investigation.

An agentic IT support system can improve this process by combining:

* Natural-language request understanding
* Intelligent workflow planning
* Internal knowledge retrieval
* Diagnostic tools
* Policy enforcement
* Human approval
* Auditability
* Operational monitoring

However, enterprise deployment introduces important requirements around:

* Security
* Authorization
* Privacy
* Human oversight
* Tool safety
* Traceability
* Failure handling
* Operational reliability

AEGISDESK demonstrates these concepts in a controlled local environment.

---

## 3. Objectives

The project should demonstrate the following capabilities.

### 3.1 Agentic Request Planning

The system should interpret an incoming support request and determine an appropriate workflow.

Example categories include:

* Wi-Fi and network troubleshooting
* VPN troubleshooting
* Account assistance
* Protected account or device actions
* Support ticket creation
* General IT assistance

---

### 3.2 Knowledge Retrieval

The agent should retrieve relevant information from a local internal knowledge base.

The knowledge base may contain support articles covering topics such as:

* Wi-Fi troubleshooting
* VPN access
* Account recovery
* Printer support
* Support ticket procedures

Retrieved information should be used as evidence when generating the response.

---

### 3.3 Tool-Based Diagnostics

The system should demonstrate how an agent can use tools to investigate an IT problem.

For the demonstrator, these tools should be **simulated** rather than connected to real enterprise infrastructure.

Example simulated tools:

* Wi-Fi connectivity check
* VPN status check
* Account status check
* Support ticket creation

Tool results should clearly indicate that they are simulated.

---

### 3.4 Human Approval for Protected Actions

Sensitive actions must not be executed automatically.

Examples include:

* Unlocking an account
* Resetting a password
* Changing access permissions
* Granting privileged access
* Restarting or rebooting a device

When such an action is requested, the system should:

1. Identify the request as protected.
2. Apply the relevant policy.
3. Create an approval request.
4. Place the request into an approval queue.
5. Wait for an authorized human decision.
6. Record the approval or rejection.
7. Avoid executing the sensitive action automatically.

This demonstrates a **human-in-the-loop** safety model.

---

## 4. Safety and Governance Principles

The demonstrator should follow these principles.

### Policy First

Agent decisions should be evaluated against predefined policies before tools are executed.

### Least Privilege

Agents should receive only the permissions required for the current workflow.

### Human Oversight

Sensitive or high-impact actions should require explicit human approval.

### Local-First Demonstration

The demonstrator should use local knowledge and simulated enterprise integrations wherever possible.

### Explicit Simulation

Simulated tools must clearly communicate that no real enterprise system was modified.

### Traceability

Each workflow should produce a trace containing important stages such as:

* Request received
* Request classified
* Policy evaluated
* Knowledge retrieved
* Tool selected
* Tool executed or approval requested
* Response generated

### Auditability

Important actions, decisions, approvals, and failures should be recorded as audit events.

### Fail-Safe Behaviour

If a request cannot be safely handled, the system should stop the protected workflow or escalate it rather than attempting an unsafe action.

### Reproducibility

The project should be runnable in a controlled local environment using Docker Compose.

---

## 5. Architecture Requirements

The architecture should represent the major components of an enterprise agentic IT support platform.

The design should include:

* User interface
* Agent/API layer
* Request planner
* Policy and safety layer
* Knowledge retrieval component
* Tool execution layer
* Human approval workflow
* Audit and tracing
* Monitoring and metrics
* Simulated enterprise integrations

The architecture should clearly identify:

* System boundaries
* Trust boundaries
* Internal components
* External integrations
* Protected operations
* Human approval points

---

## 6. Agent Workflow Requirements

The workflow should demonstrate how an agent moves from an incoming request to a safe resolution.

A typical workflow should contain states similar to:

```text
Request Received
       ↓
Classify Request
       ↓
Retrieve Knowledge
       ↓
Evaluate Policy
       ↓
Select Action
       ↓
 ┌───────────────┐
 │ Safe Action?  │
 └───────┬───────┘
         │
    ┌────┴────┐
    │         │
   Yes        No
    │         │
    ↓         ↓
Execute    Request
Tool       Approval
    │         │
    │     ┌───┴───┐
    │     │       │
    │   Approve  Reject
    │     │       │
    │     ↓       ↓
    │  Controlled Stop
    │  Action    Workflow
    │     │
    └─────┴───────┐
                  ↓
             Generate Response
                  ↓
             Record Audit
                  ↓
               Complete
```

The workflow should also account for failure conditions such as:

* Missing knowledge
* Tool failure
* Invalid request
* Policy violation
* Approval rejection
* Timeout
* Unexpected tool response

---

## 7. Deployment Requirements

The demonstrator should support a containerized local deployment.

The preferred runtime should include:

* Docker
* Docker Compose
* Python
* FastAPI
* Uvicorn
* A browser-based frontend

The application should expose an API for agent interactions and provide a user interface for demonstrating workflows.

The deployment design should describe how the same architecture could be extended from a local demonstration to an enterprise environment.

Potential enterprise components may include:

* API gateway
* Identity provider
* Container orchestration
* Centralized logging
* Secrets management
* Enterprise ticketing systems
* Network monitoring systems
* Endpoint management systems

These integrations should remain conceptual or simulated unless explicitly configured.

---

## 8. Security Requirements

The security model should address:

### Identity

Users and approvers should be identifiable within the workflow.

### Authorization

Different roles should have different capabilities.

Example roles:

* Employee/User
* Support Agent
* Approver
* Administrator

### Secrets

Credentials and API keys must not be hard-coded into source code.

Sensitive configuration should use environment variables or a secrets-management mechanism.

### Privacy

The system should minimize unnecessary collection and storage of personal information.

### Guardrails

The agent should not bypass authorization or execute protected actions without approval.

### Audit

Important workflow events should be recorded for investigation and accountability.

---

## 9. Monitoring Requirements

The application should provide operational visibility into the agent.

The monitoring design should cover:

### Health

* Application availability
* API health
* Tool availability
* Error rates

### Workflow Tracing

* Request ID
* Workflow stages
* Tool calls
* Approval events
* Completion status
* Failure points

### Quality

* Successful resolutions
* Escalations
* Retrieval results
* Tool outcomes

### Safety

* Policy blocks
* Protected actions
* Approval requests
* Approval rejections
* Safety-related failures

### Cost

For an enterprise implementation, monitoring may include:

* Model usage
* Token consumption
* Tool usage
* Infrastructure cost

### Business Outcomes

Potential metrics include:

* Requests handled
* Resolution rate
* Average handling time
* Escalation rate
* Approval turnaround time

---

## 10. Demonstration Scenarios

The completed application should demonstrate at least the following scenarios.

### Scenario 1 — Wi-Fi Troubleshooting

Example request:

> My Wi-Fi keeps disconnecting.

Expected behaviour:

* Classify the request as a network/Wi-Fi issue.
* Retrieve the relevant Wi-Fi troubleshooting guidance.
* Run the simulated Wi-Fi diagnostic tool.
* Provide safe troubleshooting steps.
* Record the workflow trace.

---

### Scenario 2 — VPN Troubleshooting

Example request:

> My corporate VPN is not connecting.

Expected behaviour:

* Classify the request as a VPN issue.
* Retrieve the VPN troubleshooting guidance.
* Run the simulated VPN diagnostic tool.
* Provide appropriate next steps.
* Record the workflow trace.

---

### Scenario 3 — Protected Account Action

Example request:

> Please unlock my account.

Expected behaviour:

* Identify the request as a protected account action.
* Apply the safety policy.
* Do not automatically unlock the account.
* Create an approval request.
* Display the request in the approval queue.
* Allow an authorized approver to approve or reject the request.
* Record the decision in the audit trail.

---

### Scenario 4 — Support Ticket

Example request:

> Create a support ticket for my issue.

Expected behaviour:

* Classify the request as ticket-related.
* Create a simulated ticket.
* Return a demonstration ticket identifier.
* Clearly state that no real external ticketing system was contacted.
* Record the workflow trace and audit event.

---

## 11. User Interface Requirements

The application should provide a simple professional interface containing:

* Agent conversation area
* Request input
* Suggested support scenarios
* Workflow status
* Approval queue
* Operational metrics
* Recent requests
* Audit activity
* System health information

The interface should allow the evaluator to understand the agent's decision-making workflow without requiring direct interaction with the source code.

---

## 12. API Requirements

The backend should expose endpoints supporting the demonstrator.

Representative endpoints include:

| Endpoint                            | Purpose                              |
| ----------------------------------- | ------------------------------------ |
| `GET /api/health`                   | Check application health             |
| `POST /api/chat`                    | Submit an IT support request         |
| `GET /api/approvals`                | View pending approvals               |
| `GET /api/approvals/{id}`           | View an approval request             |
| `POST /api/approvals/{id}/decision` | Approve or reject a protected action |
| `GET /api/metrics`                  | Retrieve operational metrics         |
| `GET /api/audit`                    | View audit events                    |
| `GET /api/dashboard`                | Retrieve dashboard information       |
| `GET /metrics`                      | Expose monitoring metrics            |

---

## 13. Testing Requirements

The project should include automated tests covering the core workflow.

Tests should verify:

* Wi-Fi request routing
* VPN request routing
* Protected-action detection
* Knowledge retrieval
* Simulated tool execution
* Safety gating

The tests should be runnable using:

```bash
pytest
```

---

## 14. Expected Project Deliverables

The completed submission should contain documentation covering five major areas:

1. **Architecture Diagram**

   * Layers
   * Components
   * Trust boundaries
   * Integrations

2. **Agent Workflow Design**

   * Agent roles
   * States
   * Tools
   * Handoffs
   * Approvals
   * Failure paths

3. **Deployment Strategy**

   * Runtime
   * Environments
   * Scaling
   * Resilience
   * Release strategy

4. **Security Model**

   * Identity
   * Authorization
   * Secrets
   * Privacy
   * Guardrails
   * Audit

5. **Monitoring Dashboard Design**

   * Health
   * Tracing
   * Quality
   * Safety
   * Cost
   * Business outcomes

---

## 15. Enterprise Extension Path

The demonstrator should be designed so that simulated components can later be replaced by controlled enterprise integrations.

Possible integrations include:

* Microsoft Entra ID or another enterprise identity provider
* Enterprise ticketing platforms
* Endpoint management systems
* Network monitoring systems
* VPN management platforms
* Centralized logging platforms
* Enterprise secrets managers
* Observability platforms

Any production integration should preserve the project's core principles of:

* Least privilege
* Explicit authorization
* Human approval for sensitive operations
* Auditability
* Traceability
* Fail-safe execution

---

## 16. Final Design Principle

AEGISDESK should demonstrate that an agentic IT support system is not simply an AI chatbot.

It should operate as a controlled workflow consisting of:

**Understand → Plan → Retrieve → Check Policy → Act Safely → Request Approval When Required → Trace → Audit → Respond**

The primary goal of the demonstrator is to show how agentic automation can be combined with **security, governance, human oversight, and operational visibility** to create an enterprise-ready foundation for IT support automation.
