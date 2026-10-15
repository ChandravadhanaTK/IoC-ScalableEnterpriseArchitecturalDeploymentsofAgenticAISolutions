from agents.models import Message, Thread, Classification
from agents import store
import pathlib
import sys

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

FIXTURE_STORE = pathlib.Path(PROJECT_ROOT) / "tests" / "fixtures" / "sample_emails.jsonl"


def _thread(tid):
    m = Message("m1", "a@corp.com", ["c@example.com"], "2024-01-01T00:00:00Z",
                "Sponsorship", "We sponsor your event.")
    return Thread(tid, "Sponsorship", [m], "2024-01-01T00:00:00Z",
                  "2024-01-01T00:00:00Z", "inbound")


def test_save_threads_is_idempotent(tmp_path):
    p = tmp_path / "emailstore.jsonl"
    assert store.save_threads([_thread("t1"), _thread("t2")], p) == 2
    assert store.save_threads([_thread("t2"), _thread("t3")], p) == 1
    loaded = store.load_threads(p)
    assert [t.thread_id for t in loaded] == ["t1", "t2", "t3"]


def test_candidates_and_classifications_merge(tmp_path):
    cpath = tmp_path / "candidates.json"
    store.save_candidates({"t1": 3.0, "t2": 2.5}, cpath)
    store.save_candidates({"t2": 2.5, "t3": 9.0}, cpath)
    assert store.load_candidates(cpath) == {"t1": 3.0, "t2": 2.5, "t3": 9.0}

    cls = Classification("t1", "positive", 0.9, "company_to_csea", None, "X",
                         "x", "P", None, "p@x.com", None, None,
                         None, None, "2024-01-01", "evidence text", "m1")
    kpath = tmp_path / "classifications.json"
    assert store.save_classifications({"t1": cls}, kpath) == 1
    assert store.save_classifications({"t1": cls, "t2": cls}, kpath) == 1
    assert set(store.load_classifications(kpath)) == {"t1", "t2"}


def test_diagnostics_roundtrip(tmp_path):
    dp = tmp_path / "diagnostics.jsonl"
    store.append_diagnostics({"thread_id": "t9", "reason": "FLAGGED_INCOMPLETE",
                              "message_id": "m_bad"}, dp)
    store.append_diagnostics({"thread_id": "t1", "reason": "ok"}, dp)
    assert store.load_diagnostics(dp)[0]["reason"] == "FLAGGED_INCOMPLETE"