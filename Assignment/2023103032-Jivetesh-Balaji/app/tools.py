from .database import connection, add_audit, add_metric


def create_ticket(user_id: str, title: str, description: str):
    conn = connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO tickets(user_id,title,description,status) VALUES(?,?,?,?)",
        (user_id, title, description, "OPEN"),
    )
    ticket_id = cur.lastrowid
    conn.commit()
    conn.close()

    add_metric("ticket_created")
    add_audit(user_id, "", "create_ticket", "EXECUTED", f"ticket={ticket_id}")

    return {
        "ticket_id": f"TKT-{ticket_id:04d}",
        "status": "OPEN",
        "title": title,
    }


def list_tickets(user_id: str, role: str):
    conn = connection()
    if role in {"IT_SUPPORT", "ADMIN"}:
        rows = conn.execute(
            "SELECT id,user_id,title,status,created_at FROM tickets ORDER BY id DESC"
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id,user_id,title,status,created_at FROM tickets WHERE user_id=? ORDER BY id DESC",
            (user_id,),
        ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_asset(user_id: str, role: str, target_user: str | None = None):
    target = target_user or user_id

    assets = {
        "U1001": {"asset_id": "LAP-1001", "type": "Laptop", "model": "Dell Latitude", "status": "ACTIVE"},
        "U1002": {"asset_id": "LAP-1002", "type": "Laptop", "model": "Lenovo ThinkPad", "status": "ACTIVE"},
    }

    asset = assets.get(target)
    if not asset:
        return {"error": "Asset not found"}

    return {"user_id": target, **asset}


def reset_password(target_user: str):
    # Demonstration only: no real password is generated or exposed.
    add_metric("password_reset")
    return {
        "target_user": target_user,
        "status": "RESET_REQUESTED",
        "message": "Password reset workflow completed in the demo environment."
    }


def user_profile(user_id: str):
    profiles = {
        "U1001": {"user_id": "U1001", "name": "Demo Employee", "department": "Engineering"},
        "U1002": {"user_id": "U1002", "name": "Demo User", "department": "Finance"},
    }
    return profiles.get(user_id, {"user_id": user_id, "name": "Unknown"})
