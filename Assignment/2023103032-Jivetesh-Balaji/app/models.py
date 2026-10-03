from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    user_id: str = "U1001"
    role: str = "EMPLOYEE"


class ChatResponse(BaseModel):
    response: str
    trace: List[Dict[str, Any]]
    approval_required: bool = False
    approval_id: Optional[str] = None


class ApprovalRequest(BaseModel):
    approval_id: str
    approved: bool
