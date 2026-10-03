import os
import sqlite3
from pathlib import Path

DB_PATH = os.getenv("DATABASE_PATH", "data/agent.db")


def connection():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = connection()
    cur = conn.cursor()

    cur.executescript(
        '''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'OPEN',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS approvals (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            target TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            role TEXT,
            action TEXT,
            decision TEXT,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric TEXT,
            value REAL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        '''
    )

    # Demo data
    cur.execute(
        "SELECT COUNT(*) AS c FROM tickets"
    )
    if cur.fetchone()["c"] == 0:
        cur.execute(
            "INSERT INTO tickets(user_id,title,description,status) VALUES(?,?,?,?)",
            ("U1001", "VPN connection problem", "Unable to connect to company VPN.", "OPEN")
        )

    conn.commit()
    conn.close()


def add_audit(user_id, role, action, decision, details=""):
    conn = connection()
    conn.execute(
        "INSERT INTO audit_logs(user_id,role,action,decision,details) VALUES(?,?,?,?,?)",
        (user_id, role, action, decision, details)
    )
    conn.execute("INSERT INTO metrics(metric,value) VALUES(?,1)", ("audit_event",))
    conn.commit()
    conn.close()


def add_metric(metric, value=1):
    conn = connection()
    conn.execute("INSERT INTO metrics(metric,value) VALUES(?,?)", (metric, value))
    conn.commit()
    conn.close()
