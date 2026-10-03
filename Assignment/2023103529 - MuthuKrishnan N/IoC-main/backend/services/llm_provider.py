import json
import logging
from typing import Dict, Any, Optional
import httpx
from backend.config import settings

logger = logging.getLogger("enterprise_ai.llm")

class LLMProvider:
    """Abstraction layer for LLM interactions supporting OpenAI/Gemini/Claude
    and local autonomous deterministic demo mode."""

    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL
        self.demo_mode = settings.DEMO_MODE or not bool(self.api_key)

    async def generate_completion(self, system_prompt: str, user_prompt: str, json_mode: bool = True) -> Dict[str, Any]:
        """Calls external LLM if API key configured and demo_mode is False,
        otherwise falls back to rule-based agentic reasoning."""
        if not self.demo_mode and self.api_key:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.1
                    }
                    if json_mode:
                        payload["response_format"] = {"type": "json_object"}

                    response = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        usage = data.get("usage", {})
                        parsed = json.loads(content) if json_mode else {"text": content}
                        return {
                            "data": parsed,
                            "input_tokens": usage.get("prompt_tokens", 250),
                            "output_tokens": usage.get("completion_tokens", 80),
                            "mode": "live_llm"
                        }
                    else:
                        logger.warning(f"Live LLM returned status {response.status_code}. Using demo agent intelligence.")
            except Exception as e:
                logger.error(f"Error querying live LLM: {e}. Falling back to demo agent intelligence.")

        # Autonomous high-fidelity demo mode
        return self._generate_autonomous_response(system_prompt, user_prompt)

    def _generate_autonomous_response(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Simulates LLM reasoning deterministically for capstone demonstrations."""
        lower_prompt = user_prompt.lower()
        input_tokens = len(user_prompt.split()) + len(system_prompt.split())
        output_tokens = 90

        # Intent Agent Simulation
        if "Intent Classification Agent" in system_prompt:
            category = "GENERAL_SUPPORT"
            intent = "GENERAL_INQUIRY"
            priority = "MEDIUM"

            if "damaged" in lower_prompt or "broken" in lower_prompt or "crack" in lower_prompt:
                category = "DAMAGED_PRODUCT"
                intent = "REQUEST_REPLACEMENT"
                priority = "HIGH"
            elif "refund" in lower_prompt or "money back" in lower_prompt or "return" in lower_prompt:
                category = "REFUND"
                intent = "REQUEST_REFUND"
                priority = "HIGH"
            elif "where is" in lower_prompt or "status" in lower_prompt or "tracking" in lower_prompt or "track" in lower_prompt:
                category = "ORDER_STATUS"
                intent = "CHECK_ORDER_STATUS"
                priority = "LOW"
            elif "wrong" in lower_prompt or "incorrect" in lower_prompt:
                category = "WRONG_PRODUCT"
                intent = "REQUEST_REPLACEMENT"
                priority = "MEDIUM"

            # Extract order ID if present (e.g. ORD-1001)
            import re
            match = re.search(r"ORD-\d{4}", user_prompt, re.IGNORECASE)
            order_id = match.group(0).upper() if match else None

            data = {
                "category": category,
                "intent": intent,
                "priority": priority,
                "order_id": order_id,
                "confidence": 0.94
            }
            return {
                "data": data,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "mode": "demo_agentic"
            }

        # Resolution Agent Simulation
        if "Resolution Agent" in system_prompt:
            # Check for high value refund or standard replacement
            if "25,000" in lower_prompt or "25000" in lower_prompt or "high" in lower_prompt or "ORD-1002" in user_prompt:
                data = {
                    "resolution": "AUTO_REFUND",
                    "reason": "Customer requested full refund for high-value order. Exceeds standard ₹5,000 automated ceiling; requires human supervisor sign-off.",
                    "requires_approval": True,
                    "confidence": 0.96
                }
            elif "damaged" in lower_prompt or "replacement" in lower_prompt:
                data = {
                    "resolution": "AUTO_REPLACEMENT",
                    "reason": "Item arrived damaged within the 7-day delivery replacement window. Eligible for immediate automated dispatch.",
                    "requires_approval": False,
                    "confidence": 0.92
                }
            elif "order_status" in lower_prompt or "status" in lower_prompt:
                data = {
                    "resolution": "ORDER_STATUS_RESPONSE",
                    "reason": "Customer requested delivery status. Order information verified in logistics tool.",
                    "requires_approval": False,
                    "confidence": 0.98
                }
            elif "missing" in lower_prompt:
                data = {
                    "resolution": "REQUEST_MORE_INFORMATION",
                    "reason": "Order ID was not provided in request. Cannot query logistics or determine replacement eligibility.",
                    "requires_approval": False,
                    "confidence": 0.89
                }
            else:
                data = {
                    "resolution": "CREATE_SUPPORT_TICKET",
                    "reason": "Inquiry classified as general support or non-standard request. Routed to support queue.",
                    "requires_approval": False,
                    "confidence": 0.88
                }

            return {
                "data": data,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "mode": "demo_agentic"
            }

        # Default fallback
        return {
            "data": {"result": "processed", "message": "Enterprise agent reasoning completed."},
            "input_tokens": input_tokens,
            "output_tokens": 50,
            "mode": "demo_agentic"
        }

llm_provider = LLMProvider()
