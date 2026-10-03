from __future__ import annotations


class NotificationAgent:
    def build_ticket_notification(self, ticket_title: str, status: str) -> dict:
        return {
            "title": "Ticket Update",
            "message": f"Ticket '{ticket_title}' is now in status: {status}.",
        }

    def build_approval_notification(self, ticket_title: str) -> dict:
        return {
            "title": "Approval requested",
            "message": f"High-priority ticket '{ticket_title}' requires admin approval.",
        }
