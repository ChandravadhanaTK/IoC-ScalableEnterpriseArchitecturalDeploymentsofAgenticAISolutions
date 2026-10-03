"""In-memory demo repositories. Replace these adapters with PostgreSQL repositories in production."""
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

USERS = {
    "customer@resolveai.demo": {"id": "usr-customer-1", "email": "customer@resolveai.demo", "password": "DemoPass!23", "role": "customer", "name": "Asha Customer"},
    "agent@resolveai.demo": {"id": "usr-agent-1", "email": "agent@resolveai.demo", "password": "DemoPass!23", "role": "support_agent", "name": "Ravi Support"},
    "manager@resolveai.demo": {"id": "usr-manager-1", "email": "manager@resolveai.demo", "password": "DemoPass!23", "role": "approver", "name": "Meera Manager"},
}

ORDERS = {
    "ORD-1001": {"id": "ORD-1001", "customer_id": "usr-customer-1", "product": "NovaBook 14 laptop", "purchased_days_ago": 5, "delivered": True, "evidence_received": True, "status": "delivered"},
    "ORD-1002": {"id": "ORD-1002", "customer_id": "usr-customer-1", "product": "Orbit headphones", "purchased_days_ago": 42, "delivered": True, "evidence_received": False, "status": "delivered"},
}

POLICIES = {
    "damaged_product": {"window_days": 30, "requires_evidence": True, "allowed_actions": ["replacement", "refund"], "summary": "Damaged items reported within 30 days with evidence are eligible for replacement or refund review."},
    "delivery_delay": {"window_days": 14, "requires_evidence": False, "allowed_actions": ["status_update"], "summary": "Delivery delays receive a status update and may be escalated after carrier investigation."},
}

TICKETS: dict[str, dict] = {}
AUDIT_LOGS: list[dict] = []


def now() -> datetime:
    return datetime.now(timezone.utc)


def audit(actor_id: str, action: str, ticket_id: str | None = None, metadata: dict | None = None) -> None:
    AUDIT_LOGS.append({"id": str(uuid4()), "at": now(), "actor_id": actor_id, "action": action, "ticket_id": ticket_id, "metadata": metadata or {}})


def order_for_customer(order_id: str, customer_id: str) -> dict | None:
    order = ORDERS.get(order_id)
    return deepcopy(order) if order and order["customer_id"] == customer_id else None


def policy_for(issue_type: str) -> dict | None:
    return deepcopy(POLICIES.get(issue_type))


def add_ticket(ticket: dict) -> dict:
    TICKETS[ticket["id"]] = ticket
    return ticket


def get_ticket(ticket_id: str) -> dict | None:
    ticket = TICKETS.get(ticket_id)
    return ticket


def visible_tickets(user: dict) -> list[dict]:
    items = list(TICKETS.values())
    if user["role"] == "customer":
        items = [ticket for ticket in items if ticket["customer_id"] == user["id"]]
    return sorted(items, key=lambda item: item["created_at"], reverse=True)
