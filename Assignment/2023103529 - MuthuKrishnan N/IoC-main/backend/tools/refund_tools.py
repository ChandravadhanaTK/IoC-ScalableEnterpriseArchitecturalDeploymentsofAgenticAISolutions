import uuid
import logging
from typing import Dict, Any, Optional
from backend.config import settings
from backend.database.repository import repo
from backend.models.user import UserInDB, Role
from backend.models.approval import Approval, ApprovalStatus
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.tools.refund")

def create_refund_request(
    complaint_id: str,
    order_id: str,
    amount: float,
    reason: str,
    user: UserInDB,
    is_approved: bool = False
) -> Dict[str, Any]:
    """Executes or enqueues a refund request respecting policy thresholds."""
    # Check if high-value threshold is exceeded
    if amount > settings.HIGH_VALUE_REFUND_THRESHOLD and not is_approved:
        approval_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        approval_record = Approval(
            id=approval_id,
            complaint_id=complaint_id,
            order_id=order_id,
            customer_id=user.id,
            requested_action="HIGH_VALUE_REFUND",
            amount=amount,
            reason=f"Refund request of ₹{amount:,.2f} exceeds standard ceiling of ₹{settings.HIGH_VALUE_REFUND_THRESHOLD:,.2f}. {reason}",
            status=ApprovalStatus.PENDING,
            details={"order_id": order_id, "amount": amount, "reason": reason}
        )
        repo.approvals.insert_one(approval_record.model_dump())

        telemetry.log_audit(
            action="REFUND_APPROVAL_ENQUEUED",
            user_id=user.id,
            role=user.role,
            complaint_id=complaint_id,
            tool="create_refund_request",
            status="PENDING",
            approval_required=True,
            approval_status="PENDING",
            result=f"High-value refund ₹{amount:,.2f} enqueued for human support review"
        )
        return {
            "success": False,
            "approval_required": True,
            "approval_id": approval_id,
            "message": f"Refund amount of ₹{amount:,.2f} exceeds autonomous limit and requires support agent approval."
        }

    # Execute refund (low-value or previously human-approved)
    refund_ref = f"REF-{uuid.uuid4().hex[:8].upper()}"
    telemetry.log_audit(
        action="REFUND_EXECUTED",
        user_id=user.id,
        role=user.role,
        complaint_id=complaint_id,
        tool="create_refund_request",
        status="SUCCESS",
        approval_required=(amount > settings.HIGH_VALUE_REFUND_THRESHOLD),
        approval_status="APPROVED" if is_approved else "AUTO_APPROVED",
        result=f"Dispatched payout reference {refund_ref} for ₹{amount:,.2f}"
    )

    return {
        "success": True,
        "action": "REFUND_CREATED",
        "reference_id": refund_ref,
        "amount": amount,
        "message": f"Refund of ₹{amount:,.2f} successfully authorized. Funds will credit within 5-7 business days."
    }
