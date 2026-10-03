"""Client for the business API with the resilience controls from Module 5:
timeout, bounded retries with backoff and jitter, and a circuit breaker.

When BUSINESS_API_URL is the literal "inprocess" the client mounts the API in
the same process through an ASGI transport. That keeps the CLI and tests to a
single process; in Kubernetes the two run as separate Deployments.
"""
from __future__ import annotations

import random
import time
from dataclasses import dataclass, field

import httpx

from ..config import settings
from ..telemetry import get_logger, log, trace_id

logger = get_logger("business_client")


class BusinessApiError(RuntimeError):
    pass


@dataclass
class CircuitBreaker:
    failure_threshold: int = 3
    reset_seconds: float = 30.0
    failures: int = 0
    opened_at: float | None = field(default=None)

    def allow(self) -> bool:
        if self.opened_at is None:
            return True
        if time.monotonic() - self.opened_at > self.reset_seconds:
            self.opened_at = None      # half-open: let one call through; a failure re-opens at once
            self.failures = self.failure_threshold - 1
            return True
        return False

    def record(self, ok: bool) -> None:
        if ok:
            self.failures = 0
            self.opened_at = None
        else:
            self.failures += 1
            if self.failures >= self.failure_threshold:
                self.opened_at = time.monotonic()


_breaker = CircuitBreaker()


def _client() -> httpx.Client:
    if settings.business_api_url == "inprocess":
        # Starlette's TestClient is a synchronous httpx client over ASGI.
        from fastapi.testclient import TestClient
        from .business_api import app
        return TestClient(app, base_url="http://business", raise_server_exceptions=False)
    return httpx.Client(base_url=settings.business_api_url, timeout=10)


def create_reroute(shipment_id: str, new_carrier_code: str, reason_code: str,
                   requested_by: str, approved_by: str, approver_role: str, idempotency_key: str,
                   approval_thread_id: str = "") -> dict:
    """POST a re-route. Safe to retry because the server keys on the idempotency key."""
    if not _breaker.allow():
        raise BusinessApiError("circuit open: business API marked unhealthy")
    headers = {
        "Authorization": f"Bearer {settings.business_api_token}",
        "Idempotency-Key": idempotency_key,
        "X-Trace-Id": trace_id(),
    }
    body = {"shipment_id": shipment_id, "new_carrier_code": new_carrier_code, "reason_code": reason_code,
            "requested_by": requested_by, "approved_by": approved_by, "approver_role": approver_role,
            "approval_thread_id": approval_thread_id}
    last: Exception | None = None
    for attempt in range(3):
        try:
            with _client() as c:
                r = c.post("/reroutes", json=body, headers=headers)
            if r.status_code >= 500:
                raise BusinessApiError(f"server error {r.status_code}")
            if r.status_code >= 400:
                _breaker.record(True)   # a 4xx is our fault, not the dependency's
                try:
                    detail = r.json().get("detail", r.text)
                except ValueError:
                    detail = r.text
                raise BusinessApiError(f"{r.status_code}: {detail}")
            _breaker.record(True)
            return r.json()
        except (httpx.TransportError, BusinessApiError) as e:
            if isinstance(e, BusinessApiError) and not str(e).startswith("server error"):
                raise
            last = e
            _breaker.record(False)
            delay = (0.2 * 2 ** attempt) + random.uniform(0, 0.2)
            log(logger, "business api retry", attempt=attempt + 1, delay=round(delay, 2), error=str(e))
            time.sleep(delay)
    raise BusinessApiError(f"business API unavailable after retries: {last}")
