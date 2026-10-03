from datetime import datetime, timezone
from uuid import uuid4

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .orchestrator import run_workflow
from .schemas import ApprovalRequest, LoginRequest, TicketCreate, TicketOut
from .security import create_access_token, current_user, require_roles
from .store import AUDIT_LOGS, TICKETS, USERS, add_ticket, audit, get_ticket, now, visible_tickets

app = FastAPI(title="ResolveAI Support API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
STATIC_DIR = Path(__file__).parent / "static"


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "resolveai-api", "time": now()}


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> dict:
    user = USERS.get(payload.email.lower())
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    audit(user["id"], "auth.login")
    return {"access_token": create_access_token(user), "token_type": "bearer", "user": {key: user[key] for key in ("id", "email", "role", "name")}}


@app.post("/api/tickets", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreate, user: dict = Depends(require_roles("customer"))) -> dict:
    result = run_workflow(user, payload.order_id, payload.message)
    ticket_id = f"TKT-{str(uuid4())[:8].upper()}"
    ticket = {"id": ticket_id, "customer_id": user["id"], "order_id": payload.order_id, "message": payload.message, "created_at": now(), "updated_at": now(), **result}
    add_ticket(ticket)
    audit(user["id"], "ticket.created", ticket_id, {"status": ticket["status"], "issue_type": ticket["issue_type"]})
    return ticket


@app.get("/api/tickets", response_model=list[TicketOut])
def list_tickets(user: dict = Depends(current_user)) -> list[dict]:
    return visible_tickets(user)


@app.post("/api/tickets/{ticket_id}/approval", response_model=TicketOut)
def approval(ticket_id: str, payload: ApprovalRequest, user: dict = Depends(require_roles("approver", "admin"))) -> dict:
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket["status"] != "PENDING_APPROVAL":
        raise HTTPException(status_code=409, detail="Ticket is not awaiting approval")
    ticket["status"] = "RESOLVED" if payload.decision == "approve" else "REJECTED"
    ticket["updated_at"] = now()
    ticket["customer_response"] = (f"Your {ticket['proposed_action']} has been approved. We will contact you with the next steps." if payload.decision == "approve" else f"Your {ticket['proposed_action']} was not approved. {payload.note}")
    ticket["traces"].append({"agent": "Human Approval", "outcome": payload.decision, "timestamp": now(), "details": {"approver": user["email"], "note": payload.note}})
    audit(user["id"], f"approval.{payload.decision}", ticket_id, {"note": payload.note, "action": ticket["proposed_action"]})
    return ticket


@app.get("/api/dashboard")
def dashboard(user: dict = Depends(require_roles("support_agent", "approver", "admin"))) -> dict:
    items = list(TICKETS.values())
    total = len(items)
    counts = {name: sum(ticket["status"] == name for ticket in items) for name in ("RESOLVED", "PENDING_APPROVAL", "NEEDS_INFORMATION", "ESCALATED", "REJECTED")}
    resolved = counts["RESOLVED"]
    average_ms = round(sum(ticket.get("workflow_duration_ms", 0) for ticket in items) / total, 2) if total else 0
    return {"total_tickets": total, "workflow_resolved_rate": round((resolved / total * 100), 1) if total else 0, "average_workflow_ms": average_ms, "escalation_rate": round((counts["ESCALATED"] / total * 100), 1) if total else 0, "status_counts": counts, "tool_success_rate": 100.0, "pending_approvals": counts["PENDING_APPROVAL"], "audit_events": len(AUDIT_LOGS), "estimated_tokens": total * 420, "estimated_cost_usd": round(total * 0.002, 4)}


if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def frontend(full_path: str) -> FileResponse:
        """Serve the React SPA after all /api routes have been registered."""
        return FileResponse(STATIC_DIR / "index.html")
