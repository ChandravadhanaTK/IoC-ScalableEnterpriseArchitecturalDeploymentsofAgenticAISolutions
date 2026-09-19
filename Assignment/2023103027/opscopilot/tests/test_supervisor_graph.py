"""Supervisor graph end to end with the model stubbed out.

These are the governance guarantees: the gate cannot be closed by the wrong
role, a decided request cannot be re-decided, a failed execute is retried
from its checkpoint without re-running anything upstream, cold chain needs
two signers, and the kill switch holds approved actions.
"""
from __future__ import annotations

import pytest
from langchain_core.messages import AIMessage

from opscopilot.identity import Identity, PolicyDenied


@pytest.fixture()
def team(fresh_db, monkeypatch):
    """Stub every model call. The supervisor classifies by keyword, the research
    worker returns a canned grounded answer, the justification is fixed text."""
    from opscopilot.agents import supervisor as sup
    from opscopilot.agents import rag_agent

    def fake_structured(schema, messages, temperature=0.0, step="x"):
        text = messages[-1].content
        if schema is sup.SupervisorDecision:
            import re
            sid = (re.search(r"SHP-\d{4}", text) or [""])[0]
            intent = "reroute_shipment" if "re-route" in text.lower() or "reroute" in text.lower() else "answer_question"
            return schema(intent=intent, shipment_id=sid, reasoning="stub")
        raise AssertionError(f"unexpected structured call for {schema}")

    class FakeGraph:
        def invoke(self, state, config=None):
            return {"answer": "stub answer [SLA-POL-001 §3]", "evidence": [{"citation": "SOP-OPS-014 §1", "body": "x"}],
                    "tool_results": [], "citations": ["SLA-POL-001 §3"], "evaluation": {"grounded": True}, "stopped_by": "grounded"}

    class FakeChat:
        def invoke(self, messages):
            return AIMessage(content="Justified because the SOP says so [SOP-OPS-014 §1].")

    monkeypatch.setattr(sup, "structured", fake_structured)
    monkeypatch.setattr(sup, "build_rag_graph", lambda: FakeGraph())
    monkeypatch.setattr(sup, "chat_model", lambda *a, **k: FakeChat())
    sup._checkpointer = None
    return sup, fresh_db


SUP = Identity.for_role("sup1", "shift_supervisor")
MGR = {"user": "mgr1", "role": "ops_manager", "decision": "approve", "note": ""}


def test_question_intent_answers_without_gate(team):
    sup, db = team
    snap = sup.start_request("What is the SLA for Express?", SUP, "t-q")
    assert not snap["paused"] and snap["state"]["status"] == "answered"
    assert "stub answer" in snap["state"]["report"]


def test_team_lead_cannot_start_a_reroute(team):
    sup, db = team
    lead = Identity.for_role("lead1", "team_lead")
    snap = sup.start_request("Please re-route SHP-1003", lead, "t-lead")
    assert not snap["paused"] and snap["state"]["status"] == "answered"
    assert "Policy denied" in snap["state"]["report"]
    assert any(a["action"] == "tool_denied" for a in db.list_audit())


def test_reroute_pauses_then_commits_once(team):
    sup, db = team
    snap = sup.start_request("Re-route SHP-1003 please", SUP, "t-1")
    assert snap["paused"] and snap["state"]["status"] == "awaiting_approval"
    p = snap["interrupt"]["proposal"]
    assert p["to_carrier"] == "CAR-DEL" and p["approver_roles"] == ["ops_manager"] and p["reason_code"] == "RR-01"
    assert db.pending_approval_count() == 1

    done = sup.resume_request("t-1", MGR)
    assert not done["paused"] and done["state"]["status"] == "committed"
    assert db.get_shipment("SHP-1003")["carrier_code"] == "CAR-DEL"
    assert len(db.list_events(unconsumed_only=False)) == 1
    # Re-deciding a decided request is refused, and nothing re-runs.
    with pytest.raises(ValueError, match="already approved"):
        sup.resume_request("t-1", MGR)
    assert len(db.list_events(unconsumed_only=False)) == 1


def test_wrong_role_does_not_close_the_gate(team):
    sup, db = team
    sup.start_request("Re-route SHP-1003", SUP, "t-2")
    with pytest.raises(PolicyDenied, match="not an allowed approver"):
        sup.resume_request("t-2", {"user": "lead1", "role": "team_lead", "decision": "approve"})
    assert db.get_approval("t-2")["status"] == "pending"
    assert any(a["action"] == "approval_denied" for a in db.list_audit())
    # The rightful approver can still approve afterwards.
    done = sup.resume_request("t-2", MGR)
    assert done["state"]["status"] == "committed"


def test_requester_cannot_approve_own_request(team):
    sup, db = team
    mgr_ident = Identity.for_role("mgr1", "ops_manager")
    sup.start_request("Re-route SHP-1003", mgr_ident, "t-3")
    with pytest.raises(PolicyDenied, match="separation of duties"):
        sup.resume_request("t-3", MGR)
    assert db.get_approval("t-3")["status"] == "pending"


