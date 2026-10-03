from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.models.models import User
from backend.services.auth import get_current_user, get_db
from backend.services.notification import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifications = NotificationService.get_user_notifications(db, current_user.id)
    return [
        {
            "id": item.id,
            "title": item.title,
            "message": item.message,
            "is_read": item.is_read,
            "ticket_id": item.ticket_id,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in notifications
    ]
