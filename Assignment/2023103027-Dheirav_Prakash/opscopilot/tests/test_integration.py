"""Stage C and D deterministic tests: the governed business API, the client's
idempotent retry, the event worker, and the copilot API's runtime contract."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def business(fresh_db):
    import opscopilot.integration.business_api as api
    import opscopilot.integration.business_client as client
    return api, client, fresh_db


def _post(api, body, key="k1", token="t0k3n"):
    c = TestClient(api.app)
    return c.post("/reroutes", json=body, headers={"Authorization": f"Bearer {token}", "Idempotency-Key": key})


GOOD = {"shipment_id": "SHP-1003", "new_carrier_code": "CAR-DEL", "reason_code": "RR-01",
        "requested_by": "sup1", "approved_by": "mgr1", "approver_role": "ops_manager", "approval_thread_id": "t-good"}


@pytest.fixture(autouse=True)
def approval_records(fresh_db):
    """The business API verifies signatures against the approvals table, so
    give it approved records that match the bodies the tests post."""
    db = fresh_db
    db.create_approval("t-good", {"shipment_id": "SHP-1003"}, "sup1", {"ops_manager"})
    db.add_signature("t-good", "mgr1", "ops_manager"); db.decide_approval("t-good", "approved", "mgr1")
    db.create_approval("t-cold", {"shipment_id": "SHP-1001"}, "sup1", {"ops_manager", "quality_lead"}, 2)
    db.add_signature("t-cold", "mgr1", "ops_manager"); db.add_signature("t-cold", "ql1", "quality_lead"); db.decide_approval("t-cold", "approved", "mgr1,ql1")
    db.create_approval("t-1009", {"shipment_id": "SHP-1009"}, "sup1", {"ops_manager"})
    db.add_signature("t-1009", "mgr1", "ops_manager"); db.decide_approval("t-1009", "approved", "mgr1")


def test_business_api_requires_token_and_validates(business):
    api, _, _ = business
    assert _post(api, GOOD, token="wrong").status_code == 401
    assert _post(api, {**GOOD, "shipment_id": "nope"}).status_code == 422
    assert _post(api, {**GOOD, "reason_code": "RR-99"}).status_code == 422
    assert _post(api, {**GOOD, "shipment_id": "SHP-1008"}).status_code == 409   # delivered
    # Server-side policy: approver role, separation of duties, carrier eligibility.
    assert _post(api, {**GOOD, "approver_role": "shift_supervisor"}).status_code == 403   # 65k needs ops_manager
    assert _post(api, {**GOOD, "approved_by": "sup1"}).status_code == 403                 # self-approval
    assert _post(api, {**GOOD, "new_carrier_code": "CAR-GAT"}).status_code == 422         # on review + disrupted
    # Cold chain (SHP-1001) needs two distinct roles.
    cold = {**GOOD, "shipment_id": "SHP-1001", "new_carrier_code": "CAR-DEL", "approved_by": "mgr1", "approver_role": "ops_manager", "approval_thread_id": "t-cold"}
    assert _post(api, cold, key="c1").status_code == 403
    both = {**cold, "approved_by": "mgr1,ql1", "approver_role": "ops_manager,quality_lead"}
    # Names alone are not proof: a forged signer that is not in the approvals record is refused.
    forged = {**both, "approved_by": "ghost1,ghost2"}
    assert _post(api, forged, key="c3").status_code == 403
    assert _post(api, both, key="c2").status_code == 201


def test_business_api_commits_once_and_publishes_event(business):
    api, _, db = business
    r1 = _post(api, GOOD, key="same")
    r2 = _post(api, GOOD, key="same")
    assert r1.status_code == 201 and r1.json()["replayed"] is False
    assert r2.status_code == 201 and r2.json()["replayed"] is True
    assert r1.json()["request_id"] == r2.json()["request_id"]
    assert db.get_shipment("SHP-1003")["carrier_code"] == "CAR-DEL"
    events = db.list_events(unconsumed_only=False)
    assert len(events) == 1 and events[0]["event_type"] == "ShipmentRerouted"
    # A second booking for the same shipment under a new key is refused.
    assert _post(api, GOOD, key="another").status_code == 409
    assert len(db.list_events(unconsumed_only=False)) == 1


def test_client_retries_then_succeeds_and_breaker_opens(business, monkeypatch):
    _, client, _ = business
    calls = {"n": 0}

    class Flaky:
        def __init__(self, status): self.status = status
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def post(self, *a, **k):
            calls["n"] += 1
            import httpx
            if calls["n"] < 3:
                raise httpx.ConnectError("down")
            return httpx.Response(201, json={"request_id": 1, "shipment_id": "SHP-1003", "new_carrier_code": "CAR-DEL", "status": "committed", "replayed": False})

    monkeypatch.setattr(client, "_client", lambda: Flaky(201))
    monkeypatch.setattr(client.time, "sleep", lambda s: None)
    out = client.create_reroute("SHP-1003", "CAR-DEL", "RR-02", "a", "b", "ops_manager", "k")
    assert out["status"] == "committed" and calls["n"] == 3

    # Three straight failures open the breaker; the next call is refused fast.
    class Dead(Flaky):
        def post(self, *a, **k):
            import httpx
            raise httpx.ConnectError("down")
    monkeypatch.setattr(client, "_client", lambda: Dead(0))
    client._breaker.failures = 0
    with pytest.raises(client.BusinessApiError, match="unavailable after retries"):
        client.create_reroute("SHP-1003", "CAR-DEL", "RR-02", "a", "b", "ops_manager", "k2")
    with pytest.raises(client.BusinessApiError, match="circuit open"):
        client.create_reroute("SHP-1003", "CAR-DEL", "RR-02", "a", "b", "ops_manager", "k3")
    client._breaker.opened_at = None


def test_client_wraps_non_json_4xx(business, monkeypatch):
    _, client, _ = business
    import httpx

    class Html:
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def post(self, *a, **k): return httpx.Response(400, text="<html>bad</html>")
    monkeypatch.setattr(client, "_client", lambda: Html())
    with pytest.raises(client.BusinessApiError, match="400"):
        client.create_reroute("SHP-1003", "CAR-DEL", "RR-02", "a", "b", "ops_manager", "k9")


def test_worker_handles_event_once_and_retries_failures(business, monkeypatch):
    api, _, db = business
    import opscopilot.worker as worker
    _post(api, GOOD, key="w1")
    assert worker.run_once("w-a") is True
    assert worker.run_once("w-b") is False
    actions = [a["action"] for a in db.list_audit()]
    assert "customer_notified" in actions and "billing_note_created" in actions
    assert db.event_backlog() == 0

    # A handler that raises leaves the event for another attempt (ack after process).
    _post(api, {**GOOD, "shipment_id": "SHP-1009", "approval_thread_id": "t-1009"}, key="w2")
    monkeypatch.setattr(worker, "handle", lambda ev: (_ for _ in ()).throw(RuntimeError("downstream down")))
    assert worker.run_once("w-a") is True
    assert db.event_backlog() == 1


def test_worker_effects_are_idempotent_on_redelivery(business):
    api, _, db = business
    import opscopilot.worker as worker
    _post(api, GOOD, key="w3")
    ev = db.claim_next_event("w-a", lease_seconds=0)
    worker.handle(ev)
    worker.handle(ev)   # redelivered after a lost ack
    assert sum(1 for a in db.list_audit() if a["action"] == "customer_notified") == 1


def test_copilot_api_health_and_identity(business):
    import opscopilot.api as api
    c = TestClient(api.app)
    mgr = {"X-User": "m", "X-Role": "ops_manager"}
    assert c.get("/healthz").json() == {"ok": True}
    assert c.get("/metrics").status_code == 200 and b"copilot_requests_total" in c.get("/metrics").content
    # No identity, no service. No role defaults.
    assert c.get("/approvals").status_code == 401
    assert c.get("/audit").status_code == 401
    assert c.post("/ask", json={"question": "hello there"}).status_code == 401
    assert c.post("/ask", json={"question": "hello there"}, headers={"X-User": "x", "X-Role": "ceo"}).status_code == 403
    assert c.get("/approvals", headers=mgr).status_code == 200
    assert c.get("/approvals", headers={"X-User": "l", "X-Role": "team_lead"}).status_code == 403
    assert c.get("/audit", headers={"X-User": "l", "X-Role": "team_lead"}).status_code == 403
    assert c.post("/approvals/nope", json={"decision": "approve"}, headers=mgr).status_code == 404
    assert c.post("/requests/nope/retry", headers={"X-User": "s", "X-Role": "shift_supervisor"}).status_code == 403
    assert c.get("/requests/nope", headers=mgr).status_code == 404
