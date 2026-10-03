# Artifact 5: Monitoring Dashboard Design & Observability Architecture

## 1. Enterprise Observability Strategy
NextStep incorporates **Full-Spectrum Observability** across six core dimensions: **System Health**, **Distributed Traces**, **Educational Quality**, **AI Safety**, **Inference Cost Accounting**, and **Student Business Outcomes**. Observability is surfaced natively via the Admin Portal (`/admin/monitoring`), OpenTelemetry-compatible telemetry hooks, and structured event streaming.

```
+===================================================================================+
|                     ENTERPRISE OBSERVABILITY COCKPIT                              |
+===================================================================================+
|  [1] SYSTEM HEALTH         |  [2] EXECUTION TRACE       |  [3] QUALITY METRICS    |
|  - Uptime: 99.98%          |  - LangGraph State machine |  - Task Velocity: 3.4/d |
|  - API P95 Latency: 42ms   |  - Iteration Trace Log     |  - Completion: 78.4%    |
|  - DB Pool: 4/20 Conns     |  - Event Feed: Real-time   |  - Stuck Rate: 8.2%     |
+----------------------------+----------------------------+-------------------------+
|  [4] AI SAFETY             |  [5] COST ACCOUNTING       |  [6] LEARNER OUTCOMES   |
|  - 403 Access Violations: 0|  - Avg Tokens/Plan: 820    |  - Time to 1st Task: 4m |
|  - Injection Blocks: 100%  |  - Cost/Goal: $0.0012      |  - 7-Day Retention: 86% |
|  - Active User Audits: Live|  - Mock Fallback Rate: 0%  |  - Goal Mastery: High   |
+===================================================================================+
```

---

## 2. Six Operational Telemetry Pillars

### Pillar 1: System Health & Infrastructure Telemetry
- **API Availability**: Monitored via `GET /api/health` with sub-10ms response times.
- **ASGI Event Loop Latency**: Monitoring event loop lag using Starlette middleware.
- **Database Connection Pool**: Tracking active, overflow, and recycled connections to eliminate database starvation.

### Pillar 2: Agent Execution & Distributed Traces
- **State Transition Tracing**: Every LangGraph node execution (`analyze_goal` $\to$ `create_plan` $\to$ `select_next_task` $\to$ `observe_completion` $\to$ `analyze_stuck`) records an immutable `AgentEvent` in the database.
- **Event Schema**:
  ```json
  {
    "id": "evt_7d8e9f...",
    "goal_id": "goal_3a2b1c...",
    "event_type": "task_completed",
    "data": {
      "task_id": "task_4f5e6d...",
      "task_title": "Setup MongoDB with Mongoose",
      "student_reflection": "Connected locally with URI string",
      "progress_delta": "+12.5%"
    },
    "created_at": "2026-10-03T18:30:00Z"
  }
  ```
- **Real-Time Stream**: Surfaced in the UI via the **Agent Activity Stream** (`/activity`), providing students and instructors full auditability of agent reasoning.

### Pillar 3: Educational Quality & Student Momentum
- **Task Completion Velocity**: Average number of micro-tasks completed per active session.
- **Stuck Ratio & Bottleneck Identification**: Tracks which specific tasks generate the highest percentage of "I'm Stuck" invocations, alerting course designers to ambiguous instructions.
- **Abandonment Detection**: Identifies goals where no student action occurred in >7 days to trigger automated re-engagement nudges.

### Pillar 4: AI Safety & Governance Guardrails
- **RBAC Violation Rate**: Real-time counter of non-admin accounts attempting access to `/api/admin/*` (triggers automatic security alert).
- **Prompt Sanitization Audits**: Tracking requests that trigger regex/fence sanitation filters.
- **Account Status Enforcement**: Immediate revocation of JWT validity when an administrator sets `is_active = False` in the user management panel.

### Pillar 5: Inference Cost & Provider Accounting
- **Token Efficiency**: Deconstructing input tokens, output tokens, and reasoning tokens per plan generation.
- **Cost Allocation**: Tracking LLM expenditures per student:
  $$\text{Cost per Goal} = (\text{Tokens}_{\text{in}} \times \$0.15/\text{1M}) + (\text{Tokens}_{\text{out}} \times \$0.60/\text{1M})$$
- **Cache Optimization**: In-memory and deterministic fallbacks ensure free tier and demo resilience without unexpected cloud charges.

### Pillar 6: Business Outcomes & Educational Impact
- **Time to First Action (TTFA)**: Time elapsed between student signup and completing Task #1 (Target: < 5 minutes).
- **Active Goal Completion Rate**: Percentage of initiated goals that reach 100% completion (Target: > 70%, versus industry MOOC averages of 12%).
- **Multi-Goal Trajectory**: Number of subsequent goals started immediately after milestone completion, facilitated by NextStep's seamless next goal transition engine.

---

## 3. Administrator Dashboard Interface Implementation

Surfaced directly at `/admin/monitoring` in the NextStep React application:
- **KPI Summary Cards**: Total registered users, active vs completed goals, system completion velocity, total agent events.
- **Live Event Feed**: Real-time stream of latest agent actions across the student body.
- **User Management Portal (`/admin/users`)**: Searchable user directory with instant toggle button to activate or disable student access.
- **Global Goals Audit (`/admin/goals`)**: System-wide view of learning tracks across all enrolled students.
- **Security Audit Logs Table**: Real-time tabular stream of security actions and IP metadata.
