"""Lightweight tracing compatible in shape with OpenTelemetry spans.

Every agent run gets a trace_id; each node, LLM call and tool call is a span
with timing, status and attributes. Traces are persisted for the UI timeline
and can be exported to an OTLP collector (Jaeger/Tempo) by swapping `Tracer`.
"""
from __future__ import annotations

import json
import logging
import time
import uuid
from contextlib import contextmanager


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {"ts": round(record.created, 3), "level": record.levelname, "logger": record.name,
                   "msg": record.getMessage()}
        for attr in ("trace_id", "ticket_id", "node", "user"):
            if hasattr(record, attr):
                payload[attr] = getattr(record, attr)
        return json.dumps(payload)


def configure_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)


class Tracer:
    def __init__(self, trace_id: str | None = None):
        self.trace_id = trace_id or uuid.uuid4().hex[:16]
        self.spans: list[dict] = []
        self._t0 = time.perf_counter()

    @contextmanager
    def span(self, name: str, kind: str = "internal", **attrs):
        start = time.perf_counter()
        rec = {"name": name, "kind": kind, "start_ms": round((start - self._t0) * 1000, 2),
               "attrs": dict(attrs), "status": "ok"}
        try:
            yield rec["attrs"]
        except Exception as exc:
            rec["status"] = "error"
            rec["attrs"]["error"] = str(exc)[:300]
            raise
        finally:
            rec["duration_ms"] = round((time.perf_counter() - start) * 1000, 2)
            self.spans.append(rec)

    @property
    def total_ms(self) -> float:
        return round((time.perf_counter() - self._t0) * 1000, 2)
