import pytest
from agents.models import (
    Message, Thread, Classification,
    VALID_OUTCOMES, SUCCESS_OUTCOMES, validate_classification,
)


def test_thread_roundtrip():
    msg = Message("m1", "rahul@abctech.com", ["csea@example.com"],
                  "2024-09-15T09:30:00Z", "Sponsorship",
                  "We are happy to sponsor.")
    t = Thread("t1", "Sponsorship", [msg], "2024-09-15T09:30:00Z",
               "2024-09-15T09:30:00Z", "inbound")
    back = Thread.from_dict(t.to_dict())
    assert back.thread_id == "t1"
    assert back.messages[0].from_email == "rahul@abctech.com"
    assert "sponsor" in back.full_text


def test_outcome_enums():
    assert SUCCESS_OUTCOMES == {"positive", "negotiation", "completed"}
    assert VALID_OUTCOMES >= SUCCESS_OUTCOMES
    assert "interested_uncommitted" in VALID_OUTCOMES


def test_classification_roundtrip_and_validation():
    c = Classification("t1", "positive", 0.92, "company_to_csea", "Symposium 2024",
                       "ABC Technologies", "abc technologies", "Rahul Kumar",
                       "HR Manager", "rahul@abctech.com", "+91 9876543210",
                       "₹25,000", "money", None, "2024-09-15",
                       "We are happy to sponsor.", "m1")
    back = Classification.from_dict(c.to_dict())
    assert back == c
    assert validate_classification(c.to_dict(), c.to_dict().get("index") if c.to_dict().get("index") is not None else 0) == []


def test_validation_rejects_bad_outcome():
    item = {"outcome": "maybe", "confidence": 0.5, "evidence": "x"}
    errs = validate_classification(item, 0)
    assert errs