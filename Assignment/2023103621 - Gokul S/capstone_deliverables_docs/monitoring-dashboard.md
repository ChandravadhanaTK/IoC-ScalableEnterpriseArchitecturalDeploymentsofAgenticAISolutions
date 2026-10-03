# PULSE Monitoring Dashboard Design

## Current Observability

**Implemented:** Express exposes `GET /health` with a status and timestamp. Compose checks PostgreSQL readiness, calls the API health endpoint, and checks that the web container responds. The API writes basic console errors for provider failures.

**Not implemented:** There is no metrics endpoint/exporter, distributed tracing, centralized structured log system, dashboard, alert rules, Gemini token/cost accounting, or product analytics pipeline in the repository. The dashboard below is a design, not an existing dashboard.

## Dashboard Layout

### 1. Service Health

- Web container availability and Nginx response status.
- API `/health` success rate and restart count.
- PostgreSQL readiness, active connections, and storage utilization.
- Deployment version, environment, and last successful deploy.

Recommended metrics:

- `pulse_web_requests_total{status_class}`
- `pulse_api_requests_total{route,method,status_class}`
- `pulse_api_request_duration_seconds{route}` histogram
- `pulse_db_connections{state}`
- `pulse_db_storage_bytes`
- `pulse_service_health{service}` gauge

Avoid raw user IDs as metric labels; they create high-cardinality and privacy risk.

### 2. API Reliability

Show request volume, error rate, p50/p95 latency, top failing routes, authentication failures, `429` rate-limit responses, and API process restarts. Track routes by normalized template such as `/workouts/:id`, not concrete IDs.

Suggested initial alerts (tune after observing demo traffic):

- API health fails for 3 consecutive checks.
- API `5xx` rate exceeds 5% for 5 minutes.
- p95 API latency exceeds 2 seconds for 10 minutes.
- PostgreSQL readiness fails for 2 consecutive checks.

These thresholds are recommendations, not configured alerts.

### 3. Gemini Coach

Track:

- `pulse_coach_requests_total{result}` where result is `success`, `invalid_input`, `unauthorized`, `rate_limited`, `missing_key`, `provider_error`, or `empty_reply`.
- `pulse_coach_provider_duration_seconds` histogram.
- `pulse_coach_provider_status_total{status_class}`.
- `pulse_coach_output_tokens_total` and input token estimates only if Gemini returns usage metadata and the route is updated to read it.
- Estimated spend by model/day only when reliable provider usage and pricing data are available.

Do not label metrics or traces with prompts, completions, emails, JWTs, API keys, or workout notes. If quality/safety review is added, prefer opt-in, redacted samples with short retention and access control.

Suggested alerts:

- `GEMINI_API_KEY` absent at startup/config check.
- Provider `429`/`5xx` rate exceeds a chosen threshold for 5 minutes.
- Coach success rate drops below 90% across a meaningful sample.
- Requests are being throttled unusually often or daily free-tier quota is near exhaustion.

The current API only logs the provider status and returns a generic `502`; it does not expose the dimensions above.

### 4. Product Outcomes

Potential aggregate counters:

- successful sign-ins and demo logins;
- workouts created and completed;
- history/calendar read success;
- coach conversations completed and user retries;
- demo session completion rate.

Collect only what is necessary. Do not add user-level analytics without appropriate disclosure, consent, and a retention policy. These events are not currently instrumented.

### 5. Safety and Privacy

If safety instrumentation is introduced, use coarse categories such as `medical_redirect`, `out_of_scope`, `normal_training`, and `provider_failure`; do not retain raw medical prompts by default. The current app has no separate safety classifier or safety event metric. Model-generated outputs should not be treated as verified clinical advice.

## Trace Design

Recommended trace spans:

1. `http.server` request with route template and status.
2. `auth.verify` outcome only (never token contents).
3. `db.query` operation name and duration, without SQL parameters containing personal data.
4. `gemini.generate_content` model name, duration, status, and provider request ID if available.

Propagate a request ID from Nginx/API to logs and provider metadata where supported. Never propagate secrets or raw messages as span attributes.

## Operations Runbook

| Symptom | First checks | Safe action |
|---|---|---|
| Web unavailable | Web health check, Nginx container logs, upstream API status | Restart/redeploy only after checking the cause; retain database volume |
| API unhealthy | `/health`, API startup logs, `DATABASE_URL` presence, PostgreSQL readiness | Correct env/connectivity; do not print secrets in logs |
| Database unavailable | Postgres health check, connection count, storage, host service status | Restore from verified backup if data loss occurred; never run the destructive seed as a repair step |
| Coach returns generic error | API provider status log, model setting, key configured, provider quota/status | Retry transient provider errors; rotate key if exposed; keep key on API only |
| `429` responses | Auth or coach limiter metrics and provider quotas | Wait for window reset; do not disable rate limits for a public demo |

## Implementation Plan

For an MVP, add structured API request logs with a generated request ID, an OpenTelemetry-compatible metrics exporter, and provider status/latency counters first. Add dashboards and alert routes only after selecting a hosting/monitoring provider. Keep privacy-safe labels and retention defaults documented before enabling data collection.
