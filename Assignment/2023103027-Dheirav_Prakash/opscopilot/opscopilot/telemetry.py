"""Structured logging, trace ids and Prometheus metrics.

One trace id is minted per request and carried through every node, tool call,
event and audit row, which is what lets a dashboard answer "which step was slow"
and "what evidence led to this action" for a single request.
"""
from __future__ import annotations

import contextvars
import json
import logging
import sys
import time
import uuid
from contextlib import contextmanager

from prometheus_client import Counter, Gauge, Histogram

from .config import settings

_trace_id: contextvars.ContextVar[str] = contextvars.ContextVar("trace_id", default="-")


def new_trace_id() -> str:
    tid = uuid.uuid4().hex[:16]
    _trace_id.set(tid)
    return tid


def set_trace_id(tid: str) -> None:
    _trace_id.set(tid)


def trace_id() -> str:
    return _trace_id.get()


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "trace_id": trace_id(),
            "msg": record.getMessage(),
        }
        extra = getattr(record, "extra", None)
        if isinstance(extra, dict):
            payload.update(extra)
        return json.dumps(payload, default=str)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_JsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(settings.log_level)
        logger.propagate = False
    return logger


def log(logger: logging.Logger, msg: str, **fields) -> None:
    logger.info(msg, extra={"extra": fields})


# Metrics. Names follow the course's dashboard rows: quality, workflow,
# performance, cost.
REQUESTS = Counter("copilot_requests_total", "Requests by outcome", ["outcome"])
SPAN_SECONDS = Histogram(
    "copilot_span_seconds", "Latency per step", ["step"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 40, 80),
)
TOOL_CALLS = Counter("copilot_tool_calls_total", "Tool calls by tool and result", ["tool", "result"])
GROUNDED = Counter("copilot_groundedness_total", "Evaluator verdicts", ["verdict"])
REVISIONS = Histogram("copilot_revisions", "Evaluator revision loops per request", buckets=(0, 1, 2, 3))
LOOP_GUARD = Counter("copilot_loop_guard_trips_total", "Runs stopped by the iteration or tool budget")
APPROVALS_PENDING = Gauge("copilot_approvals_pending", "Actions waiting for a human decision")
APPROVAL_DECISIONS = Counter("copilot_approval_decisions_total", "Human decisions", ["decision"])
EVENTS = Counter("copilot_events_total", "Events by type and stage", ["event_type", "stage"])
EVENT_BACKLOG = Gauge("copilot_event_backlog", "Unconsumed events in the outbox")
DEAD_LETTERS = Gauge("copilot_event_dead_letters", "Events parked after repeated handling failures")
TOKENS = Counter("copilot_tokens_total", "Tokens by direction and step", ["direction", "step"])
SUCCESSFUL_ACTIONS = Counter("copilot_successful_actions_total", "Business actions committed through the governed API")
PROMPT_INFO = Gauge("copilot_build_info", "Prompt and model version in use", ["prompt_version", "chat_model"])


@contextmanager
def span(step: str, logger: logging.Logger | None = None):
    """Time a step and log its duration under the current trace id."""
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        SPAN_SECONDS.labels(step=step).observe(elapsed)
        if logger:
            log(logger, "span", step=step, seconds=round(elapsed, 3))


def record_usage(message, step: str = "other") -> None:
    """Pull token counts off a LangChain AI message when the provider reports them."""
    usage = getattr(message, "usage_metadata", None) or {}
    if usage:
        TOKENS.labels(direction="input", step=step).inc(usage.get("input_tokens", 0))
        TOKENS.labels(direction="output", step=step).inc(usage.get("output_tokens", 0))
