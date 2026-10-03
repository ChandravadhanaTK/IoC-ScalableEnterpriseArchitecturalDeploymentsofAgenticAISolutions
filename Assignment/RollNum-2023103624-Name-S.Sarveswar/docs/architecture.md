# STEP 6 — Create the Architecture File

Create this file inside the `docs` folder:

```text
docs/architecture.md
```

Paste this:

````markdown
# AI Financial Assistant — System Architecture

## 1. Architecture Overview

The AI Financial Assistant follows a multi-agent architecture.

The major layers are:

1. Presentation Layer
2. API Layer
3. Agent Orchestration Layer
4. AI Agent Layer
5. Tool and Service Layer
6. Data Layer
7. Monitoring and Security Layer

---

## 2. High-Level Architecture

```text
                        USER
                          |
                          v
                +-------------------+
                |   React Frontend  |
                |   Web Dashboard   |
                +---------+---------+
                          |
                          v
                +-------------------+
                |    API Gateway    |
                |  Node.js/Express  |
                +---------+---------+
                          |
                          v
                +-------------------+
                | Agent Orchestrator|
                +---------+---------+
                          |
        +-----------------+-----------------+
        |                 |                 |
        v                 v                 v
+---------------+ +---------------+ +---------------+
| Transaction   | | Fraud         | | Financial     |
| Agent         | | Detection     | | Analysis      |
|               | | Agent         | | Agent         |
+-------+-------+ +-------+-------+ +-------+-------+
        |                 |                 |
        +-----------------+-----------------+
                          |
                          v
                +-------------------+
                | Report Generation  |
                | Agent              |
                +---------+---------+
                          |
                          v
                +-------------------+
                | Tools & Services  |
                +---------+---------+
                          |
             +------------+------------+
             |                         |
             v                         v
      +-------------+           +-------------+
      | MongoDB     |           | LLM API     |
      | Database    |           |             |
      +-------------+           +-------------+
````

---

## 3. Presentation Layer

### React Frontend

Responsibilities:

* User authentication
* Dashboard
* Transaction management
* Fraud alerts
* Financial analytics
* Reports
* AI assistant interface
* Notifications

---

## 4. API Layer

### Node.js + Express

Responsibilities:

* Receive requests from frontend
* Authenticate users
* Authorize requests
* Validate input
* Communicate with the agent orchestrator
* Return agent results
* Manage API errors

---

## 5. Agent Orchestration Layer

### AI Agent Orchestrator

Responsibilities:

* Receive user requests
* Determine which agent is required
* Coordinate agent execution
* Pass data between agents
* Manage agent states
* Handle failures and retries
* Return the final result

---

## 6. AI Agent Layer

### Transaction Agent

Processes and categorizes financial transactions.

### Fraud Detection Agent

Analyzes transactions and identifies potentially suspicious activity.

### Financial Analysis Agent

Analyzes financial activity and generates financial insights.

### Report Generation Agent

Combines analysis results and generates financial reports.

---

## 7. Tool and Service Layer

The agents can access controlled tools and services.

### Tools

* Transaction Data Service
* Financial Calculation Service
* Fraud Analysis Service
* Report Generation Service
* Database Service
* Notification Service

### External Service

* AI/LLM API

Agents should only access tools required for their assigned tasks.

---

## 8. Data Layer

### MongoDB

Stores:

* User profiles
* Transactions
* Fraud alerts
* Financial analysis results
* Reports
* Notifications
* Audit logs

---

## 9. Security Layer

Security controls include:

* JWT authentication
* Role-Based Access Control
* Input validation
* API authorization
* Secure secrets management
* Audit logging
* Data access restrictions

---

## 10. Monitoring Layer

The system monitors:

* API requests
* API latency
* Agent execution
* Agent failures
* Error rates
* LLM usage
* Token consumption
* Fraud detection activity
* Report generation
* Security events

---

## 11. Data Flow

```text
User
  |
  v
Frontend
  |
  v
API Gateway
  |
  v
Authentication
  |
  v
Agent Orchestrator
  |
  +--> Transaction Agent
  |
  +--> Fraud Detection Agent
  |
  +--> Financial Analysis Agent
  |
  +--> Report Generation Agent
  |
  v
Database / External AI Services
  |
  v
Final Result
  |
  v
Frontend Dashboard
```

---

## 12. Trust Boundaries

### Boundary 1 — User to Application

Authentication and authorization are required.

### Boundary 2 — Application to Agent Layer

Only authenticated and authorized requests can invoke agents.

### Boundary 3 — Agents to Tools

Agents can access only authorized tools.

### Boundary 4 — Application to External AI Service

Sensitive information must be controlled before being sent to external AI services.

### Boundary 5 — Application to Database

Database access must use authenticated and authorized connections.

---

## 13. Architectural Goal

The architecture is designed to provide:

* Modular AI agents
* Secure data access
* Independent agent responsibilities
* Controlled tool usage
* Scalable services
* Fault isolation
* Monitoring and auditing

