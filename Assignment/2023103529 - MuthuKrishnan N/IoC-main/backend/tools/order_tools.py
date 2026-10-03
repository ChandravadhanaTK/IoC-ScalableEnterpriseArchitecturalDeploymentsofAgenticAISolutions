import logging
from typing import Dict, Any, List, Optional
from backend.database.repository import repo
from backend.models.user import UserInDB, Role
from backend.security.rbac import verify_order_ownership
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.tools.order")

def get_order_details(order_id: str, user: UserInDB) -> Dict[str, Any]:
    """Retrieves order details with strict tenant/customer ownership check."""
    order = repo.orders.find_one({"order_id": order_id})
    if not order:
        telemetry.log_audit(
            action="ORDER_LOOKUP_NOT_FOUND",
            user_id=user.id,
            role=user.role,
            tool="get_order_details",
            status="FAILED",
            error=f"Order {order_id} not found"
        )
        return {"success": False, "error": f"Order {order_id} not found in database"}

    # Data Boundary Enforcement
    if not verify_order_ownership(user, order["customer_id"]):
        telemetry.log_audit(
            action="UNAUTHORIZED_ACCESS_ATTEMPT",
            user_id=user.id,
            role=user.role,
            tool="get_order_details",
            status="BLOCKED",
            error=f"Security Violation: Customer {user.id} attempted to inspect order {order_id} belonging to {order['customer_id']}"
        )
        return {
            "success": False,
            "error": "UNAUTHORIZED_ORDER_ACCESS",
            "message": f"User is not authorized to inspect order {order_id}"
        }

    telemetry.log_audit(
        action="ORDER_LOOKUP_SUCCESS",
        user_id=user.id,
        role=user.role,
        tool="get_order_details",
        status="SUCCESS",
        result=f"Retrieved order {order_id} (Status: {order.get('status')})"
    )
    return {"success": True, "order": order}

def get_order_status(order_id: str, user: UserInDB) -> Dict[str, Any]:
    """Fetches logistics tracking status for order."""
    details = get_order_details(order_id, user)
    if not details["success"]:
        return details

    order = details["order"]
    return {
        "success": True,
        "order_id": order["order_id"],
        "status": order["status"],
        "delivery_date": order.get("delivery_date"),
        "product": order.get("product")
    }

def get_customer_orders(customer_id: str, user: UserInDB) -> List[Dict[str, Any]]:
    """Fetches orders belonging to customer, respecting RBAC."""
    if user.role == Role.CUSTOMER and user.id != customer_id:
        telemetry.log_audit(
            action="UNAUTHORIZED_ORDERS_LIST_ATTEMPT",
            user_id=user.id,
            role=user.role,
            tool="get_customer_orders",
            status="BLOCKED",
            error=f"Customer {user.id} requested orders of {customer_id}"
        )
        return []

    return repo.orders.find({"customer_id": customer_id})
