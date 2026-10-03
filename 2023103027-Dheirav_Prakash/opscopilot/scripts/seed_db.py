"""Create and seed the operations database.

The copilot never runs arbitrary SQL against this database. It goes through the
allowlisted query service in opscopilot/integration/db.py. This script exists so
the demo has realistic rows to reason over, including shipments in every SLA
state and one cold-chain shipment that the approval matrix treats specially.
"""
from __future__ import annotations

import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from opscopilot.config import settings  # noqa: E402

SCHEMA = """
CREATE TABLE IF NOT EXISTS carriers (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    on_review INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS carrier_disruptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carrier_code TEXT NOT NULL REFERENCES carriers(code),
    lane TEXT NOT NULL,
    declared_at TEXT NOT NULL,
    expected_until TEXT NOT NULL,
    note TEXT
);
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    lane TEXT NOT NULL,
    carrier_code TEXT NOT NULL REFERENCES carriers(code),
    tier TEXT NOT NULL,
    declared_value_inr INTEGER NOT NULL,
    cold_chain INTEGER NOT NULL DEFAULT 0,
    pickup_at TEXT NOT NULL,
    status TEXT NOT NULL,
    last_location TEXT NOT NULL,
    delivered_at TEXT
);
CREATE TABLE IF NOT EXISTS reroute_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idempotency_key TEXT NOT NULL UNIQUE,
    shipment_id TEXT NOT NULL REFERENCES shipments(id),
    new_carrier_code TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    approved_by TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS carrier_lanes (
    carrier_code TEXT NOT NULL REFERENCES carriers(code),
    lane TEXT NOT NULL,
    PRIMARY KEY (carrier_code, lane)
);
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    dedupe_key TEXT NOT NULL,
    published_at TEXT NOT NULL,
    leased_until TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    consumed_at TEXT,
    dead_lettered_at TEXT,
    consumer TEXT,
    UNIQUE (event_type, dedupe_key)
);
CREATE TABLE IF NOT EXISTS approvals (
    thread_id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,
    proposal TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    approver_roles TEXT NOT NULL,
    required_approvals INTEGER NOT NULL DEFAULT 1,
    signatures TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL,
    decided_by TEXT,
    created_at TEXT NOT NULL,
    decided_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trace_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    recorded_at TEXT NOT NULL
);
"""

CARRIERS = [
    ("CAR-BLU", "BlueDart Express", 0),
    ("CAR-DEL", "Delhivery Surface", 0),
    ("CAR-GAT", "Gati Freight", 1),
    ("CAR-SAF", "Safexpress", 0),
]

# Lane assignments from POL-CAR-007 section 5.
CARRIER_LANES = [
    ("CAR-BLU", "Chennai to Bengaluru"), ("CAR-BLU", "Chennai to Hyderabad"),
    ("CAR-DEL", "Chennai to Bengaluru"), ("CAR-DEL", "Chennai to Mumbai"),
    ("CAR-GAT", "Chennai to Mumbai"), ("CAR-GAT", "Chennai to Hyderabad"),
    ("CAR-SAF", "Chennai to Kolkata"),
]


def iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def build_rows(now: datetime):
    h = timedelta(hours=1)
    # Every shipment is described relative to "now" so the SLA classification in
    # the demo is stable no matter when the seed runs.
    return [
        # id, customer, lane, carrier, tier, value, cold, pickup, status, location, delivered
        ("SHP-1001", "Arihant Pharma", "Chennai to Bengaluru", "CAR-BLU", "Express", 120000, 1, now - 20 * h, "in_transit", "Hosur hub", None),
        ("SHP-1002", "Kavya Textiles", "Chennai to Bengaluru", "CAR-DEL", "Priority", 18000, 0, now - 40 * h, "in_transit", "Krishnagiri", None),
        ("SHP-1003", "Nova Electronics", "Chennai to Mumbai", "CAR-GAT", "Priority", 65000, 0, now - 50 * h, "in_transit", "Pune hub", None),
        ("SHP-1004", "Kavya Textiles", "Chennai to Hyderabad", "CAR-BLU", "Standard", 9000, 0, now - 30 * h, "in_transit", "Nellore", None),
        ("SHP-1005", "Sundar Foods", "Chennai to Mumbai", "CAR-DEL", "Express", 30000, 0, now - 26 * h, "in_transit", "Solapur", None),
        ("SHP-1006", "Nova Electronics", "Chennai to Kolkata", "CAR-SAF", "Economy", 4000, 0, now - 72 * h, "in_transit", "Vijayawada", None),
        ("SHP-1007", "Arihant Pharma", "Chennai to Hyderabad", "CAR-GAT", "Express", 45000, 0, now - 10 * h, "in_transit", "Chennai origin hub", None),
        ("SHP-1008", "Sundar Foods", "Chennai to Bengaluru", "CAR-BLU", "Standard", 7000, 0, now - 96 * h, "delivered", "Bengaluru", now - 20 * h),
        ("SHP-1009", "Meera Publishing", "Chennai to Mumbai", "CAR-GAT", "Standard", 12000, 0, now - 112 * h, "in_transit", "Pune hub", None),
        ("SHP-1010", "Meera Publishing", "Chennai to Bengaluru", "CAR-DEL", "Priority", 22000, 0, now - 6 * h, "in_transit", "Chennai origin hub", None),
    ]


def main() -> None:
    db_path = Path(settings.db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()
    now = datetime.now(timezone.utc)
    con = sqlite3.connect(db_path)
    con.executescript(SCHEMA)
    con.executemany("INSERT INTO carriers VALUES (?,?,?)", CARRIERS)
    con.executemany("INSERT INTO carrier_lanes VALUES (?,?)", CARRIER_LANES)
    con.execute(
        "INSERT INTO carrier_disruptions (carrier_code, lane, declared_at, expected_until, note) VALUES (?,?,?,?,?)",
        ("CAR-GAT", "Chennai to Mumbai", iso(now - timedelta(hours=3)), iso(now + timedelta(hours=30)), "Highway closure near Pune"),
    )
    rows = [
        (i, c, lane, car, tier, val, cold, iso(pick), st, loc, iso(deliv) if deliv else None)
        for (i, c, lane, car, tier, val, cold, pick, st, loc, deliv) in build_rows(now)
    ]
    con.executemany("INSERT INTO shipments VALUES (?,?,?,?,?,?,?,?,?,?,?)", rows)
    con.commit()
    con.close()
    print(f"seeded {len(rows)} shipments into {db_path}")


if __name__ == "__main__":
    main()
