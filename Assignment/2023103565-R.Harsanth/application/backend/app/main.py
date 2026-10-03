from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import re
import uuid

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field


BASE = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = BASE / "knowledge"
FRONTEND_DIR = BASE / "frontend"

app = FastAPI(
    title="AEGISDESK Agentic IT Support",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


RUNS: list[dict[str, Any]] = []
APPROVALS: list[dict[str, Any]] = []
AUDIT: list[dict[str, Any]] = []


class ChatRequest(BaseModel):
    message: str = Field(min_length=3, max_length=2000)
    role: str = "employee"


class ApprovalRequest(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")
    approver: str = "demo.approver"
    rationale: str = ""
    note: str = ""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def add_audit(
    request_id: str,
    event: str,
    stage: str = "",
    decision: str = "",
    status: str = "",
) -> None:
    AUDIT.append(
        {
            "request_id": request_id,
            "event": event,
            "stage": stage,
            "decision": decision,
            "status": status,
            "timestamp": now_iso(),
        }
    )


def plan(message: str):
    m = message.lower()

    protected = [
        "unlock",
        "reset password",
        "change access",
        "grant access",
        "restart my",
        "reboot my",
    ]

    if any(x in m for x in protected):
        return (
            "account_access",
            "protected_action",
            "A sensitive account or device action was requested.",
        )

    ticket_terms = [
        "create a support ticket",
        "create support ticket",
        "raise a support ticket",
        "raise ticket",
        "create ticket",
        "support request",
        "raise an issue",
    ]

    if any(x in m for x in ticket_terms):
        return (
            "ticket",
            "create_ticket",
            "Create a simulated support ticket.",
        )

    if any(x in m for x in ["wi-fi", "wifi", "wireless", "internet"]):
        return (
            "network_wifi",
            "check_wifi",
            "Check Wi-Fi connectivity and review the local runbook.",
        )

    if any(x in m for x in ["vpn", "virtual private network"]):
        return (
            "network_vpn",
            "check_vpn",
            "Check VPN status and review the local runbook.",
        )

    if any(x in m for x in ["account", "login", "sign in", "locked"]):
        return (
            "account_help",
            "check_account",
            "Check the simulated account status.",
        )

    return (
        "general",
        "none",
        "Search internal guidance and provide safe next steps.",
    )


def retrieve(message: str) -> list[dict[str, str]]:
    query_terms = set(
        re.findall(r"[a-zA-Z0-9]+", message.lower())
    )

    results: list[dict[str, str]] = []

    if KNOWLEDGE_DIR.exists():
        for path in KNOWLEDGE_DIR.glob("*.md"):
            try:
                content = path.read_text(encoding="utf-8").lower()
            except UnicodeDecodeError:
                content = path.read_text(
                    encoding="utf-8",
                    errors="ignore",
                ).lower()

            score = sum(
                1
                for term in query_terms
                if len(term) > 2 and term in content
            )

            if score > 0:
                results.append(
                    {
                        "id": path.stem.replace("-", "").replace("_", ""),
                        "title": path.stem.replace("_", " ").replace("-", " "),
                        "score": str(score),
                    }
                )

    results.sort(
        key=lambda item: int(item["score"]),
        reverse=True,
    )

    return results[:3]


def simulated_tool(action: str) -> dict[str, str]:
    if action == "check_wifi":
        return {
            "tool": "mock_network_diagnostic",
            "status": "completed",
            "details": (
                "Simulated diagnostic: DNS response was intermittent; "
                "no external network change was performed."
            ),
        }

    if action == "check_vpn":
        return {
            "tool": "mock_vpn_diagnostic",
            "status": "completed",
            "details": (
                "Simulated diagnostic: corporate VPN tunnel is "
                "disconnected; no credentials or configuration were changed."
            ),
        }

    if action == "check_account":
        return {
            "tool": "mock_account_status",
            "status": "completed",
            "details": (
                "Simulated account check completed; no account changes "
                "were performed."
            ),
        }

    if action == "create_ticket":
        return {
            "tool": "mock_ticketing",
            "status": "created",
            "ticket_id": f"DEMO-{uuid.uuid4().hex[:6].upper()}",
            "details": (
                "A simulated ticket was created; no external ticketing "
                "system was contacted."
            ),
        }

    return {
        "tool": "none",
        "status": "skipped",
        "details": "No diagnostic tool was required.",
    }


def make_approval(
    request_id: str,
    message: str,
) -> dict[str, Any]:
    approval = {
        "id": f"APR-{uuid.uuid4().hex[:6].upper()}",
        "request_id": request_id,
        "request": message,
        "action": "Protected account/device action",
        "status": "pending",
        "requested_by": "employee",
        "created_at": now_iso(),
        "approver": "",
        "decision_rationale": "",
    }

    APPROVALS.insert(0, approval)

    add_audit(
        request_id,
        "approval_created",
        stage="Policy gate",
        status="pending",
    )

    return approval


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "AEGISDESK",
    }


@app.get("/api/chat")
def chat_get():
    return {
        "status": "ok",
        "message": "Use POST /api/chat to run the assistant.",
    }


@app.post("/api/chat")
def chat(request: ChatRequest):
    started = datetime.now(timezone.utc)

    request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"

    category, action, plan_detail = plan(request.message)

    add_audit(
        request_id,
        "request_received",
        stage="Intake",
        status="received",
    )

    trace = [
        {
            "stage": "Intake",
            "status": "completed",
            "detail": "Request accepted from the employee workspace.",
        },
        {
            "stage": "Planner",
            "status": "completed",
            "detail": plan_detail,
        },
    ]

    evidence = retrieve(request.message)

    trace.append(
        {
            "stage": "Knowledge retrieval",
            "status": "completed",
            "detail": (
                f"Retrieved {len(evidence)} relevant internal "
                "knowledge source(s)."
            ),
        }
    )

    approval_id = None
    status = "resolved"

    if action == "protected_action":
        approval = make_approval(
            request_id,
            request.message,
        )

        approval_id = approval["id"]
        status = "awaiting_approval"

        trace.append(
            {
                "stage": "Tool execution",
                "status": "skipped",
                "detail": (
                    "No diagnostic was executed because the requested "
                    "operation is sensitive."
                ),
            }
        )

        trace.append(
            {
                "stage": "Policy gate",
                "status": "held",
                "detail": (
                    "Protected account/device action requires authorized "
                    "human approval."
                ),
            }
        )

        answer = (
            "This request involves a sensitive account or device action. "
            "I did not perform the action. An authorized operator must "
            "review and approve it before execution."
        )

    elif action == "create_ticket":
        tool = simulated_tool(action)

        trace.append(
            {
                "stage": "Tool execution",
                "status": "completed",
                "detail": (
                    "Mock ticketing tool executed in simulation mode."
                ),
            }
        )

        trace.append(
            {
                "stage": "Policy gate",
                "status": "allowed",
                "detail": "Mock ticket creation is permitted.",
            }
        )

        answer = (
            f"{tool['details']} "
            f"Ticket reference: {tool['ticket_id']}."
        )

        if evidence:
            titles = ", ".join(
                item["title"] for item in evidence
            )
            answer += (
                f"\n\nI also found relevant internal guidance: "
                f"{titles}."
            )

    elif action in {
        "check_wifi",
        "check_vpn",
        "check_account",
    }:
        tool = simulated_tool(action)

        trace.append(
            {
                "stage": "Tool execution",
                "status": "completed",
                "detail": tool["details"],
            }
        )

        trace.append(
            {
                "stage": "Policy gate",
                "status": "allowed",
                "detail": (
                    "Diagnostic action is read-only and permitted."
                ),
            }
        )

        if action == "check_wifi":
            answer = (
                f"{tool['details']}\n\n"
                "Try these safe steps:\n"
                "1. Disconnect and reconnect to the Wi-Fi network.\n"
                "2. Check whether another device has the same issue.\n"
                "3. Restart the Wi-Fi adapter if the issue continues."
            )

        elif action == "check_vpn":
            answer = (
                f"{tool['details']}\n\n"
                "Try these safe steps:\n"
                "1. Confirm your normal internet connection works.\n"
                "2. Reconnect the corporate VPN.\n"
                "3. If the tunnel still fails, contact IT support."
            )

        else:
            answer = (
                f"{tool['details']}\n\n"
                "For account issues, verify your username and use the "
                "approved account-recovery process."
            )

    else:
        trace.append(
            {
                "stage": "Tool execution",
                "status": "skipped",
                "detail": "No diagnostic tool was required.",
            }
        )

        trace.append(
            {
                "stage": "Policy gate",
                "status": "allowed",
                "detail": "No protected action was requested.",
            }
        )

        answer = (
            "I found internal guidance that may help. "
            "Please describe the affected service, device, and "
            "the exact error message so the support workflow can "
            "narrow down the issue."
        )

    trace.append(
        {
            "stage": "Response",
            "status": "completed",
            "detail": "A safe response was prepared for the employee.",
        }
    )

    duration_ms = max(
        1,
        int(
            (
                datetime.now(timezone.utc) - started
            ).total_seconds()
            * 1000
        ),
    )

    run = {
        "request_id": request_id,
        "created_at": now_iso(),
        "intent": action,
        "category": category,
        "status": status,
        "duration_ms": duration_ms,
    }

    RUNS.insert(0, run)

    add_audit(
        request_id,
        "request_completed",
        stage="Response",
        status=status,
    )

    return {
        "request_id": request_id,
        "category": category,
        "status": status,
        "approval_id": approval_id,
        "answer": answer,
        "evidence": evidence,
        "trace": trace,
        "duration_ms": duration_ms,
    }


@app.get("/api/approvals")
def approvals():
    return {
        "items": APPROVALS,
    }


@app.post("/api/approvals/{approval_id}")
def decide(
    approval_id: str,
    body: ApprovalRequest,
    x_role: str = Header(default="operator"),
):
    if x_role not in {"operator", "admin"}:
        raise HTTPException(
            status_code=403,
            detail="Operator role required.",
        )

    approval = next(
        (
            item
            for item in APPROVALS
            if item["id"] == approval_id
        ),
        None,
    )

    if approval is None:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found.",
        )

    if approval["status"] != "pending":
        raise HTTPException(
            status_code=409,
            detail="Approval request is already resolved.",
        )

    rationale = body.rationale or body.note

    approval["status"] = (
        "approved"
        if body.decision == "approve"
        else "rejected"
    )
    approval["approver"] = body.approver
    approval["decision_rationale"] = rationale

    add_audit(
        approval["request_id"],
        "approval_decision",
        stage="Approval workspace",
        decision=body.decision,
        status=approval["status"],
    )

    notice = (
        "Approval recorded. The protected action remains "
        "a demonstration-only workflow."
        if body.decision == "approve"
        else
        "Rejection recorded. No protected action was performed."
    )

    return {
        "status": approval["status"],
        "approval_id": approval_id,
        "notice": notice,
    }


