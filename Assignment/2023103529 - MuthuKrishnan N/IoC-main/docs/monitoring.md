# Enterprise Monitoring, Telemetry & Observability Architecture

## 1. Overview
The platform features an integrated **Observability Engine** that tracks operational performance, agent reasoning latencies, tool execution success rates, business resolutions, AI cost estimations, and security events.

---

## 2. Telemetry Dimensions

### 2.1 Operational Metrics
- **Total Ingested Complaints:** Aggregate count of complaints processed through the platform.
- **Workflow State Distribution:** Real-time counts of complaints in `RECEIVED`, `CLASSIFYING`, `ANALYZING`, `AWAITING_APPROVAL`, `RESOLVED`, `ESCALATED`, and `FAILED`.
- **System Availability & Latency:** Gateway p95 response time and error rate.

### 2.2 Agentic AI Metrics
- **Agent Execution Count:** Total number of agent invocations categorized by agent type:
  - `SupervisorAgent`
  - `IntentAgent`
  - `OrderAgent`
  - `PolicyAgent`
  - `ResolutionAgent`
  - `ActionAgent`
- **Agent Success vs. Failure Rate:** Percentage of agent steps completed without exception.
- **Average Duration per Agent:** Millisecond latency breakdown per agent in the pipeline.
- **Tool Calls Executed:** Total tool calls dispatched vs. blocked.
- **RAG Retrieval Precision:** Number of policy retrievals and average chunk similarity scores.

### 2.3 Business Outcomes & Human-in-the-Loop Metrics
- **Autonomous Resolution Rate:** Percentage of complaints successfully resolved without human intervention ($\frac{\text{Auto-Resolved}}{\text{Total Resolved}}$).
- **Human Escalation Rate:** Percentage of complaints requiring manual intervention ($\frac{\text{Escalated}}{\text{Total Received}}$).
- **Dispute Type Breakdown:** Volume of Refunds vs. Replacements vs. Status updates vs. Tickets.
- **Mean Time to Resolution (MTTR):** Average elapsed time from complaint submission to final status (`RESOLVED`).

### 2.4 Safety, Security & Compliance Metrics
- **Authentication Failures:** Count of invalid credentials or expired JWTs.
- **Unauthorized Data Access Attempts:** Blocked attempts by customers to access cross-tenant orders.
- **Prompt Injection Attempts Blocked:** Flagged adversarial prompts intercepted by guardrails.
- **Sensitive Operations Gate Count:** Financial requests exceeding ₹5,000 threshold routed for human sign-off.

### 2.5 Cost & Token Metrics
- **Token Telemetry:** Aggregated `input_tokens` and `output_tokens` across LLM calls.
- **Estimated Cost:** Computed using standard blended pricing (or simulated demo values when running in offline/demo mode):
  $$\text{Cost} = (\text{Input Tokens} \times \$0.000005) + (\text{Output Tokens} \times \$0.000015)$$

---

## 3. Observability REST API Endpoints

- `GET /api/admin/metrics`: Returns consolidated KPI cards (operational, business, security, cost).
- `GET /api/admin/agent-metrics`: Returns granular agent execution counts, latencies, and tool statistics.
- `GET /api/admin/audit-logs`: Returns queryable, paginated audit records with role, action, and outcome filters.
