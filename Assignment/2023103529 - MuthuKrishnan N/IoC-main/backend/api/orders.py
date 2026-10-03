import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.user import UserInDB, Role
from backend.models.order import Order
from backend.database.repository import repo
from backend.security.auth import get_current_user
from backend.security.rbac import verify_order_ownership
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.api.orders")
router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.get("", response_model=List[Order])
async def list_orders(current_user: UserInDB = Depends(get_current_user)):
    query = {}
    if current_user.role == Role.CUSTOMER:
        query["customer_id"] = current_user.id
    
    items = repo.orders.find(query=query)
    return [Order(**item) for item in items]

@router.get("/{order_id}", response_model=Order)
async def get_order_by_id(
    order_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    order_dict = repo.orders.find_one({"order_id": order_id.upper()})
    if not order_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )

    # RBAC Boundary Check
    if not verify_order_ownership(current_user, order_dict.get("customer_id")):
        telemetry.log_audit(
            action="UNAUTHORIZED_ACCESS_ATTEMPT",
            user_id=current_user.id,
            role=current_user.role.value,
            status="BLOCKED",
            error=f"Customer attempted to access order {order_id} belonging to {order_dict.get('customer_id')}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: You are not authorized to view order {order_id}"
        )

    return Order(**order_dict)
