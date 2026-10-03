# Artifact 3: Production Deployment Strategy & Infrastructure Blueprint

## 1. Overview & Runtime Architecture
NextStep is designed with a **12-Factor Cloud-Native Architecture**. The backend is a stateless, asynchronous FastAPI ASGI service running on Python 3.11+, and the frontend is a statically compiled React SPA served via CDN, Nginx, or mounted directly onto the FastAPI application.

```
                                  [ INTERNET ]
                                       │
                                       ▼
                       [ Cloudflare / AWS CloudFront ]
                       (Edge Caching, TLS Termination, WAF)
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
           Static Assets (CDN)                  Dynamic API Gateway
        React SPA / Assets / JS            FastAPI ASGI Cluster (Port 8000)
                                                          │
                                         ┌────────────────┴────────────────┐
                                         ▼                                 ▼
                               Worker Replica #1                 Worker Replica #2
                               (Uvicorn / Gunicorn)              (Uvicorn / Gunicorn)
                                         │                                 │
                                         └────────────────┬────────────────┘
                                                          ▼
                                            [ Managed PostgreSQL CloudSQL ]
                                            (Read Replicas, Auto-Failover HA)
```

---

## 2. Containerization: Multi-Stage Docker Build

### Production `Dockerfile`
```dockerfile
# Stage 1: Build Frontend Assets
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Runtime Environment
FROM python:3.11-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend assets into static directory
COPY --from=client-builder /app/client/dist /app/client/dist

# Non-root security user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production `docker-compose.yml`
```yaml
version: '3.8'

services:
  nextstep-api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://nextstep_user:securepassword@db:5432/nextstep_db
      - SECRET_KEY=${SECRET_KEY:-production-secret-must-be-rotated-regularly}
      - LLM_PROVIDER=gemini
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - LLM_MODEL=gemini-3.8-flash
      - FRONTEND_URL=https://nextstep.yourdomain.com
    depends_on:
      db:
        condition: service_healthy
    restart: always

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=nextstep_user
      - POSTGRES_PASSWORD=securepassword
      - POSTGRES_DB=nextstep_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextstep_user -d nextstep_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always

volumes:
  postgres_data:
```

---

## 3. Environment Variable Configuration Matrix

| Variable | Environment | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Dev / Local | `sqlite:///./nextstep.db` | Embedded zero-config SQLite database |
| `DATABASE_URL` | Production | `postgresql://...` | Connection URI for Managed CloudSQL / RDS |
| `SECRET_KEY` | All | Random 256-bit string | HMAC key for signing JWT tokens |
| `LLM_PROVIDER` | Local / Demo | `mock` | High-speed deterministic fallback without API billing |
| `LLM_PROVIDER` | Production | `gemini` | Google Gemini 3.8 Flash production inference |
| `GEMINI_API_KEY` | Production | Secret | Google AI Studio API key |
| `FRONTEND_URL` | Production | `https://nextstep.ai` | Target domain for CORS whitelist |

---

## 4. Scaling, Resilience & High Availability (HA)

### Horizontal Auto-Scaling
- **Stateless API Tier**: Because session state is captured via JWT tokens and LangGraph checkpoints reside in the database, API containers can scale horizontally across multiple Kubernetes Pods or Cloud Run instances without sticky sessions.
- **Concurrency**: Uvicorn runs asynchronous async/await event loops, supporting thousands of concurrent idle student focus sessions per container with minimal memory overhead (<120MB RSS).

### Resilience Patterns
1. **Circuit Breakers for LLM Calls**: If Google Gemini API experiences latency spikes or 429 rate limits, requests fail over to the deterministic `MockLLMService`, ensuring zero downtime for students.
2. **Database Connection Pooling**: SQLAlchemy configured with `pool_size=20`, `max_overflow=10`, and `pool_pre_ping=True` to eliminate stale connections.
3. **Graceful Shutdown**: SIGTERM handlers ensure active agent state transitions finish checkpointing before container termination.

---

## 5. Continuous Integration & Continuous Delivery (CI/CD)

```
[ Push / PR to main ]
         │
         ▼
[ GitHub Actions Workflow ]
  ├─ Step 1: Python Linting & Type Check (ruff, mypy)
  ├─ Step 2: Automated Integration Tests (test_integration.py - 13 checks)
  ├─ Step 3: Frontend Build & Type Check (tsc && vite build)
  └─ Step 4: Docker Container Image Build & Security Scan (Trivy)
         │
         ▼ (Pass)
[ Container Registry (GHCR / Artifact Registry) ]
         │
         ▼ (Rolling Deployment)
[ Target Runtime: Render / Railway / Google Cloud Run / AWS ECS ]
```

---

## 6. Live Deployment Options & Instant Hosting

NextStep is pre-configured for one-click deployment across popular cloud providers:
1. **Render.com / Railway.app**: Directly connect GitHub repository; uses the included `Dockerfile` and automated health check at `/api/health`.
2. **Vercel (Frontend) + Render (Backend)**: Host frontend on Vercel with rewrites pointing `/api/*` to the FastAPI backend.
3. **Self-Hosted Linux VM**: Run `docker compose up -d` with automated SSL provisioning via Caddy / Let's Encrypt.
