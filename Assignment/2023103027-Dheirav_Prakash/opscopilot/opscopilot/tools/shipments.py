"""Typed tools and the gate that runs them.

The flow on the Module 3 tool-calling slide is implemented literally:
model proposes a call -> Pydantic validates the arguments -> the policy gate
checks the caller's role -> the executor runs the allowlisted query -> a typed
observation goes back to the model. The model never touches the database.
"""
from __future__ import annotations

import json
from typing import Any

from langchain_core.tools import tool
from pydantic import BaseModel, Field, ValidationError

from ..identity import Identity, PolicyDenied, authorize_tool
from ..integration import db
from ..telemetry import TOOL_CALLS, get_logger, log, span

logger = get_logger("tools")


class ShipmentStatusArgs(BaseModel):
    shipment_id: str = Field(description="Shipment id in the form SHP-NNNN", pattern=r"^SHP-\d{4}$")


class AtRiskArgs(BaseModel):
    lane: str | None = Field(default=None, description="Optional lane filter such as 'Chennai to Mumbai'")


@tool("get_shipment_status", args_schema=ShipmentStatusArgs)
def get_shipment_status(shipment_id: str) -> str:
    """Look up one shipment: carrier, tier, location, SLA state (on_track, at_risk, breached), deadline and any open carrier disruption on its lane."""
    row = db.get_shipment(shipment_id)
    if row is None:
        return json.dumps({"error": f"no shipment {shipment_id}"})
    keep = ("id", "customer", "lane", "carrier_code", "carrier_name", "carrier_on_review", "tier",
            "declared_value_inr", "cold_chain", "status", "last_location", "sla_state", "deadline",
            "remaining_pct", "window_hours", "carrier_disruption")
    return json.dumps({k: row[k] for k in keep}, default=str)


@tool("list_at_risk_shipments", args_schema=AtRiskArgs)
def list_at_risk_shipments(lane: str | None = None) -> str:
    """List shipments whose SLA state is at_risk or breached, optionally for one lane. Returns id, customer, lane, carrier, tier, sla_state and remaining_pct."""
    rows = db.list_shipments(lane=lane)
    keep = ("id", "customer", "lane", "carrier_code", "tier", "sla_state", "remaining_pct", "deadline", "cold_chain", "declared_value_inr")
    return json.dumps([{k: r[k] for k in keep} for r in rows], default=str)


READ_TOOLS = [get_shipment_status, list_at_risk_shipments]
TOOLS_BY_NAME = {t.name: t for t in READ_TOOLS}


def run_tool_call(call: dict[str, Any], identity: Identity) -> dict[str, Any]:
    """Validate, authorise, execute. Returns an observation dict for the graph."""
    name = call.get("name", "")
    args = call.get("args", {}) or {}
    tool_obj = TOOLS_BY_NAME.get(name)
    if tool_obj is None:
        TOOL_CALLS.labels(tool=name or "unknown", result="unknown_tool").inc()
        return {"tool": name, "ok": False, "args": args, "observation": f"unknown tool {name!r}"}
    try:
        validated = tool_obj.args_schema.model_validate(args)
    except ValidationError as e:
        TOOL_CALLS.labels(tool=name, result="invalid_args").inc()
        log(logger, "tool args rejected", tool=name, error=str(e))
        return {"tool": name, "ok": False, "args": args, "observation": f"invalid arguments for {name}: {e.errors()[0]['msg']}"}
    try:
        authorize_tool(identity, name)
    except PolicyDenied as e:
        TOOL_CALLS.labels(tool=name, result="denied").inc()
        db.record_audit(identity.user_id, "tool_denied", {"tool": name, "args": args})
        return {"tool": name, "ok": False, "args": args, "observation": f"policy denied: {e}"}
    with span(f"tool.{name}", logger):
        result = tool_obj.invoke(validated.model_dump())
    TOOL_CALLS.labels(tool=name, result="ok").inc()
    db.record_audit(identity.user_id, "tool_call", {"tool": name, "args": validated.model_dump()})
    return {"tool": name, "ok": True, "args": validated.model_dump(), "observation": result}
