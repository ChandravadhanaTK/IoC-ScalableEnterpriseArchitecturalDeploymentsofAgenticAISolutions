from .auth import router as auth_router
from .complaints import router as complaints_router
from .orders import router as orders_router
from .approvals import router as approvals_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "complaints_router",
    "orders_router",
    "approvals_router",
    "admin_router"
]