def test_reject_closes_the_gate_without_executing(team):
    sup, db = team
    sup.start_request("Re-route SHP-1003", SUP, "t-4")
    done = sup.resume_request("t-4", {**MGR, "decision": "reject", "note": "no"})
    assert done["state"]["status"] == "rejected"
    assert db.get_shipment("SHP-1003")["carrier_code"] == "CAR-GAT"
    assert db.list_events(unconsumed_only=False) == []


def test_failed_execute_is_retried_from_checkpoint(team, monkeypatch):
    sup, db = team
    from opscopilot.integration import business_client
    sup.start_request("Re-route SHP-1003", SUP, "t-5")
    calls = {"n": 0}
    real = business_client.create_reroute

    def flaky(*a, **k):
        calls["n"] += 1
        if calls["n"] == 1:
            raise business_client.BusinessApiError("business API unavailable after retries")
        return real(*a, **k)
    monkeypatch.setattr(sup.business_client, "create_reroute", flaky)

    snap = sup.resume_request("t-5", MGR)
    assert snap["state"]["status"] == "execute_failed" and snap["next_step"] == "execute_worker"
    assert any(a["action"] == "reroute_failed" for a in db.list_audit())
    assert db.get_shipment("SHP-1003")["carrier_code"] == "CAR-GAT"

    done = sup.retry_request("t-5")
    assert done["state"]["status"] == "committed" and calls["n"] == 2
    assert db.get_shipment("SHP-1003")["carrier_code"] == "CAR-DEL"
    assert db.get_approval("t-5")["status"] == "approved"   # the human was not asked again
    with pytest.raises(ValueError, match="nothing to retry"):
        sup.retry_request("t-5")


def test_cold_chain_needs_two_distinct_roles(team):
    sup, db = team
    snap = sup.start_request("Re-route SHP-1001", SUP, "t-6")   # cold chain, at risk
    p = snap["interrupt"]["proposal"]
    assert p["required_approvals"] == 2 and p["approver_roles"] == ["ops_manager", "quality_lead"]
    first = sup.resume_request("t-6", MGR)
    assert first["paused"] and db.get_approval("t-6")["status"] == "pending"
    assert len(db.get_approval("t-6")["signatures"]) == 1
    # A second ops_manager is not enough; the SOP wants the quality lead too.
    with pytest.raises(PolicyDenied, match="different role"):
        sup.resume_request("t-6", {**MGR, "user": "mgr2"})
    done = sup.resume_request("t-6", {"user": "ql1", "role": "quality_lead", "decision": "approve"})
    assert done["state"]["status"] == "committed"
    assert db.get_approval("t-6")["decided_by"] == "mgr1,ql1"


def test_breached_without_disruption_is_blocked_and_duplicate_reroute_is_blocked(team):
    sup, db = team
    snap = sup.start_request("Re-route SHP-1005", SUP, "t-7")   # breached, carrier not disrupted
    assert not snap["paused"] and snap["state"]["status"] == "blocked"
    assert "no grounds" in snap["state"]["policy_block"]
    sup.start_request("Re-route SHP-1003", SUP, "t-8")
    # A second request for the same shipment is blocked while the first is still pending...
    dup = sup.start_request("Re-route SHP-1003", SUP, "t-8b")
    assert dup["state"]["status"] == "blocked" and "pending approval" in dup["state"]["policy_block"]
    sup.resume_request("t-8", MGR)
    # ...and after it commits.
    again = sup.start_request("Re-route SHP-1003", SUP, "t-9")
    assert again["state"]["status"] == "blocked" and "committed re-route request" in again["state"]["policy_block"]
    assert len(db.list_events(unconsumed_only=False)) == 1


def test_retry_refused_while_gate_is_open_and_after_partial_signature(team):
    sup, db = team
    sup.start_request("Re-route SHP-1001", SUP, "t-11")          # cold chain: two signatures
    with pytest.raises(ValueError, match="awaiting an approval"):
        sup.retry_request("t-11")
    sup.resume_request("t-11", MGR)                               # first signature
    with pytest.raises(ValueError, match="awaiting an approval"):
        sup.retry_request("t-11")                                 # must not replay the stale resume
    assert not any(a["action"] == "approval_denied" for a in db.list_audit())


def test_snapshot_redacts_evidence_outside_viewer_access(team):
    sup, db = team
    sup.start_request("What is the credit limit?", Identity.for_role("m1", "ops_manager"), "t-12")
    graph = sup.build_team_graph(); cfg = {"configurable": {"thread_id": "t-12"}}
    # Inject a confidential chunk into the stored research to prove the redaction path.
    st = graph.get_state(cfg).values
    st["research"]["evidence"].append({"citation": "FIN-POL-021 §2", "body": "secret", "access": "confidential"})
    graph.update_state(cfg, {"research": st["research"]})
    lead_view = sup.snapshot(graph, cfg, viewer=Identity.for_role("l1", "team_lead"))
    mgr_view = sup.snapshot(graph, cfg, viewer=Identity.for_role("m1", "ops_manager"))
    assert all(c.get("access") != "confidential" for c in lead_view["state"]["research"]["evidence"])
    assert any(c.get("access") == "confidential" for c in mgr_view["state"]["research"]["evidence"])


