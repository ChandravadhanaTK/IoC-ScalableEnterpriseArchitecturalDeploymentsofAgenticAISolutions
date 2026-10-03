"""Event consumer. Stage C's "one event" and stage D's queue-scaled worker.

Consumes ShipmentRerouted facts from the outbox and does the downstream work
the SOP describes: customer notification and billing note. It runs as its own
Deployment in Kubernetes and is scaled on the backlog gauge it exports, not on
CPU, because backlog is what actually measures demand for this kind of work.
"""
from __future__ import annotations

import json
import os
import signal
import socket
import time

from prometheus_client import start_http_server

from .config import settings
from .integration import db
from .telemetry import DEAD_LETTERS, EVENTS, EVENT_BACKLOG, get_logger, log, set_trace_id, span

logger = get_logger("worker")
_running = True


def _stop(*_):
    global _running
    _running = False


def handle(event: dict) -> None:
    payload = json.loads(event["payload"])
    set_trace_id(event["trace_id"])
    if event["event_type"] == "ShipmentRerouted":
        # Downstream effects. In a real deployment these are calls to the
        # notification and billing services; here they are audit rows, which is
        # enough to show the lineage from event to effect. Each effect is keyed
        # on the event id so a redelivered event does not repeat it.
        eid = event["id"]
        if not db.effect_recorded("customer_notified", eid):
            db.record_audit("worker", "customer_notified", {"event_id": eid, "customer_id": payload["customer_id"], "shipment_id": payload["shipment_id"], "to_carrier": payload["to_carrier"]})
        if not db.effect_recorded("billing_note_created", eid):
            db.record_audit("worker", "billing_note_created", {"event_id": eid, "request_id": payload["request_id"], "reason_code": payload["reason_code"]})
        EVENTS.labels(event_type=event["event_type"], stage="handled").inc()
    else:
        EVENTS.labels(event_type=event["event_type"], stage="ignored").inc()


def run_once(consumer: str) -> bool:
    """Claim (lease), handle, then ack. If handle raises, the lease expires and
    the event is retried, up to MAX_EVENT_ATTEMPTS, then dead lettered."""
    EVENT_BACKLOG.set(db.event_backlog())
    DEAD_LETTERS.set(db.dead_letter_count())
    ev = db.claim_next_event(consumer)
    if not ev:
        return False
    try:
        with span(f"event.{ev['event_type']}", logger):
            handle(ev)
    except Exception as e:  # noqa: BLE001 - a worker must survive a bad event
        log(logger, "event handling failed", event_id=ev["id"], attempt=ev["attempts"], error=str(e))
        EVENTS.labels(event_type=ev["event_type"], stage="failed").inc()
        return True
    if not db.ack_event(ev["id"], consumer):
        log(logger, "lease lost before ack; another consumer owns the event", event_id=ev["id"])
        return True
    log(logger, "event handled", event_id=ev["id"], event_type=ev["event_type"], consumer=consumer)
    EVENT_BACKLOG.set(db.event_backlog())
    return True


def main() -> None:
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)
    consumer = f"{socket.gethostname()}-{os.getpid()}"
    metrics_port = int(os.environ.get("METRICS_PORT", "9100"))
    start_http_server(metrics_port)
    log(logger, "worker started", consumer=consumer, metrics_port=metrics_port)
    while _running:
        if not run_once(consumer):
            time.sleep(settings.worker_poll_seconds)
    log(logger, "worker stopped", consumer=consumer)


if __name__ == "__main__":
    main()
