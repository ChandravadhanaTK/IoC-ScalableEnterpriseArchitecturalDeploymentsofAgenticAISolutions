from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from backend.models.models import AuditLog


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        details: str,
        user_id: Optional[int] = None,
        ticket_id: Optional[int] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            details=details,
            ticket_id=ticket_id,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
