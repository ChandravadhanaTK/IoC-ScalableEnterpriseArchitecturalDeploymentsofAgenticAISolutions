from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Approval(BaseModel):
    id: str
    approval_id: Optional[str] = None
    complaint_id: str
    order_id: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    requested_action: str  # e.g., "HIGH_VALUE_REFUND", "HIGH_VALUE_REPLACEMENT"
    amount: Optional[float] = None
    reason: str
    ai_recommendation: Optional[str] = None
    status: ApprovalStatus = ApprovalStatus.PENDING
    details: Optional[Dict[str, Any]] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def model_post_init(self, __context: Any) -> None:
        if not self.approval_id:
            self.approval_id = self.id

class ApprovalReviewRequest(BaseModel):
    notes: Optional[str] = None
    reason: Optional[str] = None

    def get_notes(self) -> str:
        return self.notes or self.reason or ""
