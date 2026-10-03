"""Deterministic tests: SLA classification, allowlisted reads, idempotent
writes, outbox claims, identity and the tool gate. No model involved."""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

import pytest

from opscopilot.identity import Identity, PolicyDenied, authorize_tool, reroute_approver_roles


def _row(tier, hours_ago: float, status="in_transit", delivered_hours_ago=None):
    now = datetime.now(timezone.utc)
    return {
        "tier": tier,
        "pickup_at": (now - timedelta(hours=hours_ago)).isoformat(),
        "status": status,
        "delivered_at": (now - timedelta(hours=delivered_hours_ago)).isoformat() if delivered_hours_ago is not None else None,
    }


def test_sla_classification_thresholds(fresh_db):
    db = fresh_db
    assert db.classify_sla(_row("Express", 10))["sla_state"] == "on_track"       # 58% left
    assert db.classify_sla(_row("Express", 20))["sla_state"] == "at_risk"        # 17% left
    assert db.classify_sla(_row("Express", 26))["sla_state"] == "breached"
    assert db.classify_sla(_row("Standard", 96, "delivered", 20))["sla_state"] == "delivered_on_time"
    assert db.classify_sla(_row("Express", 30, "delivered", 1))["sla_state"] == "delivered_late"


def test_seeded_lane_query_returns_only_problem_shipments(fresh_db):
    rows = fresh_db.list_shipments(lane="Chennai to Mumbai")
    ids = {r["id"]: r["sla_state"] for r in rows}
    assert ids == {"SHP-1003": "breached", "SHP-1005": "breached", "SHP-1009": "at_risk"}


def test_get_shipment_includes_disruption_and_review_flag(fresh_db):
    s = fresh_db.get_shipment("SHP-1003")
    assert s["carrier_on_review"] == 1
    assert s["carrier_disruption"]["note"].startswith("Highway closure")
    assert fresh_db.get_shipment("SHP-9999") is None


def test_active_carriers_excludes_review_and_disruption(fresh_db):
    codes = {c["code"] for c in fresh_db.active_carriers_for_lane("Chennai to Mumbai")}
    assert codes == {"CAR-DEL"}  # CAR-GAT is on review and disrupted


def test_business_day_sla_skips_sundays(fresh_db):
    db = fresh_db
    sat = datetime(2026, 9, 19, 9, 0, tzinfo=timezone.utc)          # a Saturday
    assert db.sla_deadline("Standard", sat) == datetime(2026, 9, 25, 9, 0, tzinfo=timezone.utc)   # 5 business days, Sunday skipped
    assert db.sla_deadline("Express", sat) == sat + timedelta(hours=24)


def test_open_reroute_sees_pending_approvals(fresh_db):
    db = fresh_db
    assert db.open_reroute_for_shipment("SHP-1003") is None
    db.create_approval("t-x", {"shipment_id": "SHP-1003"}, "sup1", {"ops_manager"})
    assert db.open_reroute_for_shipment("SHP-1003")["kind"] == "pending_approval"
    assert db.open_reroute_for_shipment("SHP-1003", exclude_thread="t-x") is None


def test_outbox_dedupes_on_key_and_lease_is_exclusive(fresh_db):
    db = fresh_db
    e1 = db.publish_event("ShipmentRerouted", {"shipment_id": "SHP-1003"}, dedupe_key="k1")
    e2 = db.publish_event("ShipmentRerouted", {"shipment_id": "SHP-1003"}, dedupe_key="k1")
    e3 = db.publish_event("ShipmentRerouted", {"shipment_id": "SHP-1005"}, dedupe_key="k2")
    assert e1 == e2 and e3 != e1
    assert db.event_backlog() == 2
    claimed = db.claim_next_event("worker-a")
    assert claimed["id"] == e1 and claimed["attempts"] == 1
    # Leased, not consumed: a second worker gets the next event, not the same one.
    assert db.claim_next_event("worker-b")["id"] == e3
    assert db.event_backlog() == 2          # nothing acked yet
    assert db.ack_event(e1, "worker-b") is False   # fenced: not the lease holder
    assert db.ack_event(e1, "worker-a") is True
    assert db.event_backlog() == 1


def test_event_is_dead_lettered_after_max_attempts(fresh_db):
    db = fresh_db
    eid = db.publish_event("ShipmentRerouted", {}, dedupe_key="dl")
    for _ in range(db.MAX_EVENT_ATTEMPTS):
        assert db.claim_next_event("w", lease_seconds=0)["id"] == eid
    assert db.claim_next_event("w", lease_seconds=0) is None
    assert db.dead_letter_count() == 1 and db.event_backlog() == 0


