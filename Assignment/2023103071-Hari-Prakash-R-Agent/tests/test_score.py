import pathlib
import sys

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from agents.models import Message, Thread
from agents import store
from agents.score import (
    KEYWORD_PATTERNS, keyword_hits, domain_score, score_thread,
    candidate_threads,
)
from agents.config import Config

FIXTURE_STORE = pathlib.Path(PROJECT_ROOT) / "tests" / "fixtures" / "sample_emails.jsonl"


def test_keyword_hits_finds_sponsor_and_rs():
    hits = keyword_hits("We can sponsor Rs 10,000 for the event")
    assert "sponsor" in hits
    assert any("rs" in h or "₹" in h for h in hits)


def test_domain_score():
    assert domain_score("rahul@abctech.com") == 1.0
    assert domain_score("me@gmail.com") == 0.0
    assert domain_score("prof@college.ac.in") == 0.0
    assert domain_score("bad-address") == 0.0


def test_score_and_candidates_on_fixture(cfg):
    threads = store.load_threads(FIXTURE_STORE)
    cands = candidate_threads(threads, cfg)
    # t7 (timetable) is NOT a candidate; sponsorship threads are
    assert "t7" not in cands
    for tid in ("t1", "t3", "t5", "t8"):
        assert tid in cands


def test_score_thread_uses_domain_signal(cfg):
    m = Message("m", "s@corp.com", ["c@x.com"], "2024-01-01T00:00:00Z", "Re: symposium", "We are happy to sponsor.")
    t = Thread("tid", "symposium support", [m], "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z", "inbound")
    assert score_thread(t, cfg) >= cfg.candidate_threshold