"""The governed business API: the only way a re-route reaches the system of record.

This stands in for the carrier booking service that owns shipment routing. It
is deliberately a separate FastAPI app with its own token, because the point
of Module 5 is that the agent invokes a governed operation rather than writing
to the ERP tables. The API validates the body, checks the bearer token,
honours an Idempotency-Key header, re-validates the approver against the
SOP matrix server-side (it does not trust the caller's word), and commits the
request row, the shipment change, the ShipmentRerouted outbox event and the
audit row in one transaction.
"""
from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException, Response, status
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from pydantic import BaseModel, Field

import hmac

from ..config import settings
from ..identity import reroute_approver_roles, reroute_required_approvals
from ..telemetry import get_logger, log, set_trace_id
from . import db

logger = get_logger("business_api")
app = FastAPI(title="Carrier Booking API", version="1.0")

REASON_CODES = {"RR-01", "RR-02", "RR-03", "RR-04"}


class RerouteBody(BaseModel):
    shipment_id: str = Field(pattern=r"^SHP-\d{4}$")
    new_carrier_code: str = Field(pattern=r"^CAR-[A-Z]{3}$")
    reason_code: str
    requested_by: str
    approved_by: str
    approver_role: str
    approval_thread_id: str = Field(min_length=1, description="The approvals record that proves the signatures")


class RerouteResult(BaseModel):
    request_id: int
    shipment_id: str
    new_carrier_code: str
    status: str
    replayed: bool


def require_token(authorization: str = Header(default="")) -> None:
    expected = settings.business_api_token
    if not expected:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "BUSINESS_API_TOKEN is not configured")
    if not hmac.compare_digest(authorization, f"Bearer {expected}"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@app.get("/metrics")
def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/reroutes", response_model=RerouteResult, status_code=201, dependencies=[Depends(require_token)])
def create_reroute(body: RerouteBody, idempotency_key: str = Header(alias="Idempotency-Key"),
                   x_trace_id: str = Header(default="-", alias="X-Trace-Id")) -> RerouteResult:
    set_trace_id(x_trace_id)
    if body.reason_code not in REASON_CODES:
        raise HTTPException(422, f"unknown reason code {body.reason_code}")
    shipment = db.get_shipment(body.shipment_id)
    if shipment is None:
        raise HTTPException(404, "no such shipment")
    if shipment["status"] == "delivered":
        raise HTTPException(409, "shipment already delivered")

    approvers = [u for u in body.approved_by.split(",") if u]
    roles = [r for r in body.approver_role.split(",") if r]
    if len(approvers) != len(roles) or not approvers:
        raise HTTPException(422, "approved_by and approver_role must list the same number of signers")
    if body.requested_by in approvers:
        raise HTTPException(403, "requester may not approve their own re-route")
    allowed = reroute_approver_roles(shipment["declared_value_inr"], bool(shipment["cold_chain"]))
    bad = [r for r in roles if r not in allowed]
    if bad:
        raise HTTPException(403, f"role(s) {bad} may not approve this re-route; needs {sorted(allowed)}")
    need = reroute_required_approvals(bool(shipment["cold_chain"]))
    if len(set(approvers)) < need or (need > 1 and len(set(roles)) < need):
        raise HTTPException(403, f"this re-route needs {need} distinct approvers with distinct roles from {sorted(allowed)}")
    # Names are not proof. The signatures must exist in the approvals record
    # for this thread and shipment. In production this is a signed approval
    # token from the workflow service; here the two services share the table.
    problem = db.verify_approval_record(body.approval_thread_id, body.shipment_id, approvers, roles)
    if problem:
        raise HTTPException(403, f"approval could not be verified: {problem}")
    existing = db.get_reroute_request(idempotency_key)
    if existing is None:
        other = db.open_reroute_for_shipment(body.shipment_id, exclude_thread=body.approval_thread_id)
        if other and other["kind"] == "committed":
            raise HTTPException(409, f"{body.shipment_id} already has committed re-route request {other['id']}")
    if body.new_carrier_code not in {c["code"] for c in db.active_carriers_for_lane(shipment["lane"])}:
        raise HTTPException(422, f"{body.new_carrier_code} is not an active, undisrupted carrier on {shipment['lane']}")

    row, replayed = db.commit_reroute(
        idempotency_key, body.shipment_id, body.new_carrier_code, body.reason_code, body.requested_by, body.approved_by,
        event_payload={"shipment_id": body.shipment_id, "from_carrier": shipment["carrier_code"],
                       "to_carrier": body.new_carrier_code, "reason_code": body.reason_code,
                       "approved_by": body.approved_by, "customer_id": shipment["customer"]},
        audit_actor=body.approved_by,
    )
    log(logger, "reroute replayed" if replayed else "reroute committed", request_id=row["id"], shipment=body.shipment_id)
    return RerouteResult(request_id=row["id"], shipment_id=row["shipment_id"],
                         new_carrier_code=row["new_carrier_code"], status=row["status"], replayed=replayed)
