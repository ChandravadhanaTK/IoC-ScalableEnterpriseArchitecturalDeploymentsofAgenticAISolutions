from .admin import router as admin_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .maintenance import router as maintenance_router
from .notifications import router as notifications_router
from .tickets import router as tickets_router

__all__ = [
    "auth_router",
    "tickets_router",
    "admin_router",
    "maintenance_router",
    "analytics_router",
    "notifications_router",
]
