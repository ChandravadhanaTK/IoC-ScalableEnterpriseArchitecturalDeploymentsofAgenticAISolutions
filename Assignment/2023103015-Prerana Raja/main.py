from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field

from .agents import orchestrator
from .monitoring import metrics
from .security import authenticate, read_audit, require_admin

app = FastAPI(title="HelpdeskAI", version="1.0.0")


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class DecisionIn(BaseModel):
    approve: bool


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
def chat(body: ChatIn, identity=Depends(authenticate)):
    return orchestrator.handle(identity, body.message)


@app.post("/approvals/{approval_id}/decide")
def decide(approval_id: str, body: DecisionIn, identity=Depends(authenticate)):
    require_admin(identity)
    result = orchestrator.decide(approval_id, body.approve, identity["user"])
    if result is None:
        raise HTTPException(404, "Unknown approval id")
    return result


@app.get("/metrics")
def get_metrics(identity=Depends(authenticate)):
    require_admin(identity)
    return metrics.snapshot()


@app.get("/audit")
def get_audit(identity=Depends(authenticate)):
    require_admin(identity)
    return read_audit()
