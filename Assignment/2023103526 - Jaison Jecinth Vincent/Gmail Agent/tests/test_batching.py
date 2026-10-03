from agents.batching import thread_size, make_batches
from agents.models import Message, Thread
from agents.config import Config


def _t(tid, nchars=100):
    body = "x" * nchars
    m = Message("m", "a@corp.com", ["c@x.com"], "2024-01-01T00:00:00Z", "t", body)
    return Thread(tid, "t", [m], "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z", "inbound")


def test_one_batch_when_small():
    cfg = Config(batch_max_threads=25, batch_target_chars=20000)
    batches = make_batches([_t(f"t{i}") for i in range(5)], cfg)
    assert len(batches) == 1
    assert len(batches[0]) == 5


def test_max_threads_respected():
    cfg = Config(batch_max_threads=3, batch_target_chars=20000)
    batches = make_batches([_t(f"t{i}") for i in range(7)], cfg)
    assert all(len(b) <= 3 for b in batches)
    assert sum(len(b) for b in batches) == 7


def test_large_thread_shrinks_batch():
    cfg = Config(batch_max_threads=25, batch_target_chars=100)
    big = _t("big", nchars=500)
    threads = [big, _t("a"), _t("b")]
    batches = make_batches(threads, cfg)
    assert batches[0][0].thread_id == "big"
    assert len(batches) >= 2