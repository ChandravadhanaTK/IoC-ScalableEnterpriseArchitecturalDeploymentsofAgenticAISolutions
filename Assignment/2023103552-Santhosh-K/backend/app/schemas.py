from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


Role = Literal["customer", "support_agent", "approver", "admin"]
TicketStatus = Literal["RESOLVED", "PENDING_APPROVAL", "NEEDS_INFORMATION", "ESCALATED", "REJECTED"]


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class TicketCreate(BaseModel):
    order_id: str = Field(pattern=r"^ORD-[0-9]{4}$")
    message: str = Field(min_length=8, max_length=1500)

    @field_validator("message")
    @classmethod
    def no_nulls(cls, value: str) -> str:
        if "\x00" in value:
            raise ValueError("Message contains an invalid character")
        return value.strip()


class ApprovalRequest(BaseModel):
    decision: Literal["approve", "reject"]
    note: str = Field(min_length=3, max_length=500)


class TraceStep(BaseModel):
    agent: str
    outcome: str
    timestamp: datetime
    details: dict[str, Any] = Field(default_factory=dict)


class TicketOut(BaseModel):
    id: str
    customer_id: str
    order_id: str
    message: str
    status: TicketStatus
    issue_type: str
    proposed_action: str | None
    customer_response: str
    created_at: datetime
    updated_at: datetime
    traces: list[TraceStep]
