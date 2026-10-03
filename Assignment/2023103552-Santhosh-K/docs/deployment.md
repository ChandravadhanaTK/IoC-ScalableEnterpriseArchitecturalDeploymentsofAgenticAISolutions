# Deployment Strategy

## Local delivery

`docker compose up --build` runs the following services:

| Service | Port | Purpose |
|---|---:|---|
| `frontend` | 5173 | React/Vite interface |
| `backend` | 8000 | FastAPI, orchestration, health API |
| `postgres` | 5432 | Persistent operational store |

The database health check blocks backend startup until PostgreSQL is accepting connections. The backend also provides `/api/health` for container orchestration.

## Production path

![Rendered ResolveAI deployment diagram](assets/deployment-diagram.svg)

Deploy the API statelessly with horizontal autoscaling. Send investigations that may call slow external systems to workers, using a durable queue and an idempotency key per ticket transition. Run database migrations as an isolated pre-deployment job. Store secrets in a cloud secret manager and inject them at runtime. Use TLS termination, WAF/rate limits, separate dev/test/staging/prod projects, point-in-time database recovery, and a rollbackable canary release.

## Scaling and resilience targets

- Scale API replicas on CPU, p95 latency, and concurrent requests.
- Scale workers on queue depth and oldest-message age.
- Make ticket transitions idempotent; use an outbox for ticket/audit events.
- Set strict connection pools, tool deadlines, and circuit breakers.
- Alert on health failure, rising 5xx rate, queue age, and approval backlog.
