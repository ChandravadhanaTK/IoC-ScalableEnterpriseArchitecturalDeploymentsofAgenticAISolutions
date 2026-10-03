import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.user import UserInDB
from backend.models.approval import Approval, ApprovalStatus, ApprovalReviewRequest
from backend.database.repository import repo
from backend.security.auth import get_current_user
from backend.security.rbac import require_support
from backend.agents.supervisor import supervisor_agent
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.api.approvals")
router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

def enrich_approval(item: dict) -> Approval:
    approval = Approval(**item)
    if not approval.customer_name and approval.customer_id:
        cust = repo.users.find_one({"id": approval.customer_id})
        if cust:
            approval.customer_name = cust.get("name")
    if not approval.ai_recommendation and approval.complaint_id:
        comp = repo.complaints.find_one({"id": approval.complaint_id})
        if comp:
            ai_info = comp.get("ai_analysis") or {}
            approval.ai_recommendation = (
                comp.get("resolution") or
                ai_info.get("proposed_resolution") or
                f"{comp.get('category', 'Complaint')} resolution eligible according to enterprise policy."
            )
            if not approval.amount and comp.get("order_id"):
                ord_rec = repo.orders.find_one({"order_id": comp["order_id"]})
                if ord_rec:
                    approval.amount = float(ord_rec.get("amount", 0.0))
    return approval

@router.get("", response_model=List[Approval])
async def list_approvals(
    status_filter: Optional[str] = None,
    current_user: UserInDB = Depends(require_support)
):
    query = {}
    if status_filter:
        query["status"] = status_filter
    items = repo.approvals.find(query=query, sort_key="created_at", sort_desc=True)
    return [enrich_approval(item) for item in items]

@router.get("/{approval_id}", response_model=Approval)
async def get_approval(
    approval_id: str,
    current_user: UserInDB = Depends(require_support)
):
    approval_dict = repo.approvals.find_one({"id": approval_id})
    if not approval_dict:
        raise HTTPException(status_code=404, detail="Approval record not found")
    return enrich_approval(approval_dict)

@router.post("/{approval_id}/approve")
async def approve_request(
    approval_id: str,
    payload: ApprovalReviewRequest,
    current_user: UserInDB = Depends(require_support)
):
    approval_dict = repo.approvals.find_one({"id": approval_id})
    if not approval_dict:
        raise HTTPException(status_code=404, detail="Approval record not found")

    if approval_dict.get("status") != ApprovalStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Approval request has already been reviewed")

    notes_text = payload.get_notes()
    # Update approval record
    now = datetime.utcnow()
    repo.approvals.update_one(
        {"id": approval_id},
        {
            "status": ApprovalStatus.APPROVED.value,
            "reviewed_by": current_user.email,
            "reviewed_at": now.isoformat(),
            "review_notes": notes_text
        }
    )

    telemetry.log_audit(
        action="HUMAN_APPROVAL_GRANTED",
        user_id=current_user.id,
        role=current_user.role.value,
        complaint_id=approval_dict.get("complaint_id"),
        status="SUCCESS",
        approval_required=True,
        approval_status="APPROVED",
        result=f"Support agent {current_user.name} approved {approval_dict.get('requested_action')} (Notes: {notes_text})"
    )

    # Resume supervisor workflow to execute action
    result = await supervisor_agent.resume_after_human_review(
        complaint_id=approval_dict.get("complaint_id"),
        approval_id=approval_id,
        is_approved=True,
        reviewer_user=current_user,
        review_notes=notes_text
    )

    return {"success": True, "approval_id": approval_id, "workflow_result": result}

@router.post("/{approval_id}/reject")
async def reject_request(
    approval_id: str,
    payload: ApprovalReviewRequest,
    current_user: UserInDB = Depends(require_support)
):
    approval_dict = repo.approvals.find_one({"id": approval_id})
    if not approval_dict:
        raise HTTPException(status_code=404, detail="Approval record not found")

    if approval_dict.get("status") != ApprovalStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Approval request has already been reviewed")

    notes_text = payload.get_notes()
    now = datetime.utcnow()
    repo.approvals.update_one(
        {"id": approval_id},
        {
            "status": ApprovalStatus.REJECTED.value,
            "reviewed_by": current_user.email,
            "reviewed_at": now.isoformat(),
            "review_notes": notes_text
        }
    )

    telemetry.log_audit(
        action="HUMAN_APPROVAL_REJECTED",
        user_id=current_user.id,
        role=current_user.role.value,
        complaint_id=approval_dict.get("complaint_id"),
        status="SUCCESS",
        approval_required=True,
        approval_status="REJECTED",
        result=f"Support agent {current_user.name} rejected {approval_dict.get('requested_action')} (Notes: {notes_text})"
    )

    # Resume supervisor workflow to escalate/close
    result = await supervisor_agent.resume_after_human_review(
        complaint_id=approval_dict.get("complaint_id"),
        approval_id=approval_id,
        is_approved=False,
        reviewer_user=current_user,
        review_notes=notes_text
    )

    return {"success": True, "approval_id": approval_id, "workflow_result": result}

@router.post("/{approval_id}/decision")
async def decision_request(
    approval_id: str,
    payload: dict,
    current_user: UserInDB = Depends(require_support)
):
    decision = payload.get("decision", "APPROVED").upper()
    notes = payload.get("notes", "")
    
    if decision == "APPROVED":
        review_req = ApprovalReviewRequest(notes=notes)
        res = await approve_request(approval_id=approval_id, payload=review_req, current_user=current_user)
        return {"status": "APPROVED", "success": True, "approval_id": approval_id, "workflow_result": res}
    else:
        review_req = ApprovalReviewRequest(notes=notes)
        res = await reject_request(approval_id=approval_id, payload=review_req, current_user=current_user)
        return {"status": "REJECTED", "success": True, "approval_id": approval_id, "workflow_result": res}