def test_commit_reroute_is_atomic_and_replayable(fresh_db, monkeypatch):
    db = fresh_db
    row, replayed = db.commit_reroute("key-a", "SHP-1003", "CAR-DEL", "RR-01", "sup1", "mgr1",
                                      {"shipment_id": "SHP-1003", "customer_id": "c"}, "mgr1")
    assert not replayed and db.get_shipment("SHP-1003")["carrier_code"] == "CAR-DEL"
    assert len(db.list_events(unconsumed_only=False)) == 1
    assert db.list_audit()[0]["action"] == "reroute_committed"
    row2, replayed2 = db.commit_reroute("key-a", "SHP-1003", "CAR-BLU", "RR-01", "x", "y", {}, "y")
    assert replayed2 and row2["id"] == row["id"] and len(db.list_events(unconsumed_only=False)) == 1

    # Atomicity: make the event insert fail and check nothing else landed.
    monkeypatch.setattr(db, "publish_event", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("boom")))
    with pytest.raises(RuntimeError):
        db.commit_reroute("key-b", "SHP-1005", "CAR-GAT", "RR-01", "s", "m", {}, "m")
    assert db.get_reroute_request("key-b") is None
    assert db.get_shipment("SHP-1005")["carrier_code"] == "CAR-DEL"


def test_role_access_and_tool_gate():
    lead = Identity.for_role("u", "team_lead")
    mgr = Identity.for_role("u", "ops_manager")
    assert "confidential" not in lead.access and "confidential" in mgr.access
    authorize_tool(lead, "get_shipment_status")
    with pytest.raises(PolicyDenied):
        authorize_tool(lead, "propose_reroute")
    with pytest.raises(PermissionError):
        Identity.for_role("u", "ceo")


def test_tool_gate_denies_by_role(fresh_db, monkeypatch):
    """Exercise the denial branch of run_tool_call, not only authorize_tool."""
    from opscopilot.tools import shipments as tools
    from opscopilot import identity
    monkeypatch.setitem(identity.TOOL_ROLES, "get_shipment_status", {"ops_manager"})
    lead = Identity.for_role("lead1", "team_lead")
    out = tools.run_tool_call({"name": "get_shipment_status", "args": {"shipment_id": "SHP-1003"}}, lead)
    assert not out["ok"] and out["observation"].startswith("policy denied")
    assert fresh_db.list_audit()[0]["action"] == "tool_denied"


def test_reroute_approver_matrix_matches_sop():
    from opscopilot.identity import reroute_required_approvals
    assert reroute_approver_roles(10_000, False) == {"shift_supervisor", "ops_manager"}
    assert reroute_approver_roles(49_999, False) == {"shift_supervisor", "ops_manager"}
    assert reroute_approver_roles(50_000, False) == {"ops_manager"}
    # SOP-OPS-014 §3: cold chain needs the operations manager AND the quality lead.
    assert reroute_approver_roles(1_000, True) == {"ops_manager", "quality_lead"}
    assert reroute_required_approvals(True) == 2 and reroute_required_approvals(False) == 1


def test_sla_boundary_at_exactly_25_percent(fresh_db):
    db = fresh_db
    now = datetime.now(timezone.utc)
    row = _row("Express", 18); row["pickup_at"] = (now - timedelta(hours=18)).isoformat()
    assert db.classify_sla(row, now)["sla_state"] == "on_track"   # exactly 25.0% left is not "less than 25"
    row["pickup_at"] = (now - timedelta(hours=18, seconds=1)).isoformat()
    assert db.classify_sla(row, now)["sla_state"] == "at_risk"


def test_decide_approval_only_when_pending(fresh_db):
    db = fresh_db
    db.create_approval("t1", {"x": 1}, "sup1", {"ops_manager"})
    assert db.decide_approval("t1", "approved", "mgr1") is True
    assert db.decide_approval("t1", "rejected", "mgr2") is False
    assert db.get_approval("t1")["decided_by"] == "mgr1"


def test_tool_call_validation_and_denial(fresh_db):
    from opscopilot.tools import shipments as tools
    sup = Identity.for_role("u", "shift_supervisor")
    bad = tools.run_tool_call({"name": "get_shipment_status", "args": {"shipment_id": "DROP TABLE"}}, sup)
    assert not bad["ok"] and "invalid arguments" in bad["observation"]
    unknown = tools.run_tool_call({"name": "delete_everything", "args": {}}, sup)
    assert not unknown["ok"]
    ok = tools.run_tool_call({"name": "get_shipment_status", "args": {"shipment_id": "SHP-1003"}}, sup)
    assert ok["ok"] and json.loads(ok["observation"])["sla_state"] == "breached"
    audit = fresh_db.list_audit()
    assert audit[0]["action"] == "tool_call"
