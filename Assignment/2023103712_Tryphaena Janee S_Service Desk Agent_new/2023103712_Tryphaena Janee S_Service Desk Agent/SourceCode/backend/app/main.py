"""HTTP API (FastAPI) - a thin adapter over `ServiceDesk`.

Cross-cutting concerns handled here:
  * authentication (Bearer JWT) and permission checks per route
  * per-user rate limiting (token bucket)
  * request IDs, security headers, CORS
  * mapping domain exceptions to HTTP status codes
  * health/readiness probes and Prometheus /metrics
"""
from __future__ import annotations

import logging
import os
import threading
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .config import settings
from .db import Store
from .monitoring.metrics import METRICS
from .monitoring.tracing import configure_logging
from .security.auth import DEMO_USERS, AuthError, PermissionDenied, Principal, issue_token, verify_token
from .service import Conflict, NotFound, ServiceDesk

configure_logging(os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("servicedesk.api")

problems = settings.validate_for_production()
if problems:
    raise RuntimeError("Refusing to start with insecure production config: " + "; ".join(problems))

store = Store(settings.db_path)
desk = ServiceDesk(store)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.seed_demo_data and not store.list_tickets(limit=1):
        from .seed import seed
        seed(desk)
        log.info("demo data seeded")
    log.info("service desk agent started (llm=%s, env=%s)", desk.llm.name, settings.app_env)
    yield


app = FastAPI(title="IT Service Desk Agent", version=settings.app_version, lifespan=lifespan,
              docs_url="/api/docs", openapi_url="/api/openapi.json")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=False,
                   allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])


# ----------------------------------------------------------------- rate limiting
class TokenBucket:
    def __init__(self, rate_per_min: int):
        self.capacity = rate_per_min
        self.refill = rate_per_min / 60.0
        self.buckets: dict[str, tuple[float, float]] = {}
        self.lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self.lock:
            tokens, last = self.buckets.get(key, (self.capacity, now))
            tokens = min(self.capacity, tokens + (now - last) * self.refill)
            ok = tokens >= 1
            self.buckets[key] = (tokens - 1 if ok else tokens, now)
            return ok


limiter = TokenBucket(settings.rate_limit_per_minute)


@app.middleware("http")
async def edge_middleware(request: Request, call_next):
    rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    t0 = time.perf_counter()
    if request.url.path.startswith("/api/") and request.method == "POST":
        key = request.headers.get("authorization", "")[-24:] or (request.client.host if request.client else "anon")
        if not limiter.allow(key):
            METRICS.inc("rate_limited_total", help="Requests rejected by rate limiter")
            return JSONResponse({"detail": "rate limit exceeded"}, status_code=429,
                                headers={"Retry-After": "10", "X-Request-ID": rid})
    response = await call_next(request)
    route = request.scope.get("route")
    path = getattr(route, "path", "unmatched")
    METRICS.inc("http_requests_total", {"path": path, "method": request.method,
                                        "status": str(response.status_code)}, help="HTTP requests")
    METRICS.observe("http_latency_ms", (time.perf_counter() - t0) * 1000, {"path": path},
                    help="HTTP latency")
    response.headers["X-Request-ID"] = rid
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = ("default-src 'self'; img-src 'self' data:; "
                                                   "style-src 'self' 'unsafe-inline'; frame-ancestors 'none'")
    if settings.app_env == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(PermissionDenied)
async def _perm(_: Request, exc: PermissionDenied):
    return JSONResponse({"detail": str(exc)}, status_code=403)


@app.exception_handler(NotFound)
async def _nf(_: Request, exc: NotFound):
    return JSONResponse({"detail": str(exc)}, status_code=404)


@app.exception_handler(Conflict)
async def _conflict(_: Request, exc: Conflict):
    return JSONResponse({"detail": str(exc)}, status_code=409)


@app.exception_handler(ValueError)
async def _bad(_: Request, exc: ValueError):
    return JSONResponse({"detail": str(exc)}, status_code=400)