@app.post("/api/approvals/{approval_id}/decision")
def decide_compat(
    approval_id: str,
    body: ApprovalRequest,
    x_role: str = Header(default="operator"),
):
    return decide(
        approval_id,
        body,
        x_role,
    )


@app.get("/api/metrics")
def api_metrics():
    total_runs = len(RUNS)

    if total_runs:
        avg_duration = round(
            sum(
                run["duration_ms"]
                for run in RUNS
            )
            / total_runs
        )
    else:
        avg_duration = 0

    pending = sum(
        1
        for item in APPROVALS
        if item["status"] == "pending"
    )

    safety_blocks = sum(
        1
        for run in RUNS
        if run["category"] == "account_access"
    )

    return {
        "total_runs": total_runs,
        "pending_approvals": pending,
        "safety_blocks": safety_blocks,
        "avg_duration_ms": avg_duration,
        "recent_runs": RUNS[:10],
    }


@app.get("/api/audit")
def api_audit(
    limit: int = Query(
        default=12,
        ge=1,
        le=100,
    )
):
    return {
        "items": AUDIT[-limit:][::-1],
    }


@app.get("/metrics")
def metrics_compat():
    return api_metrics()


@app.get("/api/dashboard")
def dashboard():
    return {
        "total_runs": len(RUNS),
        "pending_approvals": sum(
            1
            for item in APPROVALS
            if item["status"] == "pending"
        ),
        "recent_runs": RUNS[:10],
    }


@app.get("/")
def root():
    index = FRONTEND_DIR / "index.html"

    if not index.exists():
        return {
            "service": "AEGISDESK",
            "status": "running",
        }

    return FileResponse(index)


@app.get("/{asset_path:path}")
def frontend_assets(asset_path: str):
    requested = FRONTEND_DIR / asset_path

    if requested.is_file():
        return FileResponse(requested)

    index = FRONTEND_DIR / "index.html"

    if index.exists():
        return FileResponse(index)

    raise HTTPException(
        status_code=404,
        detail="Not found",
    )

