from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.models.models import User
from backend.services.analytics import AnalyticsService
from backend.services.auth import get_current_user, get_db, require_roles

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return AnalyticsService.get_summary(db)
