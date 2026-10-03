import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

class TraceSpan:
    def __init__(self, name: str, parent_id: Optional[str] = None):
        self.span_id = str(uuid.uuid4())[:8]
        self.parent_id = parent_id
        self.name = name
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.duration_ms: int = 0
        self.attributes: Dict[str, Any] = {}
        self.status: str = "IN_PROGRESS"
        self.events: List[Dict[str, Any]] = []

    def set_attribute(self, key: str, value: Any):
        self.attributes[key] = value

    def add_event(self, event_name: str, payload: Dict[str, Any]):
        self.events.append({
            "name": event_name,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "payload": payload
        })

    def finish(self, status: str = "OK"):
        self.end_time = time.time()
        self.duration_ms = int((self.end_time - self.start_time) * 1000)
        self.status = status
        return self

    def to_dict(self) -> Dict[str, Any]:
        return {
            "span_id": self.span_id,
            "parent_id": self.parent_id,
            "name": self.name,
            "duration_ms": self.duration_ms,
            "status": self.status,
            "attributes": self.attributes,
            "events": self.events
        }

class AgentTracer:
    def __init__(self):
        self.spans: List[TraceSpan] = []

    def start_span(self, name: str, parent_id: Optional[str] = None) -> TraceSpan:
        span = TraceSpan(name, parent_id)
        self.spans.append(span)
        return span

    def get_spans(self, limit: int = 30) -> List[Dict[str, Any]]:
        return [s.to_dict() for s in self.spans[-limit:]]

tracer = AgentTracer()
