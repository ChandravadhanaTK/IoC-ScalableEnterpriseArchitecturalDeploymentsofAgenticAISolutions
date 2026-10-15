from agents.config import Config
from agents.models import Thread


def thread_size(thread: Thread) -> int:
    return len(thread.subject) + len(thread.full_text)


def make_batches(threads, cfg: Config):
    batches, cur, cur_size = [], [], 0
    for t in threads:
        s = max(thread_size(t), 1)
        if cur and (cur_size + s > cfg.batch_target_chars or len(cur) >= cfg.batch_max_threads):
            batches.append(cur)
            cur, cur_size = [], 0
        cur.append(t)
        cur_size += s
    if cur:
        batches.append(cur)
    return batches