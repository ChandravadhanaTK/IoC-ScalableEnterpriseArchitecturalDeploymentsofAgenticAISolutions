from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class AgentExecution(BaseModel):
    id: str
    complaint_id: str
    agent_name: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    status: str = "SUCCESS"  # SUCCESS, FAILED, TIMEOUT, RETRIED
    duration_ms: float = 0.0
    error: Optional[str] = None
    input_tokens: int = 0
    output_tokens: int = 0
    tool_calls: List[str] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None
