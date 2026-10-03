# Capstone Deliverables — AgentOps Console

**Author:** Shree Vekka Narayanee K  
**Roll No:** 2023103620  
**Application:** AgentOps Console — Mission Console  
**Deployed Link:** https://picture-perfect-render-61.lovable.app  
**Course:** Scalable Enterprise Architectural Deployments of Agentic AI Solutions

---

## 1. Architecture Diagram

### System Overview
AgentOps Console is a React single-page application styled as a Space Mission Control interface. It provides a unified enterprise dashboard for monitoring, orchestrating, and securing AI agents deployed across distributed environments.

### Layers & Components

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│     React + TypeScript SPA  |  Vite Build Tool       │
├──────────────────────────────────────────────────────┤
│                  PRESENTATION LAYER                  │
│  Space-themed UI  |  Orbitron Font  |  Star Field BG │
│  Recharts (line/area)  |  Tailwind CSS Design Tokens │
├──────────────────────────────────────────────────────┤
│                  COMPONENT LAYER                     │
│  Sidebar Nav      │  KPI Instrument Cards            │
│  Kanban Board     │  Orbital Events Feed             │
│  Agent Table      │  Log Viewer + Search             │
│  Deployment Timeline  │  Security Event Table        │
├──────────────────────────────────────────────────────┤
│                    DATA LAYER                        │
│     Static TypeScript mock data fixtures             │
│     Simulated real-time log + event streaming        │
├──────────────────────────────────────────────────────┤
│                 DEPLOYMENT LAYER                     │
│        Lovable CDN  —  Global Edge Network           │
│     HTTPS  |  picture-perfect-render-61.lovable.app  │
└──────────────────────────────────────────────────────┘
```

### Pages & Trust Boundaries

| Page | Access Level | Function |
|---|---|---|
| Overview | All users | Fleet-wide KPIs, 7-day activity chart, Orbital events feed |
| Agents | Operator+ | Agent registry, status monitoring, uptime tracking |
| Workflows | Operator+ | Kanban task orchestration (Queued → Running → Review → Done) |
| Security | Admin only | Auth events, severity-tagged alerts, open incident table |
| Deployments | DevOps+ | Rocket-sequence pipeline (Dev → Staging → Canary → Production) |
| Logs & Traces | Operator+ | Full-text searchable, color-coded by severity level |

### Integrations
- **Recharts** — time-series line chart with Tasks and Errors overlay
- **React Router v6** — client-side navigation between all 6 pages
- **Tailwind CSS** — design token system, dark/space theme
- **Google Fonts** — Orbitron + Space Mono for mission-control typography

---

## 2. Agent Workflow Design

### Defined Agent Roles

| Agent Type | Role |
|---|---|
| **Orchestrator Agent** | Routes incoming tasks to appropriate sub-agents, manages queue priority |
| **Monitor Agent** | Continuously polls system health, surfaces signal strength and uptime |
| **Security Agent** | Detects anomalies, failed auth attempts, and policy violations |
| **Deployment Agent** | Controls environment promotion across Dev → Staging → Canary → Production |
| **Log Collector Agent** | Aggregates logs from all services, applies INFO/WARN/ERROR/DEBUG tagging |

### Agent State Machine

```
  IDLE
   │
   ▼
 QUEUED ──────────────────────────────────┐
   │                                      │
   ▼                                      │
RUNNING                                   │
   │                                      │
   ├──► REVIEW (human approval required)  │
   │         │                            │
   │         ├──► DONE ✅                 │
   │         └──► QUEUED (rejected) ──────┘
   │
   └──► FAILED
            │
            ├──► RETRY (max 3 attempts)
            └──► DEAD (escalate alert)
```

### Tools Available to Each Agent
- HTTP health-check polling endpoints
- Log ingestion and tagging API
- Alert dispatch (webhook / in-app notification)
- Pipeline promotion trigger (CI/CD hook)
- Auth event scanner (Security Agent only)

### Handoff & Human Approval Flow
1. Orchestrator receives task → assigns to sub-agent based on type
2. Sub-agent executes → posts result to **Review** column on Workflows page
3. Human operator approves or rejects from the Kanban board
4. Approved → moves to **Done**; Rejected → returns to **Queued**

### Failure Paths
- Agent timeout → auto-retry up to 3× → escalate to Orbital Events feed as Critical
- Security violation → immediately suspend agent, raise red alert on Security page
- Deployment failure → rollback to last stable environment, notify operator

---

## 3. Deployment Strategy

### Runtime Environment
- **Platform:** Lovable CDN (static hosting, globally edge-deployed)
- **Build Tool:** Vite (React + TypeScript → optimised /dist bundle)
- **Delivery:** Static HTML/JS/CSS via HTTPS on Lovable's edge network

### Environment Pipeline (Rocket Launch Sequence)

```
  Developer Machine
        │
        ▼
    [Build]  →  npm run build  →  /dist output
        │
        ▼
  [Lovable CI]  Auto-preview on every save
        │
        ▼
  [Staging]  Internal preview URL
        │
        ▼
  [Canary]  Partial traffic rollout (10%)
        │
        ▼
  [Production]  https://picture-perfect-render-61.lovable.app  🚀
