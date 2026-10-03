from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, connection, add_metric, add_audit
from .models import ChatRequest, ChatResponse, ApprovalRequest
from .orchestrator import AgentOrchestrator
from .approvals import get_approval, resolve_approval
from .tools import reset_password

app = FastAPI(
    title="Enterprise Agentic IT Service Assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


@app.get("/")
def index():
    return FileResponse(Path(__file__).parent.parent / "static" / "index.html")


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "agentic-it-assistant"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    agent = AgentOrchestrator()
    response, approval_required, approval_id = agent.execute(
        request.message,
        request.user_id,
        request.role.upper(),
    )
    add_metric("request")
    return ChatResponse(
        response=response,
        trace=agent.trace,
        approval_required=approval_required,
        approval_id=approval_id,
    )


@app.post("/api/approvals/resolve")
def resolve(request: ApprovalRequest):
    approval = get_approval(request.approval_id)
    if not approval:
        return {"success": False, "message": "Approval not found"}

    status = resolve_approval(request.approval_id, request.approved)

    if request.approved and approval["action"] == "reset_password":
        result = reset_password(approval["target"])
        add_audit(
            approval["user_id"],
            approval["role"],
            approval["action"],
            "APPROVED_AND_EXECUTED",
            approval["target"],
        )
        return {"success": True, "status": status, "result": result}

    add_audit(
        approval["user_id"],
        approval["role"],
        approval["action"],
        status,
        approval["target"],
    )
    return {"success": True, "status": status}


@app.get("/api/monitoring")
def monitoring():
    conn = connection()

    def count(metric):
        row = conn.execute(
            "SELECT COALESCE(SUM(value),0) AS v FROM metrics WHERE metric=?",
            (metric,),
        ).fetchone()
        return int(row["v"])

    audit_count = conn.execute(
        "SELECT COUNT(*) AS c FROM audit_logs"
    ).fetchone()["c"]

    denied = conn.execute(
        "SELECT COUNT(*) AS c FROM audit_logs WHERE decision='DENIED'"
    ).fetchone()["c"]

    approvals = conn.execute(
        "SELECT COUNT(*) AS c FROM approvals"
    ).fetchone()["c"]

    recent = conn.execute(
        "SELECT user_id,role,action,decision,details,created_at "
        "FROM audit_logs ORDER BY id DESC LIMIT 10"
    ).fetchall()

   

    requests = count("request")
    tickets = count("ticket_created")
    successes = max(requests - int(denied), 0)
    conn.close()
    return{
        "requests": requests,
        "success_rate": round((successes / requests * 100), 1) if requests else 0,
        "tickets_created": tickets,
        "audit_events": audit_count,
        "authorization_denials": denied,
        "approval_requests": approvals,
        "recent_audit": [dict(x) for x in recent],
    }


