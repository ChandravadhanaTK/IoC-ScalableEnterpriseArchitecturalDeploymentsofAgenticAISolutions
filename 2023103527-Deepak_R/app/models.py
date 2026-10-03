from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class Status(str, Enum):
    RECEIVED = "RECEIVED"
    VALIDATED = "VALIDATED"
    RISK_SCORED = "RISK_SCORED"
    ASSESSED = "ASSESSED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class ClaimIn(BaseModel):
    farmer_id: str = Field(min_length=6, max_length=20)
    crop: str = Field(min_length=2, max_length=40)
    district: str = Field(min_length=2, max_length=40)
    acres: float = Field(gt=0, le=500)
    loss_percent: float = Field(ge=0, le=100)
    cause: str
    claim_amount: float = Field(gt=0)
    notes: str = Field(default="", max_length=500)


class Decision(BaseModel):
    approve: bool
    reason: str = Field(min_length=3, max_length=200)


class AuditEvent(BaseModel):
    ts: float
    actor: str
    event: str
    detail: str = ""


class ClaimRecord(BaseModel):
    id: str
    claim: ClaimIn
    status: Status = Status.RECEIVED
    risk_score: Optional[float] = None
    risk_reasons: List[str] = []
    payable_amount: Optional[float] = None
    needs_human: bool = False
    final_reason: str = ""
    audit: List[AuditEvent] = []