```

### Scaling Strategy
- Static SPA served from CDN edge nodes — scales automatically with zero config
- No server-side compute; all rendering is client-side React
- Future agent backends: containerised microservices (Docker + Kubernetes) with horizontal pod autoscaling

### Resilience
- CDN provides automatic failover across global edge nodes
- No single point of failure in the frontend layer
- Mock data layer is fully swappable for live API endpoints with zero UI changes

### Release Process
1. Changes made in Lovable editor
2. Click **"Publish changes"** → triggers rebuild and CDN deployment
3. Rollback: previous build artifact retained, one-click revert via Lovable version history

---

## 4. Security Model

### Identity & Authentication
- Current build: role-based UI access (Owner: Shree Vekka Narayanee K via Lovable auth)
- Production architecture: OAuth 2.0 / OIDC (Google Workspace or Azure AD)
- JWT access tokens (15-min expiry) + 7-day refresh tokens
- Session invalidation on suspicious activity detected by Security Agent

### Authorization — RBAC Matrix

| Role | Overview | Agents | Workflows | Security | Deployments | Logs |
|---|---|---|---|---|---|---|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Operator** | ✅ | ✅ | ✅ | View only | View only | ✅ |
| **Viewer** | ✅ | View only | View only | ❌ | ❌ | View only |

### Secrets Management
- API keys and tokens stored as environment variables — never in source code
- Lovable Build Secrets panel for any sensitive configuration
- No credentials committed to GitHub repository

### Privacy & Data Handling
- All data in current build is mock/static — zero PII collected
- Production: data encrypted in transit (TLS 1.3) and at rest (AES-256)
- Log data anonymised before long-term storage

### Guardrails
- All agent actions in production require human approval before promotion (Workflows Kanban)
- Security page surfaces all failed auth events with Critical/High/Medium/Low severity badges
- Rate limiting enforced at API gateway level
- Signal Strength indicator (sidebar) shows real-time system health — drops below 90% triggers alert

### Audit Trail
- All agent state transitions logged with: timestamp, agent ID, operator ID, action
- Security events retained for minimum 90 days
- Immutable append-only log format — visible on Logs & Traces page

---

## 5. Monitoring Dashboard Design

### Health Metrics — Overview KPI Cards

| Metric | Current Value | Alert Threshold |
|---|---|---|
| **Total Agents** | 48 (+3 this week) | — |
| **Active Workflows** | 126 (+12% vs last week) | — |
| **Security Alerts** | 7 (2 critical) | > 0 Critical |
| **Avg Response Time** | 842ms (−6% vs last week) | > 2000ms |

### Time-Series Visualization
- 7-day **Agent Activity** line chart (Recharts LineChart)
- Dual-line overlay: Tasks completed per day + Error count
- Blue → Cyan → Green gradient color scheme matching space theme
- Tooltip shows exact values on hover (e.g. Sep 25: Tasks 8120, Errors 92)

### Orbital Events Feed
- Real-time timestamped event stream on Overview page
- Color-coded dots: Red = failure, Green = healthy, Orange = warning, Blue = info
- Examples: agent crashes, workflow state changes, canary health, rate limit warnings

### Trace & Log Quality (Logs & Traces Page)
- Full-text search bar across all log entries
- Filter dropdown: DEBUG / INFO / WARN / ERROR
- Color-coded severity for instant visual parsing
- Production: OpenTelemetry integration for distributed tracing across all agents

### Signal Strength Indicator
- Persistent sidebar widget showing fleet health at 98.4%
- Drops below 90% → amber warning; below 75% → red critical alert

### Safety & Cost Signals
- Failed agent count surfaced as red badge on Overview
- Deployment page shows per-environment health (green/yellow/red dot per stage)
- Production: cost-per-agent-run tracked as additional KPI card

### Business Outcome Metrics
- Workflow completion rate (Done vs Failed ratio from Kanban)
- Mean Time to Recovery (MTTR) for failed agents
- Deployment success rate across all pipeline stages
- Security incident resolution time (time from alert to closure)

### Alerting Strategy
- Critical security events → immediate in-app Orbital Event + webhook dispatch
- Agent failure after 3 retries → escalation notification to operator
- Production latency spike → auto-scale trigger + on-call alert

---

*Submitted for Capstone — Scalable Enterprise Architectural Deployments of Agentic AI Solutions*  
*Anna University, Chennai — B.E. Computer Science*
