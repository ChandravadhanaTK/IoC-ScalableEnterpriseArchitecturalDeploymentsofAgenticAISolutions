import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel
from backend.models.user import UserInDB
from backend.tools.order_tools import get_order_details, get_order_status
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.agents.order")

class OrderAgentOutput(BaseModel):
    success: bool
    order: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    is_unauthorized: bool = False

class OrderAgent:
    """Agent that safely queries order details and delivery status via registered tools."""

    async def execute(self, complaint_id: str, order_id: str, user: UserInDB) -> OrderAgentOutput:
        start_time = datetime.utcnow()
        tool_calls = ["get_order_details"]

        result = get_order_details(order_id, user)
        completed_time = datetime.utcnow()

        if not result["success"]:
            is_unauth = result.get("error") == "UNAUTHORIZED_ORDER_ACCESS"
            telemetry.log_agent_execution(
                complaint_id=complaint_id,
                agent_name="OrderAgent",
                started_at=start_time,
                completed_at=completed_time,
                status="BLOCKED" if is_unauth else "FAILED",
                error=result.get("message") or result.get("error"),
                tool_calls=tool_calls
            )
            return OrderAgentOutput(
                success=False,
                error=result.get("message") or result.get("error"),
                is_unauthorized=is_unauth
            )

        telemetry.log_agent_execution(
            complaint_id=complaint_id,
            agent_name="OrderAgent",
            started_at=start_time,
            completed_at=completed_time,
            status="SUCCESS",
            tool_calls=tool_calls,
            metadata={"order_id": order_id, "amount": result["order"].get("amount")}
        )

        return OrderAgentOutput(success=True, order=result["order"])

order_agent = OrderAgent()
