import uuid
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.models.user import UserInDB, Role
from backend.models.complaint import (
    Complaint,
    ComplaintCreate,
    ComplaintStatus,
    TimelineEvent,
    ComplaintActionPayload
)
from backend.database.repository import repo
from backend.security.auth import get_current_user
from backend.security.rbac import require_support
from backend.agents.supervisor import supervisor_agent
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.api.complaints")
router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

def enrich_complaint_with_customer(complaint_dict: dict) -> dict:
    """Enriches complaint dictionary with customer details from users collection."""
    if not complaint_dict:
        return complaint_dict
    cid = complaint_dict.get("customer_id")
    if cid:
        user_doc = repo.users.find_one({"id": cid})
        if user_doc:
            complaint_dict["customer_name"] = user_doc.get("name", "Customer")
            complaint_dict["customer_email"] = user_doc.get("email", "")
    return complaint_dict

@router.post("", response_model=Complaint, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    complaint_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"

    initial_event = TimelineEvent(
        step="RECEIVED",
        status="COMPLETED",
        timestamp=datetime.utcnow(),
        message="Complaint logged in enterprise gateway. Supervisor Agent initialized."
    )

    title = payload.title or (payload.description[:40] + "..." if len(payload.description) > 40 else payload.description)

    complaint = Complaint(
        id=complaint_id,
        complaint_id=complaint_id,
        customer_id=current_user.id,
        customer_name=current_user.name,
        customer_email=current_user.email,
        order_id=payload.order_id.strip().upper() if payload.order_id else None,
        title=title,
        description=payload.description,
        category=payload.category,
        priority="MEDIUM",
        status=ComplaintStatus.RECEIVED.value,
        timeline=[initial_event],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    repo.complaints.insert_one(complaint.model_dump())

    telemetry.log_audit(
        action="COMPLAINT_CREATED",
        user_id=current_user.id,
        role=current_user.role.value,
        complaint_id=complaint_id,
        status="SUCCESS",
        result=f"New complaint filed by {current_user.email} (Order: {payload.order_id or 'None'})"
    )

    # Immediately trigger the Supervisor Agent workflow
    await supervisor_agent.process_complaint(complaint_id=complaint_id, user=current_user)

    # Fetch updated complaint state
    updated_dict = repo.complaints.find_one({"id": complaint_id})
    enriched = enrich_complaint_with_customer(updated_dict)
    return Complaint(**enriched)

@router.get("", response_model=List[Complaint])
async def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    category_filter: Optional[str] = Query(None, alias="category"),
    search: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {}

    # CRITICAL: Strict Customer Data Isolation
    # If the user is a CUSTOMER, ALWAYS filter by customer_id = current_user.id.
    # Never allow client-supplied customer_id override.
    if current_user.role == Role.CUSTOMER:
        query["customer_id"] = current_user.id
    
    if status_filter:
        query["status"] = status_filter
    if priority_filter:
        query["priority"] = priority_filter
    if category_filter:
        query["category"] = category_filter

    items = repo.complaints.find(query=query, sort_key="created_at", sort_desc=True)

    # Optional in-memory search for title, description, or id
    if search and search.strip():
        term = search.strip().lower()
        items = [
            item for item in items
            if term in str(item.get("id", "")).lower()
            or term in str(item.get("title", "")).lower()
            or term in str(item.get("description", "")).lower()
            or term in str(item.get("order_id", "")).lower()
        ]

    results = []
    for item in items:
        enriched = enrich_complaint_with_customer(item)
        results.append(Complaint(**enriched))

    return results

@router.get("/{complaint_id}", response_model=Complaint)
async def get_complaint(
    complaint_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    complaint_dict = repo.complaints.find_one({"id": complaint_id})
    if not complaint_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint {complaint_id} not found"
        )

    # RBAC Boundary check: Customers can only access their own complaints!
    if current_user.role == Role.CUSTOMER and complaint_dict.get("customer_id") != current_user.id:
        telemetry.log_audit(
            action="UNAUTHORIZED_COMPLAINT_ACCESS",
            user_id=current_user.id,
            role=current_user.role.value,
            complaint_id=complaint_id,
            status="BLOCKED",
            error=f"Customer attempted to access complaint {complaint_id} belonging to another user"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You are not authorized to view this complaint"
        )

    enriched = enrich_complaint_with_customer(complaint_dict)
    return Complaint(**enriched)

@router.post("/{complaint_id}/process")
async def trigger_process(
    complaint_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Manually re-invokes or resumes supervisor agent for a complaint."""
    complaint = repo.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == Role.CUSTOMER and complaint.get("customer_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = await supervisor_agent.process_complaint(complaint_id=complaint_id, user=current_user)
    updated = repo.complaints.find_one({"id": complaint_id})
    enriched = enrich_complaint_with_customer(updated)
    return {"result": result, "complaint": Complaint(**enriched)}

@router.get("/{complaint_id}/timeline")
async def get_timeline(
    complaint_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    complaint_dict = repo.complaints.find_one({"id": complaint_id})
    if not complaint_dict:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == Role.CUSTOMER and complaint_dict.get("customer_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return complaint_dict.get("timeline", [])

# ==============================================================================
# SUPPORT AGENT ACTION ENDPOINTS (Required by Requirement 10, 11, 12)
# ==============================================================================

@router.post("/{complaint_id}/escalate", response_model=Complaint)
async def escalate_complaint(
    complaint_id: str,
    payload: ComplaintActionPayload,
    current_user: UserInDB = Depends(require_support)
):
    """Support agent manually escalates complaint to tier-2 or senior management."""
    complaint = repo.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.utcnow()
    notes = payload.notes or "Escalated by Support Agent for senior administrative review."

    timeline_event = TimelineEvent(
        step="ESCALATED",
        status="COMPLETED",
        timestamp=now,
        message=f"Support Agent {current_user.name} escalated complaint: {notes}",
        metadata={"reviewer": current_user.email, "notes": notes}
    )

    current_timeline = complaint.get("timeline", [])
    current_timeline.append(timeline_event.model_dump())

    update_doc = {
        "status": ComplaintStatus.ESCALATED.value,
        "priority": payload.priority or "HIGH",
        "assigned_agent": current_user.name,
        "resolution": f"[Escalated by {current_user.name}] {notes}",
        "updated_at": now.isoformat(),
        "timeline": current_timeline
    }
    repo.complaints.update_one({"id": complaint_id}, update_doc)

    telemetry.log_audit(
        action="SUPPORT_AGENT_ESCALATE",
        user_id=current_user.id,
        role=current_user.role.value,
        complaint_id=complaint_id,
        status="SUCCESS",
        result=f"Support agent {current_user.email} escalated {complaint_id} (Reason: {notes})"
    )

    updated = repo.complaints.find_one({"id": complaint_id})
    return Complaint(**enrich_complaint_with_customer(updated))

@router.post("/{complaint_id}/resolve", response_model=Complaint)
async def resolve_complaint(
    complaint_id: str,
    payload: ComplaintActionPayload,
    current_user: UserInDB = Depends(require_support)
):
    """Support agent marks complaint resolved with custom resolution explanation."""
    complaint = repo.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.utcnow()
    resolution_text = payload.resolution_text or payload.notes or "Resolved after human support investigation."

    timeline_event = TimelineEvent(
        step="RESOLVED",
        status="COMPLETED",
        timestamp=now,
        message=f"Support Agent {current_user.name} marked complaint resolved: {resolution_text}",
        metadata={"reviewer": current_user.email, "resolution": resolution_text}
    )

    current_timeline = complaint.get("timeline", [])
    current_timeline.append(timeline_event.model_dump())

    update_doc = {
        "status": ComplaintStatus.RESOLVED.value,
        "assigned_agent": current_user.name,
        "resolution": f"[Resolved by Support Agent {current_user.name}] {resolution_text}",
        "updated_at": now.isoformat(),
        "timeline": current_timeline
    }
    repo.complaints.update_one({"id": complaint_id}, update_doc)

    telemetry.log_audit(
        action="SUPPORT_AGENT_RESOLVE",
        user_id=current_user.id,
        role=current_user.role.value,
        complaint_id=complaint_id,
        status="SUCCESS",
        result=f"Support agent {current_user.email} marked {complaint_id} resolved"
    )

    updated = repo.complaints.find_one({"id": complaint_id})
    return Complaint(**enrich_complaint_with_customer(updated))

@router.post("/{complaint_id}/request-info", response_model=Complaint)
async def request_info_complaint(
    complaint_id: str,
    payload: ComplaintActionPayload,
    current_user: UserInDB = Depends(require_support)
):
    """Support agent requests additional information from the customer."""
    complaint = repo.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.utcnow()
    info_prompt = payload.notes or "Please provide additional order receipt details or photos of the damaged package."

    timeline_event = TimelineEvent(
        step="REQUEST_MORE_INFORMATION",
        status="COMPLETED",
        timestamp=now,
        message=f"Support Agent {current_user.name} requested more information: {info_prompt}",
        metadata={"reviewer": current_user.email, "request": info_prompt}
    )

    current_timeline = complaint.get("timeline", [])
    current_timeline.append(timeline_event.model_dump())

    update_doc = {
        "status": "REQUEST_MORE_INFORMATION",
        "assigned_agent": current_user.name,
        "resolution": f"Awaiting Customer Response: {info_prompt}",
        "updated_at": now.isoformat(),
        "timeline": current_timeline
    }
    repo.complaints.update_one({"id": complaint_id}, update_doc)

    telemetry.log_audit(
        action="SUPPORT_AGENT_REQUEST_INFO",
        user_id=current_user.id,
        role=current_user.role.value,
        complaint_id=complaint_id,
        status="SUCCESS",
        result=f"Support agent requested additional info on {complaint_id}: {info_prompt}"
    )

    updated = repo.complaints.find_one({"id": complaint_id})
    return Complaint(**enrich_complaint_with_customer(updated))

@router.post("/{complaint_id}/ticket", response_model=Complaint)
async def create_ticket_complaint(
    complaint_id: str,
    payload: ComplaintActionPayload,
    current_user: UserInDB = Depends(require_support)
):
    """Support agent creates an internal engineering / RMA support ticket."""
    complaint = repo.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.utcnow()
    ticket_id = f"TCK-{uuid.uuid4().hex[:8].upper()}"
    notes = payload.notes or "Internal technical engineering ticket created."

    timeline_event = TimelineEvent(
        step="CREATE_SUPPORT_TICKET",
        status="COMPLETED",
        timestamp=now,
        message=f"Support Agent {current_user.name} generated internal ticket {ticket_id}: {notes}",
        metadata={"ticket_id": ticket_id, "reviewer": current_user.email}
    )

    current_timeline = complaint.get("timeline", [])
    current_timeline.append(timeline_event.model_dump())

    update_doc = {
        "assigned_agent": current_user.name,
        "resolution": f"Internal Support Ticket {ticket_id} created: {notes}",
        "updated_at": now.isoformat(),
        "timeline": current_timeline
    }
    repo.complaints.update_one({"id": complaint_id}, update_doc)

    telemetry.log_audit(
        action="SUPPORT_TICKET_CREATED",
        user_id=current_user.id,
        role=current_user.role.value,
        complaint_id=complaint_id,
        status="SUCCESS",
        result=f"Created support ticket {ticket_id} for {complaint_id}"
    )

    updated = repo.complaints.find_one({"id": complaint_id})
    return Complaint(**enrich_complaint_with_customer(updated))
