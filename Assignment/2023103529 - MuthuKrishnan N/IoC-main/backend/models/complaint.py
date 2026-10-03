from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ComplaintStatus(str, Enum):
    RECEIVED = "RECEIVED"
    CLASSIFYING = "CLASSIFYING"
    FETCHING_ORDER = "FETCHING_ORDER"
    RETRIEVING_POLICY = "RETRIEVING_POLICY"
    ANALYZING = "ANALYZING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    PENDING_APPROVAL = "AWAITING_APPROVAL"
    EXECUTING_ACTION = "EXECUTING_ACTION"
    RESOLVED = "RESOLVED"
    ACTION_EXECUTED = "RESOLVED"
    ESCALATED = "ESCALATED"
    FAILED = "FAILED"
    CLOSED = "CLOSED"
    FLAGGED_SAFETY = "FLAGGED_SAFETY"

class ComplaintCategory(str, Enum):
    REFUND = "REFUND"
    REPLACEMENT = "REPLACEMENT"
    DAMAGED_PRODUCT = "DAMAGED_PRODUCT"
    WRONG_PRODUCT = "WRONG_PRODUCT"
    ORDER_STATUS = "ORDER_STATUS"
    PAYMENT_ISSUE = "PAYMENT_ISSUE"
    DELIVERY_ISSUE = "DELIVERY_ISSUE"
    PRODUCT_ISSUE = "PRODUCT_ISSUE"
    GENERAL_SUPPORT = "GENERAL_SUPPORT"
    OTHER = "OTHER"

class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ProposedResolution(str, Enum):
    AUTO_REFUND = "AUTO_REFUND"
    AUTO_REPLACEMENT = "AUTO_REPLACEMENT"
    ORDER_STATUS_RESPONSE = "ORDER_STATUS_RESPONSE"
    CREATE_SUPPORT_TICKET = "CREATE_SUPPORT_TICKET"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    REJECT_REQUEST = "REJECT_REQUEST"
    REQUEST_MORE_INFORMATION = "REQUEST_MORE_INFORMATION"

class TimelineEvent(BaseModel):
    step: str
    status: str  # PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message: str
    metadata: Optional[Dict[str, Any]] = None

class ResolutionPlan(BaseModel):
    resolution: Optional[str] = None
    reason: Optional[str] = None
    requires_approval: bool = False
    confidence: Optional[float] = None
    risk_assessment: Optional[str] = None

class ActionResult(BaseModel):
    success: bool = False
    action: Optional[str] = None
    message: Optional[str] = None
    reference_id: Optional[str] = None

class AIAnalysis(BaseModel):
    detected_category: Optional[str] = None
    customer_intent: Optional[str] = None
    sentiment: Optional[str] = None
    priority: Optional[str] = None
    extracted_order_id: Optional[str] = None
    policy_citations: List[Dict[str, Any]] = Field(default_factory=list)
    proposed_resolution: Optional[str] = None
    reason: Optional[str] = None
    requires_approval: bool = False
    confidence: Optional[float] = None
    risk_assessment: Optional[str] = None
    executed_action: Optional[Dict[str, Any]] = None

class ComplaintCreate(BaseModel):
    title: Optional[str] = None
    description: str
    order_id: Optional[str] = None
    category: Optional[str] = None
    attachment_name: Optional[str] = None

class ComplaintActionPayload(BaseModel):
    notes: Optional[str] = None
    resolution_text: Optional[str] = None
    priority: Optional[str] = None

class Complaint(BaseModel):
    id: str
    complaint_id: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    assigned_agent: Optional[str] = None
    order_id: Optional[str] = None
    title: str = "Customer Complaint"
    description: str
    category: Optional[str] = None
    priority: str = "MEDIUM"
    status: str = "RECEIVED"
    resolution: Optional[str] = None
    ai_analysis: Optional[AIAnalysis] = None
    resolution_plan: Optional[ResolutionPlan] = None
    action_result: Optional[ActionResult] = None
    retrieved_policies: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)
    state_history: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def model_post_init(self, __context: Any) -> None:
        if not self.complaint_id:
            self.complaint_id = self.id
        if not self.state_history and self.timeline:
            self.state_history = [t.model_dump() if hasattr(t, 'model_dump') else dict(t) for t in self.timeline]
