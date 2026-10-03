import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel
from backend.models.user import UserInDB
from backend.tools.refund_tools import create_refund_request
from backend.tools.replacement_tools import create_replacement_request
from backend.tools.support_tools import create_support_ticket, send_customer_notification
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.agents.action")

class ActionAgentOutput(BaseModel):
    success: bool
    action: str
    reference_id: Optional[str] = None
    message: str
    details: Optional[Dict[str, Any]] = None

class ActionAgent:
    """Agent that safely executes authorized business actions via verified tools."""

    async def execute_resolution(
        self,
        complaint_id: str,
        resolution: str,
        reason: str,
        action_payload: Dict[str, Any],
        user: UserInDB,
        is_human_approved: bool = False
    ) -> ActionAgentOutput:
        start_time = datetime.utcnow()
        tool_calls = []

        order_id = action_payload.get("order_id", "N/A")
        amount = float(action_payload.get("amount", 0.0))
        product = action_payload.get("product", "Product Item")

        if resolution == "AUTO_REFUND":
            tool_calls.append("create_refund_request")
            tool_calls.append("send_customer_notification")
            result = create_refund_request(
                complaint_id=complaint_id,
                order_id=order_id,
                amount=amount,
                reason=reason,
                user=user,
                is_approved=is_human_approved
            )
            if not result.get("success"):
                completed_time = datetime.utcnow()
                telemetry.log_agent_execution(
                    complaint_id=complaint_id,
                    agent_name="ActionAgent",
                    started_at=start_time,
                    completed_at=completed_time,
                    status="APPROVAL_PENDING" if result.get("approval_required") else "FAILED",
                    tool_calls=tool_calls
                )
                return ActionAgentOutput(
                    success=False,
                    action="REFUND_PENDING_APPROVAL",
                    reference_id=result.get("approval_id"),
                    message=result.get("message", "Approval required.")
                )

            # Notify customer
            send_customer_notification(
                customer_id=user.id,
                message=f"Your refund request for order {order_id} (Ref: {result.get('reference_id')}) has been processed."
            )

            completed_time = datetime.utcnow()
            telemetry.log_agent_execution(
                complaint_id=complaint_id,
                agent_name="ActionAgent",
                started_at=start_time,
                completed_at=completed_time,
                status="SUCCESS",
                tool_calls=tool_calls,
                metadata={"reference_id": result.get("reference_id"), "amount": amount}
            )

            return ActionAgentOutput(
                success=True,
                action="REFUND_EXECUTED",
                reference_id=result.get("reference_id"),
                message=result.get("message"),
                details=result
            )

        elif resolution == "AUTO_REPLACEMENT":
            tool_calls.append("create_replacement_request")
            tool_calls.append("send_customer_notification")
            result = create_replacement_request(
                complaint_id=complaint_id,
                order_id=order_id,
                product_name=product,
                reason=reason,
                user=user,
                is_approved=is_human_approved
            )

            if not result.get("success"):
                completed_time = datetime.utcnow()
                telemetry.log_agent_execution(
                    complaint_id=complaint_id,
                    agent_name="ActionAgent",
                    started_at=start_time,
                    completed_at=completed_time,
                    status="APPROVAL_PENDING" if result.get("approval_required") else "FAILED",
                    tool_calls=tool_calls
                )
                return ActionAgentOutput(
                    success=False,
                    action="REPLACEMENT_PENDING_APPROVAL",
                    reference_id=result.get("approval_id"),
                    message=result.get("message", "Approval required.")
                )

            send_customer_notification(
                customer_id=user.id,
                message=f"Replacement dispatch order {result.get('reference_id')} created for {product}."
            )

            completed_time = datetime.utcnow()
            telemetry.log_agent_execution(
                complaint_id=complaint_id,
                agent_name="ActionAgent",
                started_at=start_time,
                completed_at=completed_time,
                status="SUCCESS",
                tool_calls=tool_calls,
                metadata={"reference_id": result.get("reference_id")}
            )

            return ActionAgentOutput(
                success=True,
                action="REPLACEMENT_CREATED",
                reference_id=result.get("reference_id"),
                message=result.get("message"),
                details=result
            )

        elif resolution == "ORDER_STATUS_RESPONSE":
            tool_calls.append("send_customer_notification")
            status_msg = f"Order {order_id} is {action_payload.get('status')}."
            send_customer_notification(user.id, status_msg)

            completed_time = datetime.utcnow()
            telemetry.log_agent_execution(
                complaint_id=complaint_id,
                agent_name="ActionAgent",
                started_at=start_time,
                completed_at=completed_time,
                status="SUCCESS",
                tool_calls=tool_calls
            )

            return ActionAgentOutput(
                success=True,
                action="STATUS_PROVIDED",
                message=status_msg,
                details=action_payload
            )

        elif resolution == "REQUEST_MORE_INFORMATION":
            tool_calls.append("send_customer_notification")
            msg = "Please reply with your valid Order ID (e.g. ORD-1001) to allow our system to verify tracking and policy coverage."
            send_customer_notification(user.id, msg)

            completed_time = datetime.utcnow()
            telemetry.log_agent_execution(
                complaint_id=complaint_id,
                agent_name="ActionAgent",
                started_at=start_time,
                completed_at=completed_time,
                status="SUCCESS",
                tool_calls=tool_calls
            )

            return ActionAgentOutput(
                success=True,
                action="INFORMATION_REQUESTED",
                message=msg
            )

        else:
            # CREATE_SUPPORT_TICKET or default
            tool_calls.append("create_support_ticket")
            tool_calls.append("send_customer_notification")
            ticket = create_support_ticket(complaint_id, issue_type=resolution, priority="MEDIUM", user=user)

            send_customer_notification(user.id, f"Support Ticket {ticket.get('ticket_id')} has been created for your request.")

            completed_time = datetime.utcnow()
            telemetry.log_agent_execution(
                complaint_id=complaint_id,
                agent_name="ActionAgent",
                started_at=start_time,
                completed_at=completed_time,
                status="SUCCESS",
                tool_calls=tool_calls,
                metadata={"ticket_id": ticket.get("ticket_id")}
            )

            return ActionAgentOutput(
                success=True,
                action="TICKET_DISPATCHED",
                reference_id=ticket.get("ticket_id"),
                message=ticket.get("message")
            )

action_agent = ActionAgent()
