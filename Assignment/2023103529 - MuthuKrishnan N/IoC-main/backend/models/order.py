from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class Order(BaseModel):
    id: str
    order_id: str
    customer_id: str
    product: str
    amount: float
    status: str  # DELIVERED, IN_TRANSIT, CANCELLED, PROCESSING
    delivery_date: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
