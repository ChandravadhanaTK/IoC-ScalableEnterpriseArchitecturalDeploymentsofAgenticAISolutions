"""Persistence layer (SQLite for dev/demo; swap for Postgres in scale-out deployments).

All SQL lives here so the rest of the app talks to a repository interface,
not to a database driver. The audit log is hash-chained: every row stores
the SHA-256 of the previous row, which makes silent tampering detectable
(see `verify_audit_chain`).
"""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager
from typing import Any, Iterator

SCHEMA = """
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    requester TEXT NOT NULL,
    category TEXT,
    priority TEXT,
    status TEXT NOT NULL,
    resolution TEXT,
    summary TEXT,
    state_json TEXT NOT NULL,
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    resolved_at REAL,
    csat INTEGER
);
CREATE INDEX IF NOT EXISTS ix_tickets_requester ON tickets(requester);
CREATE INDEX IF NOT EXISTS ix_tickets_created ON tickets(created_at);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_messages_ticket ON messages(ticket_id);

CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    tool TEXT NOT NULL,
    args_json TEXT NOT NULL,
    risk TEXT NOT NULL,
    justification TEXT,
    requested_by TEXT NOT NULL,
    status TEXT NOT NULL,
    decided_by TEXT,
    decision_reason TEXT,
    created_at REAL NOT NULL,
    expires_at REAL NOT NULL,
    decided_at REAL
);
CREATE INDEX IF NOT EXISTS ix_approvals_status ON approvals(status);

CREATE TABLE IF NOT EXISTS traces (
    trace_id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    spans_json TEXT NOT NULL,
    total_ms REAL NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL DEFAULT 0,
    outcome TEXT,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_traces_ticket ON traces(ticket_id);
CREATE INDEX IF NOT EXISTS ix_traces_created ON traces(created_at);

CREATE TABLE IF NOT EXISTS audit_log (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    detail_json TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    hash TEXT NOT NULL
);
"""

GENESIS_HASH = "0" * 64


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


