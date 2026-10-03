import uuid
import logging
from typing import Dict, Any, Optional
from backend.config import settings
from backend.database.repository import repo
from backend.models.user import UserInDB
from backend.models.approval import Approval, ApprovalStatus
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.tools.replacement")

def create_replacement_request(
    complaint_id: str,
    order_id: str,
    product_name: str,
    reason: str,
    user: UserInDB,
    is_approved: bool = False
) -> Dict[str, Any]:
    """Generates replacement fulfillment order or routes for approval."""
    # Look up order to check value
    order = repo.orders.find_one({"order_id": order_id})
    amount = order.get("amount", 2000.0) if order else 2000.0

    if amount > settings.HIGH_VALUE_REPLACEMENT_THRESHOLD and not is_approved:
        approval_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        approval_record = Approval(
            id=approval_id,
            complaint_id=complaint_id,
            order_id=order_id,
            customer_id=user.id,
            requested_action="HIGH_VALUE_REPLACEMENT",
            amount=amount,
            reason=f"Replacement product value (₹{amount:,.2f}) exceeds ₹{settings.HIGH_VALUE_REPLACEMENT_THRESHOLD:,.2f}. {reason}",
            status=ApprovalStatus.PENDING,
            details={"order_id": order_id, "product": product_name, "reason": reason}
        )
        repo.approvals.insert_one(approval_record.model_dump())

        telemetry.log_audit(
            action="REPLACEMENT_APPROVAL_ENQUEUED",
            user_id=user.id,
            role=user.role,
            complaint_id=complaint_id,
            tool="create_replacement_request",
            status="PENDING",
            approval_required=True,
            result=f"Replacement order for ₹{amount:,.2f} enqueued for review"
        )
        return {
            "success": False,
            "approval_required": True,
            "approval_id": approval_id,
            "message": f"Replacement for ₹{amount:,.2f} exceeds auto ceiling and requires human review."
        }

    rep_ref = f"REP-{uuid.uuid4().hex[:8].upper()}"
    telemetry.log_audit(
        action="REPLACEMENT_CREATED",
        user_id=user.id,
        role=user.role,
        complaint_id=complaint_id,
        tool="create_replacement_request",
        status="SUCCESS",
        approval_required=False,
        result=f"Generated replacement dispatch order {rep_ref} for {product_name}"
    )

    return {
        "success": True,
        "action": "REPLACEMENT_CREATED",
        "reference_id": rep_ref,
        "product": product_name,
        "message": f"Replacement order {rep_ref} has been dispatched. A return pickup courier is assigned."
    }
