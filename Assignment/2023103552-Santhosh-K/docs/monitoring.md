# Monitoring Dashboard Design

The dashboard reads live ticket and audit data from the service. Its purpose is operational control—not just reporting.

| Group | Metrics | Owner/action |
|---|---|---|
| Service health | API availability, p50/p95 latency, 4xx/5xx rate | SRE investigates regressions |
| Workflow health | started/completed/terminal status counts, duration, retries | Engineering identifies bottlenecks |
| Tool health | lookup success rate, timeout count, dependency latency | Integration owner fixes degraded systems |
| Quality | resolution rate, escalation rate, missing-evidence rate | Support/product improves policies and UX |
| Governance | pending-approval count/age, approval/rejection rate | Support manager clears aged queue |
| Safety | injection escalations, denied actions, audit volume | Security reviews patterns |
| Cost | estimated tokens, model cost per ticket | Product enforces budget |

## Suggested alerts

1. API availability below 99.5% over five minutes.
2. p95 workflow duration above the established baseline for 15 minutes.
3. Tool success rate below 95% for ten minutes.
4. Oldest pending approval exceeds the support SLA (for example, 30 minutes).
5. Injection-related escalation rate exceeds a normal threshold.
6. Daily estimated model cost exceeds the approved budget.

## Trace correlation

In production every API request, agent run, tool call, and audit entry should share a `trace_id` and `ticket_id`. Emit OpenTelemetry spans around tools and agent nodes, send JSON logs to a central store, expose Prometheus-compatible metrics, and build Grafana panels from the metrics above. Never place raw sensitive customer messages in metric labels.
