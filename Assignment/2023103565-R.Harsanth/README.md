# AEGISDESK — Agentic IT Support Demonstrator

**Student:** R. Harsanth
**Register Number:** 2023103565

AEGISDESK is an enterprise-oriented agentic IT support demonstrator designed to show how an AI-assisted support workflow can combine request planning, internal knowledge retrieval, controlled tool execution, human approval, auditability, and operational monitoring.

The project focuses on safe agentic automation rather than unrestricted autonomous administration.

## Submission Structure

```text
2023103565-R.Harsanth/
│
├── application/
│   ├── backend/
│   ├── frontend/
│   ├── knowledge/
│   ├── monitoring/
│   ├── tests/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── README.md
│   └── requirements.txt
│
├── Prompt.md
├── Deliverables.md
└── README.md
```

## Project Features

* Agentic IT request routing
* Local support knowledge retrieval
* Wi-Fi troubleshooting workflow
* Corporate VPN troubleshooting workflow
* Protected account/device action detection
* Human approval workflow
* Simulated IT diagnostic tools
* Simulated support-ticket creation
* Request tracing
* Audit events
* Health and metrics APIs
* Operations dashboard
* Dockerized deployment
* Automated tests

## Safety Model

AEGISDESK follows a policy-first workflow.

Safe diagnostic requests may proceed through simulated tools.

Sensitive operations such as account unlocking are not automatically executed. They are placed into an approval queue for an authorized operator.

The demonstrator also clearly identifies simulated integrations and does not claim that real enterprise systems were modified.

## Demonstrated Workflows

### Wi-Fi

```text
User Request
    ↓
Planner
    ↓
Wi-Fi Knowledge
    ↓
Policy Check
    ↓
Simulated Diagnostic
    ↓
Safe Troubleshooting Response
    ↓
Audit
```

### VPN

```text
User Request
    ↓
Planner
    ↓
VPN Knowledge
    ↓
Policy Check
    ↓
Simulated Diagnostic
    ↓
Safe Troubleshooting Response
    ↓
Audit
```

### Protected Account Action

```text
User Request
    ↓
Planner
    ↓
Policy Check
    ↓
Protected Action
    ↓
Approval Queue
    ↓
Human Approver
    ├── Approve
    └── Reject
```

### Support Ticket

```text
User Request
    ↓
Planner
    ↓
Ticket Workflow
    ↓
Policy Check
    ↓
Simulated Ticket Creation
    ↓
Demo Ticket Reference
    ↓
Audit
```

## Running the Application

Open a terminal inside the `application` directory.

### Docker

```bash
docker compose up --build
```

The application will be available at:

```text
http://localhost:8000
```

### Run Tests

```bash
docker exec northstar-it-support pytest -q
```

The automated test suite covers:

* Wi-Fi routing;
* VPN routing;
* protected-action detection;
* knowledge retrieval;
* simulated ticket creation.

## API Endpoints

| Endpoint                       | Purpose                |
| ------------------------------ | ---------------------- |
| `/api/health`                  | Service health         |
| `/api/chat`                    | Submit support request |
| `/api/approvals`               | View approval queue    |
| `/api/approvals/{id}`          | View approval          |
| `/api/approvals/{id}/decision` | Approve/reject request |
| `/api/metrics`                 | Operational metrics    |
| `/api/audit`                   | Audit events           |
| `/api/dashboard`               | Dashboard data         |
| `/metrics`                     | Metrics endpoint       |

## Technology Stack

* Python
* FastAPI
* Uvicorn
* HTML/CSS/JavaScript
* Docker
* Docker Compose
* Pytest
* Local Markdown knowledge base

## Enterprise Extension Path

The current implementation intentionally uses simulated integrations.

A production implementation can replace these with controlled adapters for:

* enterprise identity;
* ticketing systems;
* network diagnostics;
* endpoint management;
* approval systems;
* centralized logging;
* monitoring platforms.

Such integrations should use authenticated service identities, least-privilege permissions, timeouts, bounded retries, idempotency, audit logging, and fail-closed behavior.

## Capstone Deliverables

The complete design documentation is provided in `Deliverables.md`.

It covers:

1. Architecture Diagram
2. Agent Workflow Design
3. Deployment Strategy
4. Security Model
5. Monitoring Dashboard Design

The project prompt and design requirements are documented in `Prompt.md`.

---

**AEGISDESK — Agentic IT Support Demonstrator**
**2023103565 — R. Harsanth**
