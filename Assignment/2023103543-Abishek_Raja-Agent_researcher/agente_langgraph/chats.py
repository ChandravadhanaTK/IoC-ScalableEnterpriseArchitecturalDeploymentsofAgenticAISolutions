import os
import sqlite3
import uuid
import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "checkpoints.db")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_schema(conn: sqlite3.Connection):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_chats_project ON chats(project_id)")
    conn.commit()


_ensure_schema(_connect())


def list_chats(project_id: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT id, project_id, name, created_at FROM chats WHERE project_id = ? ORDER BY created_at DESC",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def create_chat(project_id: str, name: str) -> dict:
    chat = {
        "id": uuid.uuid4().hex[:12],
        "project_id": project_id,
        "name": name,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    with _connect() as conn:
        conn.execute(
            "INSERT INTO chats (id, project_id, name, created_at) VALUES (?, ?, ?, ?)",
            (chat["id"], chat["project_id"], chat["name"], chat["created_at"]),
        )
        conn.commit()
    return chat


def delete_chat(chat_id: str) -> bool:
    with _connect() as conn:
        cur = conn.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
        conn.commit()
        return cur.rowcount > 0