# ------------------------------------------------------------------------- auth
def current_user(authorization: str = Header(default="")) -> Principal:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "missing bearer token", headers={"WWW-Authenticate": "Bearer"})
    try:
        return verify_token(authorization.split(" ", 1)[1])
    except AuthError as exc:
        raise HTTPException(401, str(exc), headers={"WWW-Authenticate": "Bearer"}) from exc


class LoginIn(BaseModel):
    username: str = Field(min_length=2, max_length=32)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    ticket_id: str | None = Field(default=None, max_length=32)


class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)


class DecisionIn(BaseModel):
    approve: bool
    reason: str = Field(default="", max_length=500)


@app.get("/api/auth/demo-users")
def demo_users():
    if not settings.demo_login_enabled:
        raise HTTPException(404, "demo login disabled")
    return [{"username": u, **{k: v for k, v in d.items() if k != "manager"}} for u, d in DEMO_USERS.items()]


@app.post("/api/auth/login")
def login(body: LoginIn):
    if not settings.demo_login_enabled:
        raise HTTPException(404, "demo login disabled - use SSO")
    try:
        token = issue_token(body.username)
    except AuthError as exc:
        raise HTTPException(401, str(exc)) from exc
    store.audit(body.username, "auth.login", None, {"method": "demo"})
    return {"access_token": token, "token_type": "bearer", "user": verify_token(token).__dict__}


@app.get("/api/me")
def me(p: Principal = Depends(current_user)):
    return {**p.__dict__, "permissions": sorted(p.permissions)}


# ------------------------------------------------------------------------- chat
@app.post("/api/chat")
def chat(body: ChatIn, p: Principal = Depends(current_user)):
    return desk.handle_message(p, body.message, body.ticket_id)


@app.get("/api/tickets")
def tickets(scope: str = "mine", p: Principal = Depends(current_user)):
    return desk.list_tickets(p, scope)


@app.get("/api/tickets/{ticket_id}")
def ticket(ticket_id: str, p: Principal = Depends(current_user)):
    return desk.get_ticket(p, ticket_id)


@app.post("/api/tickets/{ticket_id}/feedback")
def feedback(ticket_id: str, body: FeedbackIn, p: Principal = Depends(current_user)):
    desk.feedback(p, ticket_id, body.rating)
    return {"ok": True}


# -------------------------------------------------------------------- approvals
@app.get("/api/approvals")
def approvals(status: str | None = "PENDING", p: Principal = Depends(current_user)):
    return desk.list_approvals(p, None if status == "ALL" else status)


@app.post("/api/approvals/{approval_id}/decision")
def decide(approval_id: str, body: DecisionIn, p: Principal = Depends(current_user)):
    return desk.decide_approval(p, approval_id, body.approve, body.reason)


# ---------------------------------------------------------------- observability
@app.get("/api/traces/{trace_id}")
def trace(trace_id: str, p: Principal = Depends(current_user)):
    return desk.get_trace(p, trace_id)


@app.get("/api/metrics/summary")
def metrics_summary(hours: int = 24, p: Principal = Depends(current_user)):
    return desk.metrics_summary(p, max(1, min(hours, 24 * 30)))


@app.get("/api/audit")
def audit(limit: int = 200, p: Principal = Depends(current_user)):
    return desk.audit_log(p, max(1, min(limit, 1000)))


@app.get("/metrics", response_class=PlainTextResponse)
def prometheus():
    return METRICS.render_prometheus()


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/readyz")
def readyz():
    ok = store.ping()
    return JSONResponse({"status": "ready" if ok else "not_ready", "llm": desk.llm.name},
                        status_code=200 if ok else 503)


# Serve the built React app when present (single-container deployments).
_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", settings.frontend_dist))
if os.path.isdir(_dist):
    app.mount("/", StaticFiles(directory=_dist, html=True), name="ui")
