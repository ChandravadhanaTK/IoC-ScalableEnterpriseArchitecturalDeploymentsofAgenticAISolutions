import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.services.llm_provider import llm_provider
from backend.monitoring.telemetry import telemetry
from backend.security.guardrails import detect_prompt_injection

logger = logging.getLogger("enterprise_ai.agents.intent")

class IntentClassificationOutput(BaseModel):
    category: str
    intent: str
    priority: str
    order_id: Optional[str] = None
    confidence: float = 0.90
    security_flag: Optional[str] = None

class IntentAgent:
    """Agent responsible for classifying customer intent, extracting order IDs,
    assessing priority, and detecting prompt injection attempts."""

    SYSTEM_PROMPT = """You are the Intent Classification Agent for an Enterprise Support Platform.
Analyze the customer's complaint and output a JSON object with:
- category: One of [REFUND, REPLACEMENT, DAMAGED_PRODUCT, WRONG_PRODUCT, ORDER_STATUS, PAYMENT_ISSUE, DELIVERY_ISSUE, PRODUCT_ISSUE, GENERAL_SUPPORT, OTHER]
- intent: Concrete customer intent (e.g. REQUEST_REPLACEMENT, REQUEST_REFUND, CHECK_ORDER_STATUS, REPORT_DEFECT)
- priority: One of [LOW, MEDIUM, HIGH, CRITICAL]
- order_id: Extracted order ID if mentioned (e.g. ORD-1001) or null
- confidence: Estimated model confidence between 0.0 and 1.0"""

    async def execute(self, complaint_id: str, title: str, description: str, explicit_order_id: Optional[str] = None) -> IntentClassificationOutput:
        start_time = datetime.utcnow()
        user_prompt = f"Title: {title}\nDescription: {description}\nProvided Order ID: {explicit_order_id or 'None'}"

        # Step 1: Guardrail prompt injection detection
        is_injected, reason = detect_prompt_injection(f"{title} {description}")
        if is_injected:
            telemetry.log_audit(
                action="PROMPT_INJECTION_DETECTED",
                complaint_id=complaint_id,
                agent="IntentAgent",
                status="SECURITY_ALERT",
                error=f"Guardrail intercepted: {reason}"
            )
            completed_time = datetime.utcnow()
            telemetry.log_agent_execution(
                complaint_id=complaint_id,
                agent_name="IntentAgent",
                started_at=start_time,
                completed_at=completed_time,
                status="SECURITY_ALERT",
                error=reason
            )
            return IntentClassificationOutput(
                category="OTHER",
                intent="FLAGGED_PROMPT_INJECTION",
                priority="CRITICAL",
                order_id=explicit_order_id,
                confidence=0.99,
                security_flag=reason
            )

        # Step 2: LLM Classification
        response = await llm_provider.generate_completion(self.SYSTEM_PROMPT, user_prompt, json_mode=True)
        data = response.get("data", {})
        
        # Override with explicit order_id if user supplied it in the form
        extracted_order_id = explicit_order_id or data.get("order_id")
        if extracted_order_id and extracted_order_id.strip():
            extracted_order_id = extracted_order_id.strip().upper()

        output = IntentClassificationOutput(
            category=data.get("category", "GENERAL_SUPPORT"),
            intent=data.get("intent", "GENERAL_INQUIRY"),
            priority=data.get("priority", "MEDIUM"),
            order_id=extracted_order_id,
            confidence=float(data.get("confidence", 0.92))
        )

        completed_time = datetime.utcnow()
        telemetry.log_agent_execution(
            complaint_id=complaint_id,
            agent_name="IntentAgent",
            started_at=start_time,
            completed_at=completed_time,
            status="SUCCESS",
            input_tokens=response.get("input_tokens", 180),
            output_tokens=response.get("output_tokens", 60),
            metadata={"category": output.category, "intent": output.intent, "priority": output.priority}
        )

        return output

intent_agent = IntentAgent()
