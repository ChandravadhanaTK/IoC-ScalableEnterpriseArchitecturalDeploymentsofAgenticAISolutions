import uuid
from .database import connection, add_audit


def create_approval(user_id: str, role: str, action: str, target: str) -> str:
    approval_id = "APR-" + uuid.uuid4().hex[:8].upper()
    conn = connection()
    conn.execute(
        "INSERT INTO approvals(id,user_id,role,action,target,status) VALUES(?,?,?,?,?,?)",
        (approval_id, user_id, role, action, target, "PENDING"),
    )
    conn.commit()
    conn.close()
    add_audit(user_id, role, action, "APPROVAL_REQUIRED", approval_id)
    return approval_id


def get_approval(approval_id: str):
    conn = connection()
    row = conn.execute(
        "SELECT * FROM approvals WHERE id=?", (approval_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def resolve_approval(approval_id: str, approved: bool):
    conn = connection()
    status = "APPROVED" if approved else "REJECTED"
    conn.execute(
        "UPDATE approvals SET status=? WHERE id=?", (status, approval_id)
    )
    conn.commit()
    conn.close()
    return status
