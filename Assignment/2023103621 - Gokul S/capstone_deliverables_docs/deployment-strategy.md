# PULSE Deployment Strategy

## Current Deployment Shape

The checked-in Docker Compose setup defines three services:

1. `web`: builds the Vite app and serves its static output with Nginx.
2. `api`: runs the Express app and Prisma Client.
3. `db`: PostgreSQL with a named `postgres_data` volume.

The web service is the only public port in the Compose topology. Nginx proxies `/api/*` to the API service and removes the `/api` prefix; browser and API therefore use one origin in this deployment. PostgreSQL and the API have health checks, and service startup dependencies wait for healthy upstreams.

**Configured:** Dockerfiles, Nginx config, Compose health checks, persistent database volume, environment examples, and README setup instructions are checked in.

**Unverified:** No public host, domain, or running remote environment is configured here. The Docker engine was unavailable when this document set was prepared, so actual image builds and container startup were not verified. Frontend/API source builds and Compose configuration parsing passed.

## Local Demo with Docker Compose

1. Create or merge the root `.env` using `.env.example`; do not overwrite an existing file or existing secrets.
2. Set a strong URL-safe `POSTGRES_PASSWORD` and a long random `JWT_SECRET`. Set `GEMINI_API_KEY` on the server environment to enable AI replies. Keep all secrets out of source control.
3. Start the stack:

```bash
docker compose up --build -d
```

4. Seed an empty demo database once:

```bash
docker compose exec api npm run db:seed
```

The current seed script deletes and recreates database records. Run it only on an empty demo database; rerunning it destroys user-created data.

5. Browse to `http://localhost:8080`. Check `http://localhost:8080/api/health` only if the proxy is intentionally configured to expose that path; otherwise check the API health endpoint from the API container/network at `/health`.

## Startup, Schema, and Release

The API container runs `npx prisma db push` before starting the Node server. This creates/synchronizes the schema for an MVP and is not a reviewed, versioned migration workflow. No migration history is checked in. Before production data matters, introduce Prisma migrations, review them in CI, and run `prisma migrate deploy` as a controlled release step instead of applying `db push` on each start.

The database volume persists across container replacement. `docker compose down` preserves named volumes by default; `docker compose down -v` removes the database volume and should be treated as destructive. Back up important data before schema changes or teardown.

Recommended release sequence:

1. Build and run API/frontend checks.
2. Validate Compose configuration and build images.
3. Apply a reviewed schema change to a staging database.
4. Start the API and web service; verify health and sign-in.
5. Run a workout create/read flow and one coach request.
6. Promote the tested image/config to production; keep the previous image available for rollback.
7. Confirm PostgreSQL backup/restore and secret rotation procedures.

Items 3-7 are recommendations, not existing CI/release automation.

## Environment Configuration

| Variable | Where used | Notes |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | PostgreSQL and Compose API connection string | Use a URL-safe password or URL-encode special characters |
| `DATABASE_URL` | API/Prisma | Assembled by Compose; use the host-specific URL for separate API hosting |
| `JWT_SECRET` | API | Compose requires it; source code currently has a hard-coded fallback, which should be removed before public production |
| `CLIENT_URL` | API CORS | Set to the exact browser frontend origin |
| `COOKIE_SECURE` | API auth cookies | `true` for public HTTPS |
| `COOKIE_SAME_SITE` | API auth cookies | `lax` for same-site; `none` requires HTTPS and `COOKIE_SECURE=true` |
| `VITE_API_BASE_URL` | Frontend build | `/api` with same-origin Nginx; API HTTPS origin without `/api` for separately hosted frontend |
| `GEMINI_API_KEY` | API only | Never use a `VITE_` name or put this in the browser bundle |
| `GEMINI_MODEL` | API only | Defaults to `gemini-3.5-flash-lite` |
| `WEB_PORT` | Compose | Public host port for Nginx |

For a public VPS deployment, terminate HTTPS at a reverse proxy/load balancer and forward to the web service. Set `CLIENT_URL` to the public origin and secure cookie settings before exposing the site.

## Temporary Free Demo Host

Render can host a split version of this app as a static site, web service, and PostgreSQL database, but it does not deploy this Compose file as one service. The frontend and API become separate origins, so configure `VITE_API_BASE_URL` at frontend build time, set API `CLIENT_URL` to the exact static-site origin, and use `COOKIE_SAME_SITE=none` plus `COOKIE_SECURE=true` for cross-site cookies.

As of the provider documentation checked on 2026-10-01, Render free web services spin down after 15 minutes without traffic and can take about a minute to wake. Free PostgreSQL is limited to 1 GB and expires after 30 days. This can work for a brief demo but is not durable production hosting. Verify current terms before deployment:

- [Render free service limits](https://render.com/docs/free)
- [Render pricing](https://render.com/pricing)

The current repository has no Render Blueprint or platform-specific service definition. A public release still requires creating/configuring each service, setting secret values in the host dashboard, initializing the database, and verifying the live domain.
