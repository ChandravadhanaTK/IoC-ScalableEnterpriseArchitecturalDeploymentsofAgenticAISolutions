import json
import os
import tempfile
from agents.models import Thread, Classification


DEFAULT_PATHS = {
    "emailstore": "evidence/raw/emailstore.jsonl",
    "candidates": "evidence/state/candidates.json",
    "classifications": "evidence/state/classifications.json",
    "company_map": "evidence/state/company_map.json",
    "problems": "evidence/state/problems.json",
    "diagnostics": "evidence/state/diagnostics.jsonl",
    "output": "evidence/output",
}


def _atomic_write(path, payload):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(payload)
    os.replace(tmp, path)


def load_json(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(obj, path):
    _atomic_write(path, json.dumps(obj, ensure_ascii=False, indent=2))


def load_threads(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [Thread.from_dict(json.loads(line)) for line in f if line.strip()]


def save_threads(threads, path):
    existing = {t.thread_id for t in load_threads(path)} if os.path.exists(path) else set()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    added = 0
    with open(path, "a", encoding="utf-8") as f:
        for t in threads:
            if t.thread_id in existing:
                continue
            f.write(json.dumps(t.to_dict(), ensure_ascii=False) + "\n")
            existing.add(t.thread_id)
            added += 1
    return added


def load_candidates(path):
    return load_json(path, default={}) or {}


def save_candidates(mapping, path):
    merged = dict(load_candidates(path))
    prev = len(merged)
    for k, v in mapping.items():
        merged.setdefault(k, v)
    save_json(merged, path)
    return len(merged) - prev


def load_classifications(path):
    data = load_json(path, default={}) or {}
    return {tid: Classification.from_dict(rec) for tid, rec in data.items()}


def save_classifications(records, path):
    data = load_json(path, default={}) or {}
    prev = len(data)
    for tid, c in records.items():
        data.setdefault(tid, c.to_dict())
    save_json(data, path)
    return len(data) - prev


def load_diagnostics(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def append_diagnostics(entry, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")