import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from backend.config import settings
from backend.services.llm_provider import llm_provider
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.agents.resolution")

class ResolutionAgentOutput(BaseModel):
    resolution: str  # AUTO_REFUND, AUTO_REPLACEMENT, ORDER_STATUS_RESPONSE, CREATE_SUPPORT_TICKET, HUMAN_REVIEW, REJECT_REQUEST, REQUEST_MORE_INFORMATION
    reason: str
    requires_approval: bool = False
    confidence: float = 0.92
    risk_assessment: str = "LOW"
    action_payload: Dict[str, Any] = Field(default_factory=dict)

class ResolutionAgent:
    """Agent that synthesizes complaint facts, intent, order data, and policy evidence
    to determine the optimal resolution and evaluate human approval requirements."""

    SYSTEM_PROMPT = """You are the Enterprise Resolution Agent.
Evaluate customer complaint details, order information, and retrieved policy clauses.
Decide the appropriate resolution from:
- AUTO_REFUND
- AUTO_REPLACEMENT
- ORDER_STATUS_RESPONSE
- CREATE_SUPPORT_TICKET
- HUMAN_REVIEW
- REJECT_REQUEST
- REQUEST_MORE_INFORMATION

Output a JSON object with:
- resolution: one of the above
- reason: clear, policy-referenced justification
- requires_approval: boolean (true if refund > 5000, high value, or policy ambiguity)
- confidence: internal model confidence estimate (0.0 - 1.0)
- risk_assessment: LOW, MEDIUM, or HIGH"""

    async def execute(
        self,
        complaint_id: str,
        complaint_text: str,
        category: str,
        intent: str,
        order: Optional[Dict[str, Any]],
        policy_chunks: List[Dict[str, Any]],
        missing_order: bool = False
    ) -> ResolutionAgentOutput:
        start_time = datetime.utcnow()

        # Rule check: Missing order ID
        if missing_order or not order:
            if category in ["REFUND", "REPLACEMENT", "DAMAGED_PRODUCT", "ORDER_STATUS"]:
                completed_time = datetime.utcnow()
                telemetry.log_agent_execution(
                    complaint_id=complaint_id,
                    agent_name="ResolutionAgent",
                    started_at=start_time,
                    completed_at=completed_time,
                    status="SUCCESS",
                    metadata={"resolution": "REQUEST_MORE_INFORMATION"}
                )
                return ResolutionAgentOutput(
                    resolution="REQUEST_MORE_INFORMATION",
                    reason="Order ID is required to look up purchase details, delivery date, and warranty eligibility.",
                    requires_approval=False,
                    confidence=0.95,
                    risk_assessment="LOW"
                )

        order_amount = float(order.get("amount", 0.0))
        order_status = order.get("status", "")

        # Format prompt for LLM or autonomous provider
        policy_text = "\n".join([f"- {c.get('document_name')}: {c.get('text')}" for c in policy_chunks])
        user_prompt = (
            f"Complaint: {complaint_text}\n"
            f"Category: {category}, Intent: {intent}\n"
            f"Order Details: ID={order.get('order_id')}, Product={order.get('product')}, Amount=₹{order_amount}, Status={order_status}, Delivery={order.get('delivery_date')}\n"
            f"Relevant Policy Rules:\n{policy_text}"
        )

        response = await llm_provider.generate_completion(self.SYSTEM_PROMPT, user_prompt, json_mode=True)
        data = response.get("data", {})

        resolution = data.get("resolution", "CREATE_SUPPORT_TICKET")
        reason = data.get("reason", "Resolution determined according to enterprise support guidelines.")
        requires_approval = data.get("requires_approval", False)
        confidence = float(data.get("confidence", 0.90))
        risk_assessment = data.get("risk_assessment", "LOW")

        # Hard guardrail verification:
        # 1. Any refund > ₹5,000 strictly requires human approval
        if category == "REFUND" or "REFUND" in resolution:
            if order_amount > settings.HIGH_VALUE_REFUND_THRESHOLD:
                requires_approval = True
                risk_assessment = "HIGH"
                reason = f"Refund amount (₹{order_amount:,.2f}) exceeds the ₹{settings.HIGH_VALUE_REFUND_THRESHOLD:,.2f} automated ceiling. Mandatory Support Agent review required by corporate finance guardrail."

        # 2. Replacement > ₹10,000 strictly requires human approval
        if "REPLACEMENT" in resolution:
            if order_amount > settings.HIGH_VALUE_REPLACEMENT_THRESHOLD:
                requires_approval = True
                risk_assessment = "HIGH"
                reason = f"Replacement item value (₹{order_amount:,.2f}) exceeds the ₹{settings.HIGH_VALUE_REPLACEMENT_THRESHOLD:,.2f} threshold. Human approval required."

        # 3. Order status check requires no approval
        if resolution == "ORDER_STATUS_RESPONSE" or category == "ORDER_STATUS":
            requires_approval = False
            risk_assessment = "LOW"
            reason = f"Logistics tool confirmed order {order.get('order_id')} is currently {order_status} (Delivery Date: {order.get('delivery_date')})."

        action_payload = {
            "order_id": order.get("order_id"),
            "product": order.get("product"),
            "amount": order_amount,
            "status": order_status
        }

        output = ResolutionAgentOutput(
            resolution=resolution,
            reason=reason,
            requires_approval=requires_approval,
            confidence=confidence,
            risk_assessment=risk_assessment,
            action_payload=action_payload
        )

        completed_time = datetime.utcnow()
        telemetry.log_agent_execution(
            complaint_id=complaint_id,
            agent_name="ResolutionAgent",
            started_at=start_time,
            completed_at=completed_time,
            status="SUCCESS",
            input_tokens=response.get("input_tokens", 260),
            output_tokens=response.get("output_tokens", 85),
            metadata={"resolution": output.resolution, "requires_approval": output.requires_approval}
        )

        return output

resolution_agent = ResolutionAgent()
