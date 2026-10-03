import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from backend.database.repository import repo
from backend.models.user import UserInDB
from backend.models.complaint import ComplaintStatus, TimelineEvent
from backend.monitoring.telemetry import telemetry
from backend.services.notification_service import notification_service

logger = logging.getLogger("enterprise_ai.tools.support")

def create_support_ticket(
    complaint_id: str,
    issue_type: str,
    priority: str,
    user: UserInDB
) -> Dict[str, Any]:
    """Generates an internal support escalation ticket."""
    ticket_id = f"TCK-{uuid.uuid4().hex[:8].upper()}"
    telemetry.log_audit(
        action="SUPPORT_TICKET_CREATED",
        user_id=user.id,
        role=user.role,
        complaint_id=complaint_id,
        tool="create_support_ticket",
        status="SUCCESS",
        result=f"Generated support ticket {ticket_id} (Priority: {priority})"
    )
    return {
        "success": True,
        "action": "TICKET_CREATED",
        "ticket_id": ticket_id,
        "issue_type": issue_type,
        "priority": priority,
        "message": f"Support ticket {ticket_id} created and assigned to Tier-2 Technical Specialists."
    }

def update_complaint_status(
    complaint_id: str,
    status: ComplaintStatus,
    message: str,
    user: Optional[UserInDB] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """Updates complaint lifecycle state and appends to the timeline."""
    complaint = repo.complaints.find_one({"id": complaint_id})
    if not complaint:
        return False

    timeline_event = TimelineEvent(
        step=status.value,
        status="COMPLETED" if status not in [ComplaintStatus.FAILED, ComplaintStatus.AWAITING_APPROVAL] else status.value,
        timestamp=datetime.utcnow(),
        message=message,
        metadata=metadata
    )

    current_timeline = complaint.get("timeline", [])
    current_timeline.append(timeline_event.model_dump())

    update_payload = {
        "status": status.value,
        "updated_at": datetime.utcnow().isoformat(),
        "timeline": current_timeline
    }
    repo.complaints.update_one({"id": complaint_id}, update_payload)

    telemetry.log_audit(
        action="COMPLAINT_STATUS_TRANSITION",
        user_id=user.id if user else "SUPERVISOR_AGENT",
        role=user.role if user else "SYSTEM",
        complaint_id=complaint_id,
        tool="update_complaint_status",
        status="SUCCESS",
        result=f"State transitioned to {status.value}: {message}"
    )
    return True

def send_customer_notification(customer_id: str, message: str, channel: str = "EMAIL") -> Dict[str, Any]:
    """Sends notification to customer via notification service."""
    return notification_service.send_notification(customer_id, message, channel)
