# tests/test_rules.py
from agents.models import Message, Thread
from agents.rules import DEFAULT_RULES, build_system_prompt, match_thread, validate_rules

def _thread(subject="Sponsor our symposium", body="We offer Rs 10,000", frm="ceo@acme.com"):
    m = Message(id="m1", from_email=frm, to=["csea@x.edu"], date="2024-09-15", subject=subject, body_text=body)
    return Thread(thread_id="t1", subject=subject, messages=[m], first_date="2024-09-15", last_date="2024-09-15", direction_hint="inbound")

def test_default_rules_are_valid():
    assert validate_rules(DEFAULT_RULES) == []

def test_match_scores_keywords_and_corporate_domain():
    score, matched = match_thread(_thread(), DEFAULT_RULES)
    assert score >= DEFAULT_RULES["threshold"]
    assert "sponsor_kw" in matched
    assert "corp_sender" in matched

def test_personal_domain_does_not_match_corp_sender():
    score_p, _ = match_thread(_thread(frm="someone@gmail.com"), DEFAULT_RULES)
    score_c, _ = match_thread(_thread(frm="ceo@acme.com"), DEFAULT_RULES)
    assert score_c > score_p

def test_validator_rejects_bad_rule_and_bad_category():
    bad = {"version": 1, "threshold": 2.0, "criteria": [{"id": "x", "label": "x", "field": "nope", "match": "regex", "pattern": "a", "weight": 1.0}], "categories": [{"name": "ok", "description": "d", "examples": []}]}
    assert validate_rules(bad) != []
    bad2 = {"version": 1, "threshold": 2.0, "criteria": [], "categories": []}
    assert validate_rules(bad2) != []

def test_system_prompt_renders_custom_category():
    cats = [{"name": "alumni_support", "description": "Alumni venue help.", "examples": ["Host at our office."]}]
    prompt = build_system_prompt("CSEA", cats)
    assert "alumni_support" in prompt
    assert "Alumni venue help." in prompt
    assert "never invent" in prompt.lower()
import copy
from agents.rules import validate_rules as _vr, match_thread as _mt, DEFAULT_RULES as _DR
from agents.models import Message as _M, Thread as _T

def test_ui_can_add_custom_criterion_and_category():
    rules = copy.deepcopy(_DR)
    rules["criteria"].append({"id": "alumni_kw", "label": "Alumni", "field": "subject_and_body", "match": "contains", "pattern": "alumni", "weight": 1.5})
    rules["categories"].append({"name": "alumni_support", "description": "Alumni venue help.", "examples": ["Host at our office."]})
    assert _vr(rules) == []
    t = _T(thread_id="t9", subject="Alumni meet", messages=[_M(id="m", from_email="a@b.com", to=[], date="2024-01-01", subject="Alumni meet", body_text="alumni gathering")], first_date="2024-01-01", last_date="2024-01-01", direction_hint="unknown")
    s, matched = _mt(t, rules)
    assert "alumni_kw" in matched
def test_candidate_adapter_uses_custom_threshold():
    import copy
    from agents import score
    from agents.rules import DEFAULT_RULES as _DR2
    from agents.models import Message as _M2, Thread as _T2
    rules = copy.deepcopy(_DR2)
    rules["threshold"] = 99.0
    t = _T2(thread_id="t1", subject="Sponsor x", messages=[_M2(id="m", from_email="ceo@acme.com", to=[], date="2024-01-01", subject="Sponsor x", body_text="sponsor")], first_date="2024-01-01", last_date="2024-01-01", direction_hint="inbound")
    assert hasattr(score, "candidate_threads_with_rules")
    assert score.candidate_threads_with_rules([t], rules) == {}


def test_custom_category_round_trip_through_parse_batch():
    import copy
    import json
    from agents.classify import parse_batch
    rules = copy.deepcopy(_DR)
    rules["categories"].append({"name": "alumni_support", "description": "Alumni venue help.", "examples": ["Host at our office."]})
    assert _vr(rules) == []
    allowed = {c["name"] for c in rules["categories"]}
    t = _T(thread_id="t9", subject="Alumni meet", messages=[_M(id="m", from_email="a@b.com", to=[], date="2024-01-01", subject="Alumni meet", body_text="alumni gathering")], first_date="2024-01-01", last_date="2024-01-01", direction_hint="unknown")
    text = json.dumps([{"index": 0, "outcome": "alumni_support", "confidence": 0.8, "evidence": "alumni gathering"}])
    valid, problems = parse_batch(text, [t], None, allowed=allowed)
    assert not problems
    assert len(valid) == 1
    assert valid[0].outcome == "alumni_support"
    # legacy fallback still rejects unknown outcomes when allowed=None
    valid2, problems2 = parse_batch(text, [t], None)
    assert valid2 == []
    assert problems2 != []


def test_validator_rejects_bad_threshold_and_version():
    import copy
    bad_neg = copy.deepcopy(_DR)
    bad_neg["threshold"] = -1.0
    assert _vr(bad_neg) != []
    bad_str = copy.deepcopy(_DR)
    bad_str["threshold"] = "high"
    assert _vr(bad_str) != []
    bad_ver = copy.deepcopy(_DR)
    bad_ver["version"] = 0
    assert _vr(bad_ver) != []


def test_validator_rejects_empty_pattern():
    import copy
    for match in ("regex", "contains", "exact"):
        bad = copy.deepcopy(_DR)
        bad["criteria"].append({"id": "empty_pat", "label": "Empty", "field": "subject_and_body", "match": match, "pattern": "", "weight": 1.0})
        assert _vr(bad) != []
    ok = copy.deepcopy(_DR)
    assert _vr(ok) == []

