from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from backend.models.models import Notification


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        ticket_id: Optional[int] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            ticket_id=ticket_id,
            title=title,
            message=message,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def get_user_notifications(db: Session, user_id: int):
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
