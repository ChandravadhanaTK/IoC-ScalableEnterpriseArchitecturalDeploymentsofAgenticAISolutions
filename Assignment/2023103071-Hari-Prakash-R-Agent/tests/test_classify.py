import json
import pathlib
import sys

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import json

from agents import store
from agents.classify import (
    parse_batch, classify_batch, classify_all, broad_pass, build_classify_prompt,
)
from agents.llm import FakeLLMClient, LLMError
from agents.models import Classification, SUCCESS_OUTCOMES
from agents.config import Config

FIXTURE_STORE = pathlib.Path(PROJECT_ROOT) / "tests" / "fixtures" / "sample_emails.jsonl"


# Full script dict for classify tests - all 8 candidate threads
SCRIPT = {
    "t1": {"outcome": "positive", "confidence": 0.95, "direction": "company_to_csea",
           "event": "CSEA Symposium 2024", "company": "ABC Technologies",
           "company_normalized": "abc technologies", "contact_person": "Rahul Kumar",
           "designation": "HR Manager", "email": "rahul@abctech.com",
           "phone": "+91 9876543210", "amount": "₹25,000", "amount_type": "money",
           "in_kind_note": None, "conversation_date": "2024-09-15",
           "evidence": "We are happy to sponsor your event.", "evidence_message_id": "t1m1"},
    "t2": {"outcome": "completed", "confidence": 0.9, "direction": "company_to_csea",
           "event": "CSEA Symposium 2024", "company": "Payments Gateway Inc",
           "company_normalized": "payments gateway", "contact_person": "Accounts Team",
           "designation": None, "email": "paymentsgateway@payments.com", "phone": None,
           "amount": "Rs 25,000", "amount_type": "money", "in_kind_note": None,
           "conversation_date": "2024-09-30", "evidence": "Payment processed.",
           "evidence_message_id": "t2m1"},
    "t3": {"outcome": "negotiation", "confidence": 0.8, "direction": "company_to_csea",
           "event": "CSEA Hackathon 2023", "company": "Wipro",
           "company_normalized": "wipro", "contact_person": None, "designation": None,
           "email": "contact@wipro.com", "phone": None, "amount": "Rs 10,000",
           "amount_type": "money", "in_kind_note": None, "conversation_date": "2023-03-10",
           "evidence": "We can sponsor Rs 10,000 for the Hackathon.", "evidence_message_id": "t3m1"},
    "t4": {"outcome": "interested_uncommitted", "confidence": 0.6, "direction": "company_to_csea",
           "event": None, "company": "XYZ Corp", "company_normalized": "xyz corp",
           "contact_person": "Priya", "designation": None, "email": "priya@xyzcorp.in",
           "phone": None, "amount": None, "amount_type": None, "in_kind_note": None,
           "conversation_date": "2022-06-01", "evidence": "We will discuss internally.",
           "evidence_message_id": "t4m1"},
    "t5": {"outcome": "negative", "confidence": 0.9, "direction": "company_to_csea",
           "event": None, "company": "Small Bank", "company_normalized": "small bank",
           "contact_person": None, "designation": None, "email": "info@smallbank.in",
           "phone": None, "amount": None, "amount_type": None, "in_kind_note": None,
           "conversation_date": "2021-01-20", "evidence": "We cannot sponsor this year.",
           "evidence_message_id": "t5m1"},
    "t6": {"outcome": "positive", "confidence": 0.85, "direction": "csea_to_company",
           "event": "CSEA Tech Quiz 2020", "company": "Acme",
           "company_normalized": "acme", "contact_person": None, "designation": None,
           "email": "hello@acme.co.in", "phone": None, "amount": None,
           "amount_type": "in_kind", "in_kind_note": "logo placement", "conversation_date": "2020-02-12",
           "evidence": "Yes, we would like to sponsor the quiz.", "evidence_message_id": "t6m2"},
    "t8": {"outcome": "no_response", "confidence": 0.7, "direction": "csea_to_company",
           "event": "National Conference 2015", "company": None, "company_normalized": None,
           "contact_person": None, "designation": None, "email": "events@univ.edu",
           "phone": None, "amount": None, "amount_type": None, "in_kind_note": None,
           "conversation_date": "2015-02-01", "evidence": "No reply received.",
           "evidence_message_id": "t8m1"},
}


def _parse_payload(text):
    """Pull the JSON thread array from the prompt payload for respond-to prompt handlers."""
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise AssertionError("prompt payload has no JSON array")
    return json.loads(text[start:end + 1])


def _scripted_classify_handler(script):
    """Return a handler that maps each thread_id in the prompt payload
    to a scripted classification template (values dict without 'index')."""
    def handler(prompt, system):
        payload = _parse_payload(prompt)
        results = []
        for item in payload:
            tid = item.get("thread_id")
            template = dict(script[tid])
            template["index"] = payload.index(item)
            results.append(template)
        return results
    return handler


def test_parse_batch_maps_by_index():
    threads = store.load_threads(FIXTURE_STORE)[:3]
    results, problems = parse_batch(_scripted_classify_handler(SCRIPT)(build_classify_prompt(threads[:3], None), "s"), threads, None)
    assert not problems
    assert len(results) == 3
    assert results[0].thread_id == "t1"


def test_classify_batch_rejects_bad_outcome_and_retries():
    calls = {"n": 0}

    def flaky(prompt, system):
        calls["n"] += 1
        if calls["n"] == 1:
            return [{"index": 0, "outcome": "garbage", "confidence": 0.5, "evidence": "x"}]
        return [{"index": 0, "outcome": "positive", "confidence": 0.9, "evidence": "we sponsor",
                 "direction": "company_to_csea"}]

    threads = store.load_threads(FIXTURE_STORE)[:1]
    client = FakeLLMClient("x", handler=flaky)
    valid, problems = classify_batch(client, threads, None)
    assert valid[0].outcome == "positive"
    assert calls["n"] == 2


def test_classify_all_checkpoints_incrementally(tmp_path, cfg):
    threads = store.load_threads(FIXTURE_STORE)[:3]
    cpath = tmp_path / "classifications.json"
    ppath = tmp_path / "problems.json"
    client = FakeLLMClient("x", handler=_scripted_classify_handler(SCRIPT))
    result = classify_all(client, threads, cfg, cpath, ppath)
    assert set(result) == {"t1", "t2", "t3"}
    # idempotent: second call classifies nothing new, returns same data
    result2 = classify_all(client, threads, cfg, cpath, ppath)
    assert set(result2) == {"t1", "t2", "t3"}


def test_broad_pass_flags_by_thread_id(cfg):
    threads = store.load_threads(FIXTURE_STORE)
    client = FakeLLMClient("x", handler=lambda p, s: [0, 3, 99])
    flagged = broad_pass(client, threads, cfg)
    assert flagged == {"t1", "t4"}