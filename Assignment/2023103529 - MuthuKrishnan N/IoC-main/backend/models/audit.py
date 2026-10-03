from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class AuditLog(BaseModel):
    id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    role: Optional[str] = None
    complaint_id: Optional[str] = None
    agent: Optional[str] = None
    action: str
    tool: Optional[str] = None
    result: Optional[str] = None
    status: str = "SUCCESS"  # SUCCESS, FAILED, BLOCKED, SECURITY_ALERT
    approval_required: bool = False
    approval_status: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
