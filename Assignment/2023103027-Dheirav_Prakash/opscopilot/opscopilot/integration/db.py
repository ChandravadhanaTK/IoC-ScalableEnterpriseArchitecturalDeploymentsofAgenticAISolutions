"""Allowlisted data access service over the operations database.

The agent cannot compose SQL. It can only call the named functions below, each
of which runs a fixed parameterised statement. That is the "no arbitrary SQL in
production" rule from Module 5 made concrete: the query shape is fixed at
build time, only the parameters vary, and reads use a read-only connection.
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Generator

from ..config import settings
from ..telemetry import EVENTS, trace_id

# SLA-POL-001 §2. Express and Priority are clock hours; Standard and Economy
# are business days, which exclude Sundays and the holidays in HOLIDAYS.
SLA_HOURS = {"Express": 24, "Priority": 48}
SLA_BUSINESS_DAYS = {"Standard": 5, "Economy": 10}
HOLIDAYS: set[str] = set()   # ISO dates from the annual operations calendar; empty in the demo


def sla_deadline(tier: str, pickup: datetime) -> datetime:
    if tier in SLA_HOURS:
        return pickup + timedelta(hours=SLA_HOURS[tier])
    days_left = SLA_BUSINESS_DAYS[tier]
    d = pickup
    while days_left > 0:
        d += timedelta(days=1)
        if d.weekday() != 6 and d.date().isoformat() not in HOLIDAYS:
            days_left -= 1
    return d


@contextmanager
def _conn(readonly: bool = True) -> Generator[sqlite3.Connection, None, None]:
    uri = f"file:{settings.db_path}?mode={'ro' if readonly else 'rw'}"
    con = sqlite3.connect(uri, uri=True, timeout=10)
    con.row_factory = sqlite3.Row
    try:
        yield con
        if not readonly:
            con.commit()
    finally:
        con.close()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def _aware(ts: str) -> datetime:
    dt = datetime.fromisoformat(ts)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def classify_sla(row: sqlite3.Row | dict, now: datetime | None = None) -> dict[str, Any]:
    """Apply SLA-POL-001 section 3 to one shipment row.

    The window is measured from the pickup scan. "At risk" means under 25 percent
    of the window remains and the shipment is not delivered. "Breached" means the
    window has elapsed without a delivery scan.
    """
    now = now or _now()
    pickup = _aware(row["pickup_at"])
    deadline = sla_deadline(row["tier"], pickup)
    window = deadline - pickup
    if row["status"] == "delivered" and row["delivered_at"]:
        delivered = _aware(row["delivered_at"])
        state = "delivered_on_time" if delivered <= deadline else "delivered_late"
        remaining_pct = 0.0
    else:
        remaining = deadline - now
        remaining_pct = max(0.0, remaining / window) * 100
        if remaining <= timedelta(0):
            state = "breached"
        elif remaining_pct < 25:
            state = "at_risk"
        else:
            state = "on_track"
    return {
        "sla_state": state,
        "deadline": _iso(deadline),
        "remaining_pct": round(remaining_pct, 1),
        "window_hours": round(window.total_seconds() / 3600, 1),
    }


# ---- reads -----------------------------------------------------------------

def get_shipment(shipment_id: str) -> dict[str, Any] | None:
    with _conn() as con:
        row = con.execute(
            "SELECT s.*, c.name AS carrier_name, c.on_review AS carrier_on_review "
            "FROM shipments s JOIN carriers c ON c.code = s.carrier_code WHERE s.id = ?",
            (shipment_id,),
        ).fetchone()
        if not row:
            return None
        disruption = con.execute(
            "SELECT declared_at, expected_until, note FROM carrier_disruptions "
            "WHERE carrier_code = ? AND lane = ? AND expected_until > ?",
            (row["carrier_code"], row["lane"], _iso(_now())),
        ).fetchone()
    out = dict(row)
    out.update(classify_sla(row))
    out["carrier_disruption"] = dict(disruption) if disruption else None
    return out


def list_shipments(states: tuple[str, ...] = ("at_risk", "breached"), lane: str | None = None) -> list[dict[str, Any]]:
    with _conn() as con:
        sql = "SELECT s.*, c.name AS carrier_name, c.on_review AS carrier_on_review FROM shipments s JOIN carriers c ON c.code = s.carrier_code WHERE s.status != 'delivered'"
        params: list[Any] = []
        if lane:
            sql += " AND s.lane = ?"
            params.append(lane)
        rows = con.execute(sql, params).fetchall()
    now = _now()
    out = []
    for row in rows:
        sla = classify_sla(row, now)
        if sla["sla_state"] in states:
            d = dict(row)
            d.update(sla)
            out.append(d)
    return sorted(out, key=lambda r: r["remaining_pct"])


def active_carriers_for_lane(lane: str) -> list[dict[str, Any]]:
    """Carriers assigned to the lane (carrier_lanes, seeded from POL-CAR-007 §5)
    that are not on performance review and have no open disruption on it."""
    with _conn() as con:
        rows = con.execute(
            "SELECT c.code, c.name FROM carriers c JOIN carrier_lanes l ON l.carrier_code = c.code "
            "WHERE l.lane = ? AND c.on_review = 0 AND c.code NOT IN "
            "(SELECT carrier_code FROM carrier_disruptions WHERE lane = ? AND expected_until > ?) ORDER BY c.code",
            (lane, lane, _iso(_now())),
        ).fetchall()
    return [dict(r) for r in rows]


def get_reroute_request(idempotency_key: str) -> dict[str, Any] | None:
    with _conn() as con:
        row = con.execute("SELECT * FROM reroute_requests WHERE idempotency_key = ?", (idempotency_key,)).fetchone()
    return dict(row) if row else None


def list_events(unconsumed_only: bool = True, limit: int = 50) -> list[dict[str, Any]]:
    with _conn() as con:
        sql = "SELECT * FROM events" + (" WHERE consumed_at IS NULL AND dead_lettered_at IS NULL" if unconsumed_only else "") + " ORDER BY id LIMIT ?"
        rows = con.execute(sql, (limit,)).fetchall()
    return [dict(r) for r in rows]


def list_audit(limit: int = 50, trace: str | None = None) -> list[dict[str, Any]]:
    with _conn() as con:
        if trace:
            rows = con.execute("SELECT * FROM audit_log WHERE trace_id = ? ORDER BY id", (trace,)).fetchall()
        else:
            rows = con.execute("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


# ---- writes (each one is a single governed operation) -----------------------

def record_audit(actor: str, action: str, detail: dict[str, Any]) -> None:
    with _conn(readonly=False) as con:
        con.execute(
            "INSERT INTO audit_log (trace_id, actor, action, detail, recorded_at) VALUES (?,?,?,?,?)",
            (trace_id(), actor, action, json.dumps(detail, default=str), _iso(_now())),
        )


def publish_event(event_type: str, payload: dict[str, Any], dedupe_key: str | None = None,
                  con: sqlite3.Connection | None = None) -> int:
    """Transactional outbox. The event is a fact that something happened; the
    worker consumes it asynchronously. Deduplicated on `dedupe_key` (the
    business operation's idempotency key), falling back to the trace id for
    callers that have no such key. Pass `con` to publish inside a caller's
    transaction."""
    key = dedupe_key or f"trace:{trace_id()}"
    def _do(c: sqlite3.Connection) -> int:
        existing = c.execute("SELECT id FROM events WHERE event_type = ? AND dedupe_key = ?", (event_type, key)).fetchone()
        if existing:
            return int(existing["id"])
        cur = c.execute(
            "INSERT INTO events (event_type, payload, trace_id, dedupe_key, published_at) VALUES (?,?,?,?,?)",
            (event_type, json.dumps(payload, default=str), trace_id(), key, _iso(_now())),
        )
        EVENTS.labels(event_type=event_type, stage="published").inc()
        return int(cur.lastrowid or 0)
    if con is not None:
        return _do(con)
    with _conn(readonly=False) as c:
        return _do(c)


def commit_reroute(idempotency_key: str, shipment_id: str, new_carrier_code: str, reason_code: str,
                   requested_by: str, approved_by: str, event_payload: dict[str, Any],
                   audit_actor: str) -> tuple[dict[str, Any], bool]:
    # approved_by is the comma-joined list of signing users so a two-person
    # approval is visible on the request row and in the audit trail.
    """The whole re-route commit in ONE transaction: request row, shipment
    update, outbox event and audit row either all land or none do. Returns
    (request_row, replayed). A repeat with the same key is a no-op replay."""
    with _conn(readonly=False) as con:
        con.execute("BEGIN IMMEDIATE")
        existing = con.execute("SELECT * FROM reroute_requests WHERE idempotency_key = ?", (idempotency_key,)).fetchone()
        if existing:
            return dict(existing), True
        con.execute(
            "INSERT INTO reroute_requests (idempotency_key, shipment_id, new_carrier_code, reason_code, requested_by, approved_by, status, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (idempotency_key, shipment_id, new_carrier_code, reason_code, requested_by, approved_by, "committed", _iso(_now())),
        )
        row = dict(con.execute("SELECT * FROM reroute_requests WHERE idempotency_key = ?", (idempotency_key,)).fetchone())
        con.execute("UPDATE shipments SET carrier_code = ? WHERE id = ?", (new_carrier_code, shipment_id))
        publish_event("ShipmentRerouted", {**event_payload, "request_id": row["id"]}, dedupe_key=idempotency_key, con=con)
        con.execute(
            "INSERT INTO audit_log (trace_id, actor, action, detail, recorded_at) VALUES (?,?,?,?,?)",
            (trace_id(), audit_actor, "reroute_committed",
             json.dumps({"request_id": row["id"], "shipment_id": shipment_id, "to": new_carrier_code, "idempotency_key": idempotency_key}), _iso(_now())),
        )
    return row, False


def open_reroute_for_shipment(shipment_id: str, exclude_thread: str | None = None) -> dict[str, Any] | None:
    """A committed re-route or a still-pending approval already exists for this
    shipment. Pending proposals live in `approvals`, committed ones in
    `reroute_requests`; both count, otherwise two requesters could each get a
    booking for the same parcel."""
    with _conn() as con:
        row = con.execute("SELECT id, status, 'committed' AS kind FROM reroute_requests WHERE shipment_id = ? ORDER BY id DESC LIMIT 1", (shipment_id,)).fetchone()
        if row:
            return dict(row)
        rows = con.execute("SELECT thread_id, proposal, status FROM approvals WHERE status = 'pending'").fetchall()
    for r in rows:
        if r["thread_id"] == exclude_thread:
            continue
        if json.loads(r["proposal"]).get("shipment_id") == shipment_id:
            return {"id": r["thread_id"], "status": "pending", "kind": "pending_approval"}
    return None


def verify_approval_record(thread_id: str, shipment_id: str, signers: list[str], roles: list[str]) -> str | None:
    """The business API's proof of approval: the approvals table must hold an
    approved row for this thread and shipment whose recorded signatures match
    the signers and roles the caller claims. Returns a problem or None."""
    rec = get_approval(thread_id)
    if rec is None:
        return "no approval record for this thread"
    if rec["status"] != "approved":
        return f"approval record is {rec['status']}, not approved"
    if rec["proposal"].get("shipment_id") != shipment_id:
        return "approval record is for a different shipment"
    recorded = {(sig["user"], sig["role"]) for sig in rec["signatures"]}
    if set(zip(signers, roles)) != recorded:
        return "claimed signers do not match the recorded signatures"
    return None


MAX_EVENT_ATTEMPTS = 3


def claim_next_event(consumer: str, lease_seconds: int = 60) -> dict[str, Any] | None:
    """Competing-consumer claim with a lease, not an ack. The event stays
    unconsumed until `ack_event`; a worker that dies mid-handle lets the lease
    expire and another worker picks the event up. After MAX_EVENT_ATTEMPTS the
    event is parked in the dead letter state instead of retried forever."""
    now = _now()
    with _conn(readonly=False) as con:
        con.execute("BEGIN IMMEDIATE")
        row = con.execute(
            "SELECT * FROM events WHERE consumed_at IS NULL AND dead_lettered_at IS NULL "
            "AND (leased_until IS NULL OR leased_until <= ?) ORDER BY id LIMIT 1", (_iso(now),)
        ).fetchone()
        if not row:
            return None
        attempts = int(row["attempts"] or 0) + 1
        if attempts > MAX_EVENT_ATTEMPTS:
            con.execute("UPDATE events SET dead_lettered_at = ?, consumer = ? WHERE id = ?", (_iso(now), consumer, row["id"]))
            EVENTS.labels(event_type=row["event_type"], stage="dead_lettered").inc()
            return None
        con.execute(
            "UPDATE events SET leased_until = ?, consumer = ?, attempts = ? WHERE id = ?",
            (_iso(now + timedelta(seconds=lease_seconds)), consumer, attempts, row["id"]),
        )
    out = dict(row); out["attempts"] = attempts
    return out


def ack_event(event_id: int, consumer: str) -> bool:
    """Fenced: only the consumer holding the lease may acknowledge."""
    with _conn(readonly=False) as con:
        cur = con.execute("UPDATE events SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL AND consumer = ?",
                          (_iso(_now()), event_id, consumer))
        return cur.rowcount == 1


def effect_recorded(action: str, event_id: int) -> bool:
    """Has this downstream effect already been applied for this event? Makes
    the worker's effects idempotent under lease expiry or redelivery."""
    with _conn() as con:
        row = con.execute("SELECT 1 FROM audit_log WHERE action = ? AND detail LIKE ? LIMIT 1",
                          (action, f'%"event_id": {event_id},%')).fetchone()
    return row is not None


def event_backlog() -> int:
    with _conn() as con:
        return int(con.execute("SELECT COUNT(*) FROM events WHERE consumed_at IS NULL AND dead_lettered_at IS NULL").fetchone()[0])


def dead_letter_count() -> int:
    with _conn() as con:
        return int(con.execute("SELECT COUNT(*) FROM events WHERE dead_lettered_at IS NOT NULL").fetchone()[0])


# ---- approvals (the human gate's durable record) ------------------------------

def create_approval(thread_id: str, proposal: dict[str, Any], requested_by: str, approver_roles: set[str],
                    required_approvals: int = 1) -> None:
    with _conn(readonly=False) as con:
        con.execute(
            "INSERT OR IGNORE INTO approvals (thread_id, trace_id, proposal, requested_by, approver_roles, required_approvals, status, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (thread_id, trace_id(), json.dumps(proposal, default=str), requested_by, json.dumps(sorted(approver_roles)), required_approvals, "pending", _iso(_now())),
        )


def add_signature(thread_id: str, user: str, role: str) -> list[dict[str, str]]:
    """Append one approver's signature to a pending approval and return the list."""
    with _conn(readonly=False) as con:
        con.execute("BEGIN IMMEDIATE")
        row = con.execute("SELECT signatures FROM approvals WHERE thread_id = ? AND status = 'pending'", (thread_id,)).fetchone()
        if not row:
            raise LookupError("approval not pending")
        sigs = json.loads(row["signatures"])
        if not any(s["user"] == user for s in sigs):
            sigs.append({"user": user, "role": role, "at": _iso(_now())})
            con.execute("UPDATE approvals SET signatures = ? WHERE thread_id = ?", (json.dumps(sigs), thread_id))
    return sigs


def get_approval(thread_id: str) -> dict[str, Any] | None:
    with _conn() as con:
        row = con.execute("SELECT * FROM approvals WHERE thread_id = ?", (thread_id,)).fetchone()
    if not row:
        return None
    out = dict(row)
    out["proposal"] = json.loads(out["proposal"])
    out["approver_roles"] = json.loads(out["approver_roles"])
    out["signatures"] = json.loads(out["signatures"])
    return out


def list_approvals(status: str | None = "pending") -> list[dict[str, Any]]:
    with _conn() as con:
        if status:
            rows = con.execute("SELECT * FROM approvals WHERE status = ? ORDER BY created_at", (status,)).fetchall()
        else:
            rows = con.execute("SELECT * FROM approvals ORDER BY created_at DESC LIMIT 100").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["proposal"] = json.loads(d["proposal"])
        d["approver_roles"] = json.loads(d["approver_roles"])
        d["signatures"] = json.loads(d["signatures"])
        out.append(d)
    return out


def decide_approval(thread_id: str, status: str, decided_by: str) -> bool:
    """Only a pending approval can be decided. Returns False if it was not pending."""
    with _conn(readonly=False) as con:
        cur = con.execute("UPDATE approvals SET status = ?, decided_by = ?, decided_at = ? WHERE thread_id = ? AND status = 'pending'",
                          (status, decided_by, _iso(_now()), thread_id))
        return cur.rowcount == 1


def pending_approval_for_shipment(shipment_id: str) -> dict[str, Any] | None:
    r = open_reroute_for_shipment(shipment_id)
    return r if r and r["kind"] == "pending_approval" else None


def pending_approval_count() -> int:
    with _conn() as con:
        return int(con.execute("SELECT COUNT(*) FROM approvals WHERE status = 'pending'").fetchone()[0])
