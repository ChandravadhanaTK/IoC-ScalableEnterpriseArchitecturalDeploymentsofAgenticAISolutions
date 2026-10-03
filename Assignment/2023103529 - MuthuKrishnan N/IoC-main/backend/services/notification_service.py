import uuid
import logging
from typing import Dict, Any

logger = logging.getLogger("enterprise_ai.notification")

class DemoNotificationService:
    """Enterprise Demo Notification Service simulating multi-channel customer alerts."""

    def send_notification(self, customer_id: str, message: str, channel: str = "EMAIL") -> Dict[str, Any]:
        notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        logger.info(f"[Demo Notification Service] Dispatched {channel} to {customer_id}: '{message}' (Ref: {notification_id})")
        return {
            "success": True,
            "notification_id": notification_id,
            "channel": channel,
            "delivered": True,
            "recipient": customer_id
        }

notification_service = DemoNotificationService()