def test_kill_switch_holds_approved_actions(team, monkeypatch):
    sup, db = team
    import dataclasses
    monkeypatch.setattr(sup, "settings", dataclasses.replace(sup.settings, actions_disabled=True))
    sup.start_request("Re-route SHP-1003", SUP, "t-10")
    snap = sup.resume_request("t-10", MGR)
    assert snap["state"]["status"] == "execute_failed"
    assert any(a["action"] == "action_blocked_kill_switch" for a in db.list_audit())
    monkeypatch.setattr(sup, "settings", dataclasses.replace(sup.settings, actions_disabled=False))
    assert sup.retry_request("t-10")["state"]["status"] == "committed"


def test_rag_routing_functions():
    from opscopilot.agents import rag_agent as r
    assert r.route_after_plan({"stopped_by": "tool_budget"}) == "generate"
    assert r.route_after_plan({"last_pass_added": 1, "plan_passes": 1, "tool_calls_made": 1}) == "plan_tools"
    assert r.route_after_plan({"last_pass_added": 1, "plan_passes": 2, "tool_calls_made": 1}) == "generate"
    assert r.route_after_plan({"last_pass_added": 0, "plan_passes": 1, "tool_calls_made": 0}) == "generate"
    assert r.route_after_evaluate({"evaluation": {"grounded": True}}) == "finalize"
    assert r.route_after_evaluate({"evaluation": {"grounded": False, "unsupported_claims": ["x"]}, "iterations": 1}) == "generate"
    assert r.route_after_evaluate({"evaluation": {"grounded": False, "unsupported_claims": ["x"]}, "iterations": 3}) == "finalize"
    assert r.route_after_evaluate({"evaluation": {"grounded": False, "unsupported_claims": [], "missing_citations": ["y"]}, "iterations": 1}) == "finalize"
    out = r.finalize_node({"draft": "A [SLA-POL-001 §4] and [tool:get_shipment_status] and [junk]", "iterations": 2, "evaluation": {"grounded": True, "verified": True}})
    assert out["citations"] == ["SLA-POL-001 §4", "tool:get_shipment_status"] and out["stopped_by"] == "grounded"
    assert r.find_citations("x [POL-CAR-007 §4, tool:get_shipment_status; SOP-OPS-014 §3.1] y") == ["POL-CAR-007 §4", "tool:get_shipment_status", "SOP-OPS-014 §3.1"]
    unv = r.finalize_node({"draft": "x", "iterations": 1, "evaluation": {"grounded": False, "verified": False}})
    assert unv["stopped_by"] == "unverified"
    assert r._arg_key("list_at_risk_shipments", {}) == r._arg_key("list_at_risk_shipments", {"lane": None})


def test_deterministic_evaluator_checks():
    from opscopilot.agents import rag_agent as r
    state = {"draft": "The window is 24 hours [SLA-POL-001 §2]. See [SOP-OPS-014 §9]. SHP-1003 is late.",
             "evidence": [{"citation": "SLA-POL-001 §2", "title": "t", "section": "2", "body": "Express 24 hours. Threshold 50,000 INR."}],
             "tool_results": [{"tool": "get_shipment_status", "ok": True, "args": {}, "observation": "{}"}]}
    ev = r.Evaluation(grounded=False, unsupported_claims=["The window is 24 hours", "The window is 2 hours", "Gati is the best carrier"])
    out = r._deterministic_checks(state, ev)
    assert "The window is 24 hours" not in out["unsupported_claims"]          # numbers present as whole tokens: rescued
    assert "The window is 2 hours" in out["unsupported_claims"]               # single digit never rescues
    assert "Gati is the best carrier" in out["unsupported_claims"]            # not a numeric claim
    assert out["invalid_citations"] == ["SOP-OPS-014 §9"]                     # invented section
    assert any("not attributed" in c for c in out["unsupported_claims"])       # shipment fact without [tool:]
    assert out["grounded"] is False


def test_structured_rejects_non_object_replies(monkeypatch):
    from opscopilot import llm
    from pydantic import BaseModel

    class M(BaseModel):
        ok: bool

    class Bad:
        def invoke(self, msgs):
            return AIMessage(content="42")
    monkeypatch.setattr(llm, "chat_model", lambda *a, **k: Bad())
    from langchain_core.messages import HumanMessage
    with pytest.raises(ValueError, match="not a JSON object"):
        llm.structured(M, [HumanMessage(content="q")])