class Store:
    def __init__(self, path: str):
        self.path = path
        if path != ":memory:":
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        self._conn = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=ON")
        self._conn.executescript(SCHEMA)
        self._lock = threading.RLock()

    @contextmanager
    def tx(self) -> Iterator[sqlite3.Connection]:
        with self._lock:
            self._conn.execute("BEGIN IMMEDIATE")
            try:
                yield self._conn
                self._conn.execute("COMMIT")
            except Exception:
                self._conn.execute("ROLLBACK")
                raise

    def _q(self, sql: str, args: tuple = ()) -> list[sqlite3.Row]:
        with self._lock:
            return self._conn.execute(sql, args).fetchall()

    def close(self) -> None:
        self._conn.close()

    def ping(self) -> bool:
        return self._q("SELECT 1")[0][0] == 1

    # ------------------------------------------------------------------ tickets
    def create_ticket(self, requester: str, state: dict) -> str:
        tid = new_id("INC")
        now = time.time()
        with self.tx() as c:
            c.execute(
                "INSERT INTO tickets(id, requester, status, state_json, created_at, updated_at) "
                "VALUES (?,?,?,?,?,?)",
                (tid, requester, "NEW", json.dumps(state), now, now),
            )
        return tid

    def save_ticket(self, tid: str, *, state: dict, status: str, category: str | None,
                    priority: str | None, resolution: str | None, summary: str | None) -> None:
        now = time.time()
        resolved_at = now if status in {"RESOLVED", "CLOSED"} else None
        with self.tx() as c:
            c.execute(
                "UPDATE tickets SET state_json=?, status=?, category=?, priority=?, resolution=?, "
                "summary=?, updated_at=?, resolved_at=COALESCE(resolved_at, ?) WHERE id=?",
                (json.dumps(state), status, category, priority, resolution, summary, now,
                 resolved_at, tid),
            )

    def get_ticket(self, tid: str) -> dict | None:
        rows = self._q("SELECT * FROM tickets WHERE id=?", (tid,))
        return self._ticket_row(rows[0]) if rows else None

    def list_tickets(self, requester: str | None = None, limit: int = 100) -> list[dict]:
        if requester:
            rows = self._q("SELECT * FROM tickets WHERE requester=? ORDER BY created_at DESC LIMIT ?",
                           (requester, limit))
        else:
            rows = self._q("SELECT * FROM tickets ORDER BY created_at DESC LIMIT ?", (limit,))
        return [self._ticket_row(r, include_state=False) for r in rows]

    def set_csat(self, tid: str, rating: int) -> None:
        with self.tx() as c:
            c.execute("UPDATE tickets SET csat=? WHERE id=?", (rating, tid))

    @staticmethod
    def _ticket_row(r: sqlite3.Row, include_state: bool = True) -> dict:
        d = dict(r)
        state = json.loads(d.pop("state_json"))
        if include_state:
            d["state"] = state
        return d

    # ----------------------------------------------------------------- messages
    def add_message(self, tid: str, role: str, content: str) -> None:
        with self.tx() as c:
            c.execute("INSERT INTO messages(ticket_id, role, content, created_at) VALUES (?,?,?,?)",
                      (tid, role, content, time.time()))

    def get_messages(self, tid: str) -> list[dict]:
        return [dict(r) for r in self._q(
            "SELECT role, content, created_at FROM messages WHERE ticket_id=? ORDER BY id", (tid,))]

    # ---------------------------------------------------------------- approvals
    def create_approval(self, *, ticket_id: str, tool: str, args: dict, risk: str,
                        justification: str, requested_by: str, ttl_minutes: int) -> str:
        aid = new_id("APR")
        now = time.time()
        with self.tx() as c:
            c.execute(
                "INSERT INTO approvals(id, ticket_id, tool, args_json, risk, justification, "
                "requested_by, status, created_at, expires_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (aid, ticket_id, tool, json.dumps(args), risk, justification, requested_by,
                 "PENDING", now, now + ttl_minutes * 60),
            )
        return aid

    def get_approval(self, aid: str) -> dict | None:
        rows = self._q("SELECT * FROM approvals WHERE id=?", (aid,))
        return self._approval_row(rows[0]) if rows else None

    def list_approvals(self, status: str | None = None) -> list[dict]:
        if status:
            rows = self._q("SELECT * FROM approvals WHERE status=? ORDER BY created_at DESC", (status,))
        else:
            rows = self._q("SELECT * FROM approvals ORDER BY created_at DESC LIMIT 200")
        return [self._approval_row(r) for r in rows]

    def decide_approval(self, aid: str, *, status: str, decided_by: str, reason: str) -> bool:
        """Atomically move PENDING -> APPROVED/REJECTED/EXPIRED. Returns False if already decided."""
        with self.tx() as c:
            cur = c.execute(
                "UPDATE approvals SET status=?, decided_by=?, decision_reason=?, decided_at=? "
                "WHERE id=? AND status='PENDING'",
                (status, decided_by, reason, time.time(), aid),
            )
            return cur.rowcount == 1

    @staticmethod
    def _approval_row(r: sqlite3.Row) -> dict:
        d = dict(r)
        d["args"] = json.loads(d.pop("args_json"))
        return d

    # ------------------------------------------------------------------- traces
    def save_trace(self, *, trace_id: str, ticket_id: str, spans: list[dict], total_ms: float,
                   input_tokens: int, output_tokens: int, cost_usd: float, outcome: str) -> None:
        with self.tx() as c:
            c.execute(
                "INSERT OR REPLACE INTO traces(trace_id, ticket_id, spans_json, total_ms, input_tokens, "
                "output_tokens, cost_usd, outcome, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                (trace_id, ticket_id, json.dumps(spans), total_ms, input_tokens, output_tokens,
                 cost_usd, outcome, time.time()),
            )

    def get_trace(self, trace_id: str) -> dict | None:
        rows = self._q("SELECT * FROM traces WHERE trace_id=?", (trace_id,))
        if not rows:
            return None
        d = dict(rows[0])
        d["spans"] = json.loads(d.pop("spans_json"))
        return d

    def traces_for_ticket(self, tid: str) -> list[dict]:
        rows = self._q("SELECT trace_id, total_ms, outcome, created_at FROM traces "
                       "WHERE ticket_id=? ORDER BY created_at", (tid,))
        return [dict(r) for r in rows]

    # ---------------------------------------------------------------- analytics
    def analytics_rows(self, since: float) -> dict[str, list[dict]]:
        tickets = [dict(r) for r in self._q(
            "SELECT id, category, priority, status, resolution, created_at, resolved_at, csat "
            "FROM tickets WHERE created_at>=?", (since,))]
        traces = [dict(r) for r in self._q(
            "SELECT total_ms, input_tokens, output_tokens, cost_usd, outcome, created_at "
            "FROM traces WHERE created_at>=?", (since,))]
        approvals = [dict(r) for r in self._q(
            "SELECT status, created_at, decided_at FROM approvals WHERE created_at>=?", (since,))]
        return {"tickets": tickets, "traces": traces, "approvals": approvals}

    # -------------------------------------------------------------------- audit
    def audit(self, actor: str, action: str, target: str | None, detail: dict | None = None) -> None:
        detail_json = json.dumps(detail or {}, sort_keys=True, default=str)
        with self.tx() as c:
            row = c.execute("SELECT hash FROM audit_log ORDER BY seq DESC LIMIT 1").fetchone()
            prev = row["hash"] if row else GENESIS_HASH
            ts = time.time()
            digest = _audit_hash(prev, ts, actor, action, target, detail_json)
            c.execute(
                "INSERT INTO audit_log(ts, actor, action, target, detail_json, prev_hash, hash) "
                "VALUES (?,?,?,?,?,?,?)",
                (ts, actor, action, target, detail_json, prev, digest),
            )

    def list_audit(self, limit: int = 200) -> list[dict]:
        rows = self._q("SELECT * FROM audit_log ORDER BY seq DESC LIMIT ?", (limit,))
        out = []
        for r in rows:
            d = dict(r)
            d["detail"] = json.loads(d.pop("detail_json"))
            out.append(d)
        return out

    def verify_audit_chain(self) -> dict[str, Any]:
        prev = GENESIS_HASH
        count = 0
        for r in self._q("SELECT * FROM audit_log ORDER BY seq"):
            expected = _audit_hash(prev, r["ts"], r["actor"], r["action"], r["target"], r["detail_json"])
            if r["prev_hash"] != prev or r["hash"] != expected:
                return {"valid": False, "broken_at_seq": r["seq"], "checked": count}
            prev = r["hash"]
            count += 1
        return {"valid": True, "checked": count}


def _audit_hash(prev: str, ts: float, actor: str, action: str, target: str | None, detail_json: str) -> str:
    payload = f"{prev}|{ts:.6f}|{actor}|{action}|{target or ''}|{detail_json}"
    return hashlib.sha256(payload.encode()).hexdigest()
