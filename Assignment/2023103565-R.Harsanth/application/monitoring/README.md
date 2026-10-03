# Monitoring and observability

The built-in `/api/dashboard` and `/metrics` endpoints provide a compact local view of request volume, resolution rate, pending approvals, average latency, recent requests, and audit events. `/health` and `/ready` support liveness/readiness checks.

For production, instrument FastAPI and each orchestration/tool stage with OpenTelemetry. Emit request count, workflow duration, retrieval hit rate, tool success/failure, approval queue age, blocked-action count, and cost/token metrics if an LLM is enabled. Redact user text and secrets from logs. Route alerts to on-call based on sustained SLO breaches. Suggested initial SLOs: 99.9% monthly API availability, p95 response under 3 seconds for synchronous demo-like workflows, and no protected action executed without an approval record.
