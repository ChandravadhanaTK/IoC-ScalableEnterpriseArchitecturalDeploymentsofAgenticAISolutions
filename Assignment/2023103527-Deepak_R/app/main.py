from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from .models import ClaimIn, Decision
from .security import require, mask
from . import workflow
from .metrics import metrics

app = FastAPI(title="AgroMitra - Agentic Crop Insurance Claims", version="1.0")
STATIC = Path(__file__).parent / "static"


def view(r):
    d = r.model_dump(mode="json")
    d["claim"]["farmer_id"] = mask(r.claim.farmer_id)  # PII masking
    return d


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/")
def dashboard():
    return FileResponse(STATIC / "dashboard.html")


@app.post("/api/claims", status_code=201)
def submit(c: ClaimIn, role=Depends(require("submitter", "officer", "admin"))):
    return view(workflow.submit(c))


@app.get("/api/claims")
def list_claims(role=Depends(require("officer", "admin"))):
    return [view(r) for r in workflow.all_claims()]


@app.get("/api/claims/{cid}")
def get_claim(cid: str, role=Depends(require("submitter", "officer", "admin"))):
    r = workflow.get(cid)
    if not r:
        raise HTTPException(404, "claim not found")
    return view(r)


@app.post("/api/claims/{cid}/decision")
def decide(cid: str, d: Decision, role=Depends(require("officer", "admin"))):
    r = workflow.decide(cid, d.approve, d.reason, actor=role)
    if not r:
        raise HTTPException(409, "claim not awaiting approval")
    return view(r)


@app.get("/api/metrics")
def api_metrics(role=Depends(require("officer", "admin"))):
    return metrics.snapshot()


@app.get("/metrics", response_class=PlainTextResponse)
def prom():
    return metrics.prometheus()
