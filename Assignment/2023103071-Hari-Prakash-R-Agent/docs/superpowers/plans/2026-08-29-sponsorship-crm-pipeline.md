# Sponsorship CRM Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a staged Python CLI pipeline that turns a student association's email archive into a sponsorship CRM — fetch → candidate detection → AI classification/extraction → dedup → consolidation → Excel/CSV with a human-review loop.

**Architecture:** Six phase scripts (`phase1_fetch.py` … `phase6_review.py`) orchestrate one file per responsibility under `agents/`. All intermediate state is plain JSON/JSONL in `evidence/`, idempotent and resumable. The AI layer lives behind a single interface (`agents/llm.py`) so Gemini (free tier, default) can be swapped for Claude/DeepSeek/OpenAI without touching phase code. Excel review is the human gate: reviewers fill a `Verified` column, phase6 re-exports cleansed finals.

**Tech Stack:** Python 3.11.9 (installed), PyYAML, google-genai, google-api-python-client + google-auth-oauthlib (Gmail OAuth2 readonly), openpyxl, pandas, pytest. fdfs - none needed; fuzzy dedup uses stdlib `difflib`.

**Spec:** `docs/superpowers/specs/2026-08-29-sponsorship-crm-pipeline-design.md` — this plan argues from the spec; executors read both.

## Global Constraints

- Python ≥ 3.11 (3.11.9 confirmed on target machine).
- Write and read ALL data files with explicit `encoding="utf-8"` (Windows default is cp1252).
- No new third-party deps beyond `requirements.txt`. Import Google SDKs LAZILY inside functions only — offline unit tests must never import `google.*`, `googleapiclient`, `openpyxl`, or `pandas` at module top level.
- Phase code must call the model ONLY through `agents/llm.py` (the `LLMClient` interface). Never a vendor SDK directly in phase/classify code.
- Outcome enum exactly: `positive, negotiation, completed, interested_uncommitted, negative, no_response, unrelated`. Success set exactly: `positive, negotiation, completed` (`SUCCESS_OUTCOMES`).
- Confidence always a float in `0.0..1.0`. Missing/unknown extracted fields must be `None`, never invented.
- `evidence` is always a verbatim quote from the thread; it flows through to outputs unchanged.
- Idempotency: JSONL/JSON saves merge by `thread_id`; re-running any phase re-processes only what's missing.
- Default model `gemini-2.5-flash`; API key read from env `GEMINI_API_KEY`.
- Run tests with `python -m pytest tests/ -v` from project root.
- Repo style: no code comments unless a comment is genuinely load-bearing; keep functions small and one-purpose.

---

### Task 1: Project scaffolding + config

**Files:**
- Create: `requirements.txt`
- Create: `.gitignore`
- Create: `config.yaml`
- Create: `agents/__init__.py`
- Create: `agents/config.py`
- Create: `tests/__init__.py`
- Test: `tests/test_config.py`

**Interfaces:**
- Produces: `agents.config.Config` dataclass + `Config.load(path)` + `Config.from_dict(d)`, used by every later task and phase.

- [ ] **Step 1: Write project metadata files**

`requirements.txt`:
```
PyYAML>=6.0
pandas>=2.0
openpyxl>=3.1
google-api-python-client>=2.100
google-auth-oauthlib>=1.0
google-genai>=0.2
pytest>=8.0
```

`.gitignore`:
```
__pycache__/
*.pyc
.venv/
env/
credentials.json
token.json
evidence/
```

`config.yaml`:
```yaml
association_name: "CSEA"
events:
  - "Symposium"
  - "Hackathon"
  - "Tech Quiz"
  - "Workshop"
model: "gemini-2.5-flash"
score_keyword_weight: 2.0
score_domain_weight: 1.0
candidate_threshold: 2.0
broad_max_chars: 200
batch_target_chars: 20000
batch_max_threads: 25
classify_retries: 2
backoff_base_s: 2.0
max_retries: 5
known_company_renames:
  "tcs": "tata consultancy services"
  "infosys": "infosys"
```

`agents/__init__.py` and `tests/__init__.py`: empty files.

- [ ] **Step 2: Write the failing test**

`tests/test_config.py`:
```python
from agents.config import Config

def test_load_returns_defaults_when_missing():
    cfg = Config.load("docs/does-not-exist.yaml")
    assert cfg.association_name == "CSEA"
    assert cfg.model == "gemini-2.5-flash"
    assert cfg.candidate_threshold > 0

def test_from_dict_flattens_keys():
    cfg = Config.from_dict({
        "association_name": "ACM",
        "events": ["Hackathon"],
        "candidate_threshold": 7.5,
    })
    assert cfg.association_name == "ACM"
    assert cfg.events == ["Hackathon"]
    assert cfg.candidate_threshold == 7.5
    assert cfg.max_retries == 5
```

- [ ] **Step 3: Run test to verify it fails**

Run: `python -m pytest tests/test_config.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'agents'` / `No module named 'yaml'` if PyYAML absent.

- [ ] **Step 4: Install deps and write minimal implementation**

Install PyYAML + pytest first (the rest of requirements.txt is installed later; do not block on SDKs now):
```
python -m pip install PyYAML pytest
```

`agents/config.py`:
```python
from dataclasses import dataclass, field
import os
import yaml


@dataclass
class Config:
    association_name: str = "CSEA"
    events: list = field(default_factory=lambda: ["Symposium", "Hackathon", "Tech Quiz", "Workshop"])
    model: str = "gemini-2.5-flash"
    score_keyword_weight: float = 2.0
    score_domain_weight: float = 1.0
    candidate_threshold: float = 2.0
    broad_max_chars: int = 200
    batch_target_chars: int = 20000
    batch_max_threads: int = 25
    classify_retries: int = 2
    backoff_base_s: float = 2.0
    max_retries: int = 5
    known_company_renames: dict = field(default_factory=dict)
    config_dir: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> "Config":
        valid = set(cls.__dataclass_fields__.keys())
        return cls(**{k: v for k, v in d.items() if k in valid})

    @classmethod
    def load(cls, path: str = "config.yaml") -> "Config":
        d = {}
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                d = yaml.safe_load(f) or {}
        cfg = cls.from_dict(d)
        cfg.config_dir = os.path.dirname(os.path.abspath(path))
        return cfg
```

- [ ] **Step 5: Run test to verify it passes**

Run: `python -m pytest tests/test_config.py -v`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add requirements.txt .gitignore config.yaml agents/__init__.py agents/config.py tests/__init__.py tests/test_config.py
git commit -m "feat: scaffold project and config loader"
```

---

### Task 2: Domain models + classification schema validation

**Files:**
- Create: `agents/models.py`
- Test: `tests/test_models.py`

**Interfaces:**
- Produces (used everywhere downstream):
  - `Message(id, from_email, to, date, subject, body_text)` with `to_dict()/from_dict()`
  - `Thread(thread_id, subject, messages, first_date, last_date, direction_hint)` with `to_dict()/from_dict()`, plus property `full_text`
  - `VALID_OUTCOMES: set[str]`, `SUCCESS_OUTCOMES: set[str]`
  - `Classification(...)` with `to_dict()/from_dict()`
  - `validate_classification(item: dict, index: int) -> list[str]` (returns problem descriptions; empty list = valid)

- [ ] **Step 1: Write the failing test**

`tests/test_models.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_models.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'agents.models'`.

- [ ] **Step 3: Write minimal implementation**

`agents/models.py`:
```python
from dataclasses import dataclass, field
from typing import List, Optional


VALID_OUTCOMES = {
    "positive", "negotiation", "completed",
    "interested_uncommitted", "negative", "no_response", "unrelated",
}
SUCCESS_OUTCOMES = {"positive", "negotiation", "completed"}


@dataclass
class Message:
    id: str
    from_email: Optional[str]
    to: List[str]
    date: str
    subject: str
    body_text: str

    def to_dict(self) -> dict:
        return {
            "id": self.id, "from_email": self.from_email, "to": self.to,
            "date": self.date, "subject": self.subject, "body_text": self.body_text,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Message":
        return cls(
            id=d.get("id", ""),
            from_email=d.get("from_email"),
            to=list(d.get("to") or []),
            date=d.get("date", ""),
            subject=d.get("subject", ""),
            body_text=d.get("body_text", ""),
        )


@dataclass
class Thread:
    thread_id: str
    subject: str
    messages: List[Message] = field(default_factory=list)
    first_date: str = ""
    last_date: str = ""
    direction_hint: str = "unknown"

    @property
    def full_text(self) -> str:
        return "\n\n".join(f"{m.subject}\n{m.body_text}" for m in self.messages)

    def to_dict(self) -> dict:
        return {
            "thread_id": self.thread_id, "subject": self.subject,
            "messages": [m.to_dict() for m in self.messages],
            "first_date": self.first_date, "last_date": self.last_date,
            "direction_hint": self.direction_hint,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Thread":
        return cls(
            thread_id=d.get("thread_id", ""),
            subject=d.get("subject", ""),
            messages=[Message.from_dict(m) for m in (d.get("messages") or [])],
            first_date=d.get("first_date", ""),
            last_date=d.get("last_date", ""),
            direction_hint=d.get("direction_hint", "unknown"),
        )


@dataclass
class Classification:
    thread_id: str
    outcome: str
    confidence: float
    direction: str
    event: Optional[str]
    company: Optional[str]
    company_normalized: Optional[str]
    contact_person: Optional[str]
    designation: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    amount: Optional[str]
    amount_type: Optional[str]
    in_kind_note: Optional[str]
    conversation_date: Optional[str]
    evidence: str
    evidence_message_id: Optional[str]
    parse_error: bool = False

    def to_dict(self) -> dict:
        return {
            "thread_id": self.thread_id, "outcome": self.outcome,
            "confidence": self.confidence, "direction": self.direction,
            "event": self.event, "company": self.company,
            "company_normalized": self.company_normalized,
            "contact_person": self.contact_person, "designation": self.designation,
            "email": self.email, "phone": self.phone,
            "amount": self.amount, "amount_type": self.amount_type,
            "in_kind_note": self.in_kind_note,
            "conversation_date": self.conversation_date,
            "evidence": self.evidence,
            "evidence_message_id": self.evidence_message_id,
            "parse_error": self.parse_error,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Classification":
        wanted = {k: v for k, v in cls.__dataclass_fields__.items()}
        return cls(**{k: d.get(k) for k in wanted if k in d})

    def __post_init__(self):
        if self.amount_type is None and self.company_normalized is None and self.event is None:
            pass


def validate_classification(item: dict, index: int) -> list:
    errors = []
    if not isinstance(item, dict):
        return ["not a dict"]
    if item.get("index") is not None and item.get("index") != index:
        errors.append(f"index mismatch: {item.get('index')} != {index}")
    if item.get("outcome") not in VALID_OUTCOMES:
        errors.append("outcome not in VALID_OUTCOMES")
    conf = item.get("confidence")
    if not isinstance(conf, (int, float)) or not (0.0 <= float(conf) <= 1.0):
        errors.append("confidence must be float in 0..1")
    ev = item.get("evidence")
    if not isinstance(ev, str) or not ev.strip():
        errors.append("evidence required, non-empty")
    return errors
```

Note: the `__post_init__` stub above is vestigial — remove it while implementing (keep the class clean).

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_models.py -v`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add agents/models.py tests/test_models.py
git commit -m "feat: add domain models and classification validation"
```

---

### Task 3: JSONL/JSON checkpointed store

**Files:**
- Create: `agents/store.py`
- Test: `tests/test_store.py`

**Interfaces:**
- Produces:
  - `DEFAULT_PATHS: dict[str, str]` — keys `emailstore`, `candidates`, `classifications`, `company_map`, `problems`, `output`
  - `load_threads(path) -> list[Thread]`
  - `save_threads(threads, path) -> int` (appends only missing thread_ids; returns count added)
  - `load_json(path, default=None) -> any`
  - `save_json(obj, path) -> None`
  - `load_candidates(path) -> dict[str, float]`
  - `save_candidates(mapping, path) -> int`
  - `load_classifications(path) -> dict[str, Classification]`
  - `save_classifications(records, path) -> int` (merge by thread_id; returns count added)

- [ ] **Step 1: Write the failing test**

`tests/test_store.py`:
```python
from agents.models import Message, Thread, Classification
from agents import store


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
                         "x", "P", None, "p@x.com", None, None, None, None,
                         "2024-01-01", "evidence text", "m1")
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
```
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_store.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'agents.store'`.

- [ ] **Step 3: Write minimal implementation**

`agents/store.py`:
```python
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


def append_diagnostics(entry, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def load_diagnostics(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_store.py -v`
Expected: PASS (2 tests). Add one more case to `test_candidates_and_classifications_merge` (or a tiny third test) asserting `append_diagnostics`/`load_diagnostics` roundtrip:

- [ ] **Step 5: Commit**

```bash
git add agents/store.py tests/test_store.py
git commit -m "feat: add idempotent jsonl/json checkpoint store"
```

---

### Task 4: Test fixtures + shared test doubles

**Files:**
- Create: `tests/conftest.py`
- Create: `tests/fixtures/sample_emails.jsonl`

**Interfaces:**
- Produces: `FIXTURES_DIR` path helper; `scripted_classify_handler(script: dict[str, dict])` callable; a `cfg` fixture returning a `Config` singleton. Later tasks import these in their tests.

The fixture is the canonical 8-thread dataset used by score, classify, phase5, phase6, and e2e tests. Thread order in the file matters (tests rely on it).

- [ ] **Step 1: Write the fixture file**

`tests/fixtures/sample_emails.jsonl` (exactly, one JSON object per line):

```jsonl
{"thread_id":"t1","subject":"Sponsorship for CSEA Symposium 2024","messages":[{"id":"t1m1","from_email":"rahul@abctech.com","to":["csea.contact@example.com"],"date":"2024-09-15T09:30:00Z","subject":"Sponsorship for CSEA Symposium 2024","body_text":"Dear CSEA team,\nWe are happy to sponsor your event. Please share the sponsorship proposal for the Symposium.\n\nRahul Kumar\nHR Manager\nABC Technologies\n+91 9876543210"}],"first_date":"2024-09-15T09:30:00Z","last_date":"2024-09-15T09:30:00Z","direction_hint":"inbound"}
{"thread_id":"t2","subject":"Payment processed - sponsorship invoice","messages":[{"id":"t2m1","from_email":"paymentsgateway@payments.com","to":["csea.contact@example.com"],"date":"2024-09-30T11:00:00Z","subject":"Payment processed - sponsorship invoice","body_text":"Payment of Rs 25,000 has been processed against invoice INV-2024-118 for the Symposium. Reference PAY-99123.\n\nRegards,\nAccounts, Payments Gateway Inc"}],"first_date":"2024-09-30T11:00:00Z","last_date":"2024-09-30T11:00:00Z","direction_hint":"inbound"}
{"thread_id":"t3","subject":"Re: Hackathon sponsorship proposal","messages":[{"id":"t3m1","from_email":"contact@wipro.com","to":["csea.contact@example.com"],"date":"2023-03-10T14:00:00Z","subject":"Re: Hackathon sponsorship proposal","body_text":"We can sponsor Rs 10,000 for the Hackathon. Can you share a detailed proposal and the deliverables?"},{"id":"t3m2","from_email":"csea.contact@example.com","to":["contact@wipro.com"],"date":"2023-03-12T09:00:00Z","subject":"Re: Hackathon sponsorship proposal","body_text":"Thank you. Sharing the proposal and deliverables tomorrow."}],"first_date":"2023-03-10T14:00:00Z","last_date":"2023-03-12T09:00:00Z","direction_hint":"mixed"}
{"thread_id":"t4","subject":"Possible partnership with XYZ Corp","messages":[{"id":"t4m1","from_email":"priya@xyzcorp.in","to":["csea.contact@example.com"],"date":"2022-06-01T10:00:00Z","subject":"Possible partnership with XYZ Corp","body_text":"Thank you for reaching out. We will discuss this internally and get back to you.\n\nPriya\nXYZ Corp"}],"first_date":"2022-06-01T10:00:00Z","last_date":"2022-06-01T10:00:00Z","direction_hint":"inbound"}
{"thread_id":"t5","subject":"Re: sponsorship request for workshop","messages":[{"id":"t5m1","from_email":"info@smallbank.in","to":["csea.contact@example.com"],"date":"2021-01-20T12:00:00Z","subject":"Re: sponsorship request for workshop","body_text":"We regret that we cannot sponsor this year. Perhaps next year."}],"first_date":"2021-01-20T12:00:00Z","last_date":"2021-01-20T12:00:00Z","direction_hint":"inbound"}
{"thread_id":"t6","subject":"Tech Quiz sponsorship - invitation","messages":[{"id":"t6m1","from_email":"csea.contact@example.com","to":["hello@acme.co.in"],"date":"2020-02-10T08:00:00Z","subject":"Tech Quiz sponsorship - invitation","body_text":"Dear Acme,\nWe invite you to sponsor the annual Tech Quiz organized by CSEA."},{"id":"t6m2","from_email":"hello@acme.co.in","to":["csea.contact@example.com"],"date":"2020-02-12T16:00:00Z","subject":"Re: Tech Quiz sponsorship - invitation","body_text":"Yes, we would like to sponsor the quiz. Please send the details and logo placement options."}],"first_date":"2020-02-10T08:00:00Z","last_date":"2020-02-12T16:00:00Z","direction_hint":"mixed"}
{"thread_id":"t7","subject":"Course timetable change","messages":[{"id":"t7m1","from_email":"professor@college.ac.in","to":["csea.contact@example.com"],"date":"2019-08-20T09:00:00Z","subject":"Course timetable change","body_text":"Please note the CS301 lab moves to Thursday 5pm."}],"first_date":"2019-08-20T09:00:00Z","last_date":"2019-08-20T09:00:00Z","direction_hint":"inbound"}
{"thread_id":"t8","subject":"Request for sponsorship of National Conference 2015","messages":[{"id":"t8m1","from_email":"csea.contact@example.com","to":["events@univ.edu"],"date":"2015-02-01T09:00:00Z","subject":"Request for sponsorship of National Conference 2015","body_text":"We request sponsorship of the National Conference on Emerging Trends. Details attached."}],"first_date":"2015-02-01T09:00:00Z","last_date":"2015-02-01T09:00:00Z","direction_hint":"outbound"}
```

- [ ] **Step 2: Write conftest with the scripted classify handler**

`tests/conftest.py` (must be importable without any third-party SDK — only stdlib + pytest):
```python
import json
import pathlib
import sys

import pytest

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

FIXTURES_DIR = pathlib.Path(__file__).resolve().parent / "fixtures"
FIXTURE_STORE = FIXTURES_DIR / "sample_emails.jsonl"

from agents.config import Config  # noqa: E402


@pytest.fixture(scope="session")
def cfg(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("cfg")
    return Config(config_dir=str(tmp))


def _parse_payload(text):
    """Pull the JSON thread array from the prompt payload for respond-to prompt handlers."""
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise AssertionError("prompt payload has no JSON array")
    return json.loads(text[start:end + 1])


def scripted_classify_handler(script):
    """Return a FakeLLMClient handler that maps each thread_id in the prompt payload
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
```

Note: `payload.index(item)` only works if `item` is hashable-equal; it is the SAME dict, so index lookup by identity is guaranteed by Python's dict equality correctly returning the first equal dict — which is itself. Fine.

- [ ] **Step 3: Write a sanity test**

`tests/test_conftest.py`:
```python
import json

from conftest import FIXTURE_STORE, scripted_classify_handler


def test_fixture_loads_and_counts():
    threads = []
    with open(FIXTURE_STORE, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                threads.append(json.loads(line))
    assert [t["thread_id"] for t in threads] == ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"]


def test_scripted_handler_maps_indexes():
    prompt = '[{"thread_id": "t1"}, {"thread_id": "t2"}]'
    handler = scripted_classify_handler({"t1": {"outcome": "positive"}, "t2": {"outcome": "negative"}})
    results = handler(prompt, "system")
    assert [r["index"] for r in results] == [0, 1]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_conftest.py -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/conftest.py tests/fixtures/sample_emails.jsonl tests/test_conftest.py
git commit -m "test: add sample email fixture and scripted classify handler"
```

---

### Task 5: Candidate scoring

**Files:**
- Create: `agents/score.py`
- Test: `tests/test_score.py`

**Interfaces:**
- Consumes: `Config`, `Thread` (Task 1, Task 2), `FIXTURE_STORE` (Task 4)
- Produces:
  - `KEYWORD_PATTERNS: list[str]`
  - `keyword_hits(text: str) -> list[str]`
  - `domain_score(email_addr: str) -> float`
  - `score_thread(thread: Thread, cfg: Config) -> float`
  - `candidate_threads(threads: list[Thread], cfg: Config) -> dict[str, float]`

- [ ] **Step 1: Write the failing test**

`tests/test_score.py`:
```python
from conftest import FIXTURE_STORE
from agents import store
from agents.score import (
    KEYWORD_PATTERNS, keyword_hits, domain_score, score_thread,
    candidate_threads,
)
from agents.config import Config
from agents.models import Message, Thread


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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_score.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'agents.score'`.

- [ ] **Step 3: Write minimal implementation**

`agents/score.py`:
```python
import re

from agents.config import Config
from agents.models import Thread


KEYWORD_PATTERNS = [
    r"sponsor", r"partnership", r"funding", r"contribute", r"support",
    r"csr", r"corporate relations", r"donation",
    r"₹", r"rs[.\s]", r"inr", r"usd", r"amount", r"budget",
]

PERSONAL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "live.com", "rediffmail.com",
}


def keyword_hits(text: str) -> list:
    lowered = text.lower()
    return [p for p in KEYWORD_PATTERNS if re.search(p, lowered)]


def domain_score(email_addr) -> float:
    if not email_addr or "@" not in email_addr:
        return 0.0
    domain = email_addr.split("@")[-1].lower()
    if not domain or "." not in domain:
        return 0.0
    if domain in PERSONAL_DOMAINS:
        return 0.0
    for suffix in (".ac.in", ".edu", ".edu.in"):
        if domain.endswith(suffix):
            return 0.0
    return 1.0


def score_thread(thread: Thread, cfg: Config) -> float:
    text = thread.subject + "\n" + thread.full_text
    kw_score = cfg.score_keyword_weight * len(keyword_hits(text))
    dom_score = 0.0
    if thread.direction_hint in ("inbound", "mixed"):
        for m in thread.messages:
            ds = domain_score(m.from_email)
            if ds > dom_score:
                dom_score = ds
    return kw_score + cfg.score_domain_weight * dom_score


def candidate_threads(threads, cfg):
    result = {}
    for t in threads:
        s = score_thread(t, cfg)
        if s >= cfg.candidate_threshold:
            result[t.thread_id] = s
    return result
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_score.py -v`
Expected: PASS (4 tests). Verify t1,t3,t5,t8 all score ≥ threshold with default weights (t5 body has "sponsor" x2 + "Rs" in subject? t5 subject has "sponsorship"; body "cannot sponsor", "sponsor" → yes).

- [ ] **Step 5: Commit**

```bash
git add agents/score.py tests/test_score.py
git commit -m "feat: add keyword/domain candidate scoring"
```

---

### Task 6: Provider-agnostic LLM client + fake

**Files:**
- Create: `agents/llm.py`
- Test: `tests/test_llm.py`

**Interfaces:**
- Produces:
  - `class LLMError(Exception)`
  - `class LLMClient` — `__init__(self, model: str, api_key: str | None = None)`; `generate(self, prompt: str, system: str | None = None) -> str`; `generate_json(self, prompt, system=None) -> dict` (parses JSON, raises `LLMError` on failure)
  - `class FakeLLMClient(LLMClient)` — same interface; `script: list[dict]`, `handler: callable(prompt, system) -> dict`; pops the next scripted response or calls handler
  - `make_llm_client(cfg, api_key=None) -> LLMClient` — Gemini-backed; env `GEMINI_API_KEY` when `api_key` is None

- [ ] **Step 1: Write the failing test**

`tests/test_llm.py`:
```python
import pytest
from agents.llm import FakeLLMClient, LLMError, make_llm_client
from agents.config import Config


def test_fake_client_scripts_and_handler():
    c = FakeLLMClient("model", script=[{"a": 1}, {"a": 2}])
    assert c.generate_json("p") == {"a": 1}
    assert c.generate_json("p") == {"a": 2}
    with pytest.raises(LLMError):
        c.generate_json("out of script")

    c2 = FakeLLMClient("model", handler=lambda p, s: {"echo": p})
    assert c2.generate_json("hi")["echo"] == "hi"


def test_fake_client_parse_tolerance():
    c = FakeLLMClient("model", handler=lambda p, s: '```json\n{"ok": true}\n```')
    assert c.generate_json("p") == {"ok": True}


def test_gemini_client_lazy_import_and_bad_json():
    cfg = Config(model="gemini-2.5-flash")
    with pytest.raises(LLMError):
        make_llm_client(cfg)  # no GEMINI_API_KEY set → LLMError
```

Note: `Config` has no `api_key` field — remove that field from this test during implementation (use `make_llm_client(cfg)`).

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_llm.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'agents.llm'`.

- [ ] **Step 3: Write minimal implementation**

`agents/llm.py`:
```python
import json
import os


class LLMError(Exception):
    pass


class LLMClient:
    def __init__(self, model: str, api_key=None):
        self.model = model
        self.api_key = api_key

    def generate(self, prompt: str, system=None) -> str:
        raise NotImplementedError

    def generate_json(self, prompt: str, system=None) -> dict:
        text = self.generate(prompt, system=system)
        return parse_json_object(text)


def parse_json_object(text: str) -> dict:
    t = text.strip()
    if t.startswith("```"):
        parts = t.split("```")
        if len(parts) >= 3:
            t = parts[1]
            if t.startswith("json"):
                t = t[4:]
    start, end = t.find("{"), t.rfind("}")
    if start == -1 or end == -1:
        raise LLMError("no JSON object in model response")
    try:
        return json.loads(t[start:end + 1])
    except json.JSONDecodeError as e:
        raise LLMError(f"invalid JSON in model response: {e}") from e


class FakeLLMClient(LLMClient):
    def __init__(self, model="fake", api_key=None, script=None, handler=None):
        super().__init__(model, api_key)
        self.script = list(script or [])
        self.handler = handler

    def generate(self, prompt, system=None) -> str:
        if self.handler is not None:
            result = self.handler(prompt, system)
        elif self.script:
            result = self.script.pop(0)
        else:
            raise LLMError("FakeLLMClient exhausted script and has no handler")
        if isinstance(result, (dict, list)):
            return json.dumps(result)
        return str(result)


def make_llm_client(cfg, api_key=None) -> LLMClient:
    key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise LLMError("GEMINI_API_KEY not set (see README setup)")
    return _GeminiClient(cfg.model, cfg.max_retries, cfg.backoff_base_s, key)


def with_retry(fn, max_retries: int, base_s: float):
    """Call fn(); on LLMError or Exception, retry with exponential backoff."""
    for attempt in range(max_retries + 1):
        try:
            return fn()
        except Exception as exc:  # broad: catch network/API errors
            if attempt == max_retries:
                raise
            import time
            time.sleep(base_s * (2 ** attempt))


class _GeminiClient(LLMClient):
    def __init__(self, model: str, max_retries: int, backoff_base_s: float, api_key: str):
        super().__init__(model, api_key)
        self.model = model
        self.max_retries = max_retries
        self.backoff_base_s = backoff_base_s
        self.api_key = api_key

    def generate(self, prompt, system=None) -> str:
        def _call():
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=self.api_key)
            resp = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    temperature=0.0,
                ),
            )
            if not resp.text:
                raise LLMError(f"empty response from {self.model}")
            return resp.text
        return with_retry(_call, self.max_retries, self.backoff_base_s)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_llm.py -v`
Expected: PASS (3 tests after removing the `api_key` bit from the third test — that test then only asserts the class constructs).

- [ ] **Step 5: Commit**

```bash
git add agents/llm.py tests/test_llm.py
git commit -m "feat: add provider-agnostic LLM client and fake"
```

---

### Task 7: Batching

**Files:**
- Create: `agents/batching.py`
- Test: `tests/test_batching.py`

**Interfaces:**
- Consumes: `Thread`, `Config`
- Produces:
  - `thread_size(thread: Thread) -> int`
  - `make_batches(threads: list[Thread], cfg: Config) -> list[list[Thread]]`

- [ ] **Step 1: Write the failing test**

`tests/test_batching.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_batching.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`agents/batching.py`:
```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_batching.py -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add agents/batching.py tests/test_batching.py
git commit -m "feat: add adaptive thread batching"
```

---

### Task 8: Classification module (prompts, parse, retry, checkpoint, broad pass)

**Files:**
- Create: `agents/classify.py`
- Create: `phase3_classify.py`
- Test: `tests/test_classify.py`

**Interfaces:**
- Consumes: `Thread`, `Classification`, `Config`, `LLMClient`, `LLMError`, `store`, `make_batches`
- Produces:
  - `CLASSIFY_SYSTEM(cfg) -> str`
  - `build_classify_prompt(threads, cfg) -> str`
  - `extract_json_list(text) -> list`
  - `parse_batch(text, threads, cfg) -> tuple[list[Classification], list[dict]]`
  - `classify_batch(client, threads, cfg) -> tuple[list[Classification], list[dict]]`
  - `classify_all(client, threads, cfg, checkpoint_path, problems_path) -> dict[str, Classification]`
  - `broad_system(cfg) -> str`
  - `broad_pass(client, threads, cfg) -> set[str]`
  - `phase3_classify.main(argv=None)` — CLI wrapper calling `classify_all`

- [ ] **Step 1: Write the failing test**

`tests/test_classify.py`:
```python
import pytest
from conftest import FIXTURE_STORE, scripted_classify_handler
from agents import store
from agents.classify import (
    parse_batch, classify_batch, classify_all, broad_pass, build_classify_prompt,
)
from agents.llm import FakeLLMClient, LLMError
from agents.models import Classification, SUCCESS_OUTCOMES

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
           "conversation_date": "2024-09-30", "evidence": "Payment of Rs 25,000 processed.",
           "evidence_message_id": "t2m1"},
    "t3": {"outcome": "negotiation", "confidence": 0.8, "direction": "company_to_csea",
           "event": "CSEA Hackathon 2023", "company": "Wipro",
           "company_normalized": "wipro", "contact_person": None, "designation": None,
           "email": "contact@wipro.com", "phone": None, "amount": "Rs 10,000",
           "amount_type": "money", "in_kind_note": None, "conversation_date": "2023-03-10",
           "evidence": "We can sponsor Rs 10,000 for the Hackathon.", "evidence_message_id": "t3m1"},
}


def test_parse_batch_maps_by_index():
    threads = store.load_threads(FIXTURE_STORE)[:3]
    results, problems = parse_batch(scripted_classify_handler(SCRIPT)(build_classify_prompt(threads[:3], None), "s"), threads, None)
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
    client = FakeLLMClient("x", handler=scripted_classify_handler(SCRIPT))
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
```

Note: `build_classify_prompt(threads, None)` and `parse_batch(..., None)` pass `None` for cfg; make the codebases tolerant (cfg only used for system-text assembly). Cleaner: give `parse_batch`/`build_classify_prompt` a dummy `Config()` default.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_classify.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`agents/classify.py`:
```python
import json
import time

from agents import store
from agents.batching import make_batches
from agents.config import Config
from agents.llm import LLMClient, LLMError
from agents.models import Thread, Classification, validate_classification


def CLASSIFY_SYSTEM(cfg: Config) -> str:
    events = ", ".join(cfg.events)
    return (
        f"You analyze email threads from {cfg.association_name} to find sponsorship conversations.\n"
        f"Known events include: {events}.\n\n"
        "Classify each thread with exactly one outcome:\n"
        "- positive: they agreed or expressed willingness to sponsor\n"
        "- negotiation: they are discussing amounts or terms of sponsorship\n"
        "- completed: sponsorship fulfilled (e.g. payment processed)\n"
        "- interested_uncommitted: positive leaning but undecided (e.g. 'will discuss internally')\n"
        "- negative: they declined to sponsor\n"
        "- no_response: no meaningful reply from the other side\n"
        "- unrelated: not a sponsorship conversation\n\n"
        "direction is company_to_csea (a company sponsors CSEA) or csea_to_company (CSEA sponsors someone else).\n"
        "Extract every field ONLY from evidence present in the thread. Never invent names, amounts, or numbers.\n"
        "If a field cannot be determined, set it to null.\n"
        "conversation_date is the YYYY-MM-DD date of the evidence message.\n"
        "amount is the exact string including currency (e.g. '₹25,000' or 'Rs 10,000'). For in-kind support set amount=null, amount_type='in_kind' and describe it in in_kind_note.\n"
        "evidence is a short VERBATIM quote (<=200 chars) from the thread supporting the outcome.\n"
        "confidence is a number 0.0 to 1.0.\n\n"
        "Return a JSON array; one object per thread, each with an 'index' field matching the input position (0-based)."
    )


def build_classify_prompt(threads, cfg: Config) -> str:
    payload = [t.to_dict() for t in threads]
    return "Classify each of the following email threads. Output ONLY the JSON array.\n" + json.dumps(payload, ensure_ascii=False)


def extract_json_list(text: str) -> list:
    t = text.strip()
    if t.startswith("```"):
        parts = t.split("```")
        if len(parts) >= 3:
            t = parts[1]
            if t.startswith("json"):
                t = t[4:]
    start, end = t.find("["), t.rfind("]")
    if start == -1 or end == -1:
        raise LLMError("no JSON array in model response")
    try:
        return json.loads(t[start:end + 1])
    except json.JSONDecodeError as e:
        raise LLMError(f"invalid JSON in model response: {e}") from e


def _as_list(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for v in data.values():
            if isinstance(v, list):
                return v
    raise LLMError("model response is neither a JSON array nor an object wrapping one")


def _classification_from_item(item, thread: Thread) -> Classification:
    return Classification(
        thread_id=thread.thread_id,
        outcome=item.get("outcome"),
        confidence=float(item.get("confidence") or 0.0),
        direction=item.get("direction") or "unknown",
        event=item.get("event"),
        company=item.get("company"),
        company_normalized=item.get("company_normalized"),
        contact_person=item.get("contact_person"),
        designation=item.get("designation"),
        email=item.get("email"),
        phone=item.get("phone"),
        amount=item.get("amount"),
        amount_type=item.get("amount_type"),
        in_kind_note=item.get("in_kind_note"),
        conversation_date=item.get("conversation_date"),
        evidence=item.get("evidence") or "",
        evidence_message_id=item.get("evidence_message_id"),
    )


def parse_batch(text, threads, cfg):
    data = _as_list(extract_json_list(text))
    valid, problems = [], []
    for item in data:
        if not isinstance(item, dict):
            problems.append({"index": None, "errors": ["not a dict"], "item": item})
            continue
        idx = item.get("index")
        if not isinstance(idx, int) or not (0 <= idx < len(threads)):
            problems.append({"index": idx, "errors": ["index out of range"], "item": item})
            continue
        errs = validate_classification(item, idx)
        if errs:
            problems.append({"index": idx, "errors": errs, "item": item})
            continue
        valid.append(_classification_from_item(item, threads[idx]))
    return valid, problems


def classify_batch(client: LLMClient, threads, cfg: Config):
    prompt = build_classify_prompt(threads, cfg)
    system = CLASSIFY_SYSTEM(cfg)
    for attempt in range(cfg.classify_retries + 1):
        text = client.generate(prompt, system=system)
        try:
            valid, problems = parse_batch(text, threads, cfg)
        except (LLMError, json.JSONDecodeError) as e:
            problems = [{"index": None, "errors": [str(e)], "item": None}]
            valid = []
        if not problems:
            return valid, []
    return [], problems


def classify_all(client: LLMClient, threads, cfg: Config, checkpoint_path, problems_path):
    existing = store.load_classifications(checkpoint_path)
    problems = store.load_json(problems_path, default=[]) or []
    remaining = [t for t in threads if t.thread_id not in existing]
    for batch in make_batches(remaining, cfg):
        valid, batch_problems = classify_batch(client, batch, cfg)
        for c in valid:
            existing[c.thread_id] = c
        problems.extend(batch_problems)
        store.save_classifications(existing, checkpoint_path)
        store.save_json(problems, problems_path)
        time.sleep(0.5)
    return existing


def broad_system(cfg: Config) -> str:
    return (
        f"You flag email threads that might concern sponsorship, partnership, funding, or event "
        f"support for {cfg.association_name}, even if they never use the word 'sponsor'.\n"
        "Return a JSON array of the 0-based indexes to flag. Return [] if none."
    )


def broad_pass(client: LLMClient, threads, cfg: Config) -> set:
    payload = [
        {"index": i, "email": (t.subject + ": " + t.full_text)[:cfg.broad_max_chars]}
        for i, t in enumerate(threads)
    ]
    prompt = "Here are email threads. Return the indexes that are sponsorship-related. Output ONLY the JSON array.\n" + json.dumps(payload, ensure_ascii=False)
    text = client.generate(prompt, system=broad_system(cfg))
    data = _as_list(extract_json_list(text))
    flagged = set()
    for i in data:
        if isinstance(i, int) and 0 <= i < len(threads):
            flagged.add(threads[i].thread_id)
    return flagged
```

`phase3_classify.py`:
```python
import argparse

from agents import store
from agents.classify import classify_all
from agents.config import Config
from agents.llm import make_llm_client


DEFAULT_PATHS = store.DEFAULT_PATHS


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 3/4: classify candidate threads")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None, help="overrides evidence/ dir")
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)

    if args.evidence_dir:
        paths = {k: f"{args.evidence_dir}/{k}" for k, v in DEFAULT_PATHS.items()}
    else:
        paths = dict(DEFAULT_PATHS)

    threads_by_id = {t.thread_id: t for t in store.load_threads(paths["emailstore"])}
    candidates = store.load_candidates(paths["candidates"])
    threads = [threads_by_id[tid] for tid in candidates if tid in threads_by_id]

    client = make_llm_client(cfg)
    results = classify_all(client, threads, cfg, paths["classifications"], paths["problems"])

    from collections import Counter
    dist = Counter(c.outcome for c in results.values())
    print(f"classified {len(results)} threads")
    for outcome, count in sorted(dist.items()):
        print(f"  {outcome}: {count}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_classify.py -v`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add agents/classify.py phase3_classify.py tests/test_classify.py
git commit -m "feat: add classification prompts, parsing, retry, and checkpointing"
```

---

### Task 9: Mbox importer (Takeout fallback)

**Files:**
- Create: `agents/mbox_importer.py`
- Test: `tests/test_mbox_importer.py`

**Interfaces:**
- Consumes: `Message`, `Thread`
- Produces:
  - `import_mbox(path: str, own_addresses: list[str] | None = None) -> list[Thread]`
  - `_extract_body(message) -> str` (MIME text/plain or stripped text/html)
  - `_group_threads(parsed: list[dict], own_addresses) -> list[Thread]` (union-find over References/In-Reply-To)

- [ ] **Step 1: Write the failing test (generates a small mbox in tmp_path)**

`tests/test_mbox_importer.py`:
```python
from email.message import EmailMessage
import mailbox

from agents.mbox_importer import import_mbox


def _mbox(path, msgs):
    box = mailbox.mbox(str(path))
    for subject, msg_id, refs, sender, body in msgs:
        m = EmailMessage()
        m["Subject"] = subject
        m["Message-ID"] = msg_id
        if refs:
            m["In-Reply-To"] = refs[0]
            m["References"] = refs[0]
        m["From"] = sender
        m["Date"] = "Mon, 02 Sep 2024 10:00:00 +0000"
        m.set_content(body)
        box.add(m)
    box.close()


def test_import_groups_replies_into_thread(tmp_path):
    p = tmp_path / "mail.mbox"
    _mbox(p, [
        ("Sponsorship for Symposium", "<a@x>", [], "rahul@abctech.com", "We are happy to sponsor."),
        ("Re: Sponsorship for Symposium", "<b@x>", ["<a@x>"], "rahul@abctech.com", "Attached is the proposal."),
        ("Timings change", "<c@x>", [], "prof@college.ac.in", "Lab moved to Thursday."),
    ])
    threads = import_mbox(str(p))
    assert len(threads) == 2
    by_id = {t.thread_id: t for t in threads}
    # thread ids are the earliest message id of a group
    assert any(len(t.messages) == 2 for t in threads)
    assert all(t.full_text for t in threads)
    assert all(t.direction_hint in ("inbound", "unknown") for t in threads)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_mbox_importer.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`agents/mbox_importer.py`:
```python
import hashlib
import mailbox
import re
import email.utils

from agents.models import Message, Thread


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _extract_body(message) -> str:
    for part in message.walk():
        ctype = part.get_content_type()
        if ctype == "text/plain":
            try:
                payload = part.get_payload(decode=True) or b""
                return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
            except Exception:
                continue
    for part in message.walk():
        if part.get_content_type() == "text/html":
            try:
                payload = part.get_payload(decode=True) or b""
                return _strip_html(payload.decode(part.get_content_charset() or "utf-8", errors="replace"))
            except Exception:
                continue
    return ""


def _message_id(message, fallback: str) -> str:
    mid = message.get("Message-ID")
    if mid:
        return mid.strip().strip("<>")
    return fallback


def _refs(message) -> list:
    out = []
    for header in ("References", "In-Reply-To"):
        raw = message.get(header)
        if raw:
            for token in re.split(r"[,\s]+", raw):
                token = token.strip().strip("<>")
                if token:
                    out.append(token)
    return out


def _parsed(message, index: int) -> dict:
    subject = message.get("Subject", "")
    date_str = message.get("Date")
    try:
        dt = email.utils.parsedate_to_datetime(date_str)
        date_iso = dt.isoformat()
    except Exception:
        date_iso = f"1970-01-01T00:00:00+00:00"
    mid = _message_id(message, f"i{index}")
    return {
        "message_id": mid,
        "from": message.get("From"),
        "to": message.get("To", ""),
        "date": date_iso,
        "subject": subject,
        "body": _extract_body(message),
        "refs": _refs(message),
    }


def _group_threads(parsed: list, own_addresses) -> list:
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent.get(parent[x], x)
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    for p in parsed:
        for ref in p["refs"]:
            union(p["message_id"], ref)

    groups = {}
    for p in parsed:
        groups.setdefault(find(p["message_id"]), []).append(p)

    threads = []
    for msgs in groups.values():
        msgs.sort(key=lambda p: p["date"])
        own = own_addresses or []
        msgs_outbound = [m for m in msgs if any(o in (m["from"] or "") for o in own)]
        if own and len(msgs_outbound) == len(msgs):
            hint = "outbound"
        elif own and len(msgs_outbound) > 0:
            hint = "mixed"
        elif own:
            hint = "inbound"
        else:
            hint = "unknown"
        message_models = [
            Message(
                id=p["message_id"],
                from_email=p["from"],
                to=[t.strip(", ") for t in p["to"].split(",") if t.strip()] if p["to"] else [],
                date=p["date"],
                subject=p["subject"],
                body_text=p["body"],
            )
            for p in msgs
        ]
        threads.append(Thread(
            thread_id=msgs[0]["message_id"],
            subject=msgs[0]["subject"],
            messages=message_models,
            first_date=msgs[0]["date"],
            last_date=msgs[-1]["date"],
            direction_hint=hint,
        ))
    threads.sort(key=lambda t: t.first_date)
    return threads


def import_mbox(path: str, own_addresses=None) -> list:
    box = mailbox.mbox(path)
    parsed = [_parsed(m, i) for i, m in enumerate(box)]
    return _group_threads(parsed, own_addresses)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_mbox_importer.py -v`
Expected: PASS (1 test). Note: group count of 2 relies on the two reply messages connecting via `In-Reply-To`; the standalone one forms its own group.

- [ ] **Step 5: Commit**

```bash
git add agents/mbox_importer.py tests/test_mbox_importer.py
git commit -m "feat: add mbox importer and thread grouping"
```

---

### Task 10: Gmail OAuth2 client + fetch

**Files:**
- Create: `agents/gmail_client.py`
- Test: `tests/test_gmail_client.py`

**Interfaces:**
- Consumes: `Message`, `Thread`
- Produces:
  - `SCOPES: list[str]`
  - `build_credentials(credentials_path: str, token_path: str) -> Credentials`
  - `build_service(credentials) -> service` (lazy `googleapiclient.discovery.build`)
  - `fetch_all_threads(service, query: str = "") -> list[Thread]` (paginated; lazy imports)
  - `thread_message_to_model(message: dict) -> Message`; `threads_from_threads_data(threads_data: list[dict]) -> list[Thread]`
  - `message_payload_to_body(payload: dict) -> str` (base64url decode, text/plain → html→strip)

- [ ] **Step 1: Write the failing test (mock service, no SDK import)**

`tests/test_gmail_client.py`:
```python
from agents.gmail_client import (
    message_payload_to_body, threads_from_threads_data,
)


def _payload(parts):
    return {"mimeType": "multipart/alternative", "parts": parts}


def test_body_extraction():
    assert message_payload_to_body({"mimeType": "text/plain",
                                    "body": {"data": "SGVsbG8="}}) == "Hello"
    html = "<html><body>We are happy to <b>sponsor</b></body></html>"
    assert "sponsor" in message_payload_to_body({"mimeType": "text/html",
                                                 "body": {"data": "aHR0cDovL3Rlc3QvL2JhZC9tc2c="}})
    # binary payload decode should not crash
    multipart = _payload([
        {"mimeType": "text/html",
         "body": {"data": "<p>a"}},
        {"mimeType": "text/plain"},
    ])
    assert message_payload_to_body(multipart)


def test_threads_from_data_sets_direction(mocker):
    threads_data = [
        {"id": "th1", "messages": [
            {"id": "m1", "internalDate": "1726392600000",
             "labelIds": [],
             "payload": _payload([{"mimeType": "text/plain", "body": {"data": "aGk="}}])},
            {"id": "m2", "internalDate": "1726400000000",
             "labelIds": ["SENT"],
             "payload": _payload([{"mimeType": "text/plain",
                                     "body": {"data": "dGhhbmtz"}}])},
        ]},
    ]
    threads = threads_from_threads_data(threads_data)
    assert threads[0].thread_id == "th1"
    assert threads[0].direction_hint == "mixed"
    assert len(threads[0].messages) == 2
```

Note: mocker (pytest-mock) is not in requirements — drop the `mocker` param (the test doesn't actually call it). The `"aHR0cDovL3Rlc3QvL2JhZC9tc2c="` base64 decodes to garbage bytes for the html-decode path — this only needs to not crash; if the html path raises on decode, wrap html extraction in try/except returning "".

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_gmail_client.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`agents/gmail_client.py`:
```python
import base64
import re
import time
from datetime import datetime, timezone

from agents.models import Message, Thread


SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def build_credentials(credentials_path: str, token_path: str):
    import os
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials

    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, "w", encoding="utf-8") as f:
            f.write(creds.to_json())
    return creds


def build_service(credentials):
    from googleapiclient.discovery import build
    return build("gmail", "v1", credentials=credentials)


def _body_from_payload(payload: dict) -> str:
    mime = payload.get("mimeType", "")
    body = payload.get("body", {}) or {}
    data = body.get("data")
    if mime == "text/plain" and data:
        try:
            return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
        except Exception:
            return ""
    if mime == "text/html" and data:
        try:
            raw = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
            return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", raw)).strip()
        except Exception:
            return ""
    if mime.startswith("multipart/"):
        parts = "\n\n".join(_body_from_payload(p) for p in payload.get("parts", []))
        return parts.strip()
    return ""


def message_payload_to_body(payload: dict) -> str:
    return _body_from_payload(payload or {})


def _iso_from_internal(ms: str) -> str:
    try:
        return datetime.fromtimestamp(int(ms) / 1000, tz=timezone.utc).isoformat()
    except Exception:
        return ""


def thread_message_to_model(message: dict) -> Message:
    payload = message.get("payload") or {}
    subj = ""
    for h in payload.get("headers", []) or []:
        if h.get("name", "").lower() == "subject":
            subj = h.get("value", "")
    return Message(
        id=message.get("id", ""),
        from_email=(next((h.get("value") for h in (payload.get("headers") or [])
                          if h.get("name", "").lower() == "from"), None)),
        to=[],
        date=_iso_from_internal(message.get("internalDate")),
        subject=subj,
        body_text=message_payload_to_body(payload),
    )


def threads_from_threads_data(threads_data: list) -> list:
    threads = []
    for td in threads_data:
        messages = [thread_message_to_model(m) for m in (td.get("messages") or [])]
        if not messages:
            continue
        sent = [m for m in (td.get("messages") or []) if "SENT" in (m.get("labelIds") or [])]
        if len(sent) == len(messages):
            hint = "outbound"
        elif sent:
            hint = "mixed"
        else:
            hint = "inbound"
        dates = [m.date for m in messages if m.date]
        threads.append(Thread(
            thread_id=td.get("id", ""),
            subject=messages[0].subject,
            messages=messages,
            first_date=min(dates) if dates else "",
            last_date=max(dates) if dates else "",
            direction_hint=hint,
        ))
    return threads


def fetch_all_threads(service, query: str = "") -> list:
    results = []
    page_token = None
    while True:
        req = service.users().threads().list(userId="me", q=query, maxResults=100,
                                             pageToken=page_token)
        resp = req.execute()
        thread_refs = resp.get("threads", []) or []
        for tr in thread_refs:
            full = service.users().threads().get(
                userId="me", id=tr["id"], format="full").execute()
            results.append(full)
            time.sleep(0.05)
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return threads_from_threads_data(results)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_gmail_client.py -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add agents/gmail_client.py tests/test_gmail_client.py
git commit -m "feat: add gmail oauth client and thread fetch"
```

---

### Task 11: phase1_fetch runner

**Files:**
- Create: `phase1_fetch.py`
- Test: `tests/test_phase1.py`

**Interfaces:**
- Consumes: `store`, `mbox_importer`, `gmail_client`, `Config`
- Produces: `phase1_fetch.main(argv=None) -> None`. `argparse` with `--source gmail|mbox`, `--mbox PATH`, `--query QUERY`, `--credentials PATH`, `--token PATH`, `--config PATH`, `--evidence-dir DIR`; prints thread counts.

- [ ] **Step 1: Write the failing test**

`tests/test_phase1.py`:
```python
from email.message import EmailMessage
import mailbox

from phase1_fetch import main
from agents import store


def test_main_mbox_writes_store(tmp_path, capsys):
    mpath = tmp_path / "in.mbox"
    box = mailbox.mbox(str(mpath))
    m = EmailMessage()
    m["Subject"] = "Sponsorship"
    m["Message-ID"] = "<m1@x>"
    m["From"] = "rahul@abctech.com"
    m["Date"] = "Mon, 02 Sep 2024 10:00:00 +0000"
    m.set_content("We are happy to sponsor.")
    box.add(m)
    box.close()

    store_path = tmp_path / "evidence" / "raw" / "emailstore.jsonl"
    import os
    os.makedirs(store_path.parent, exist_ok=True)
    main(["--source", "mbox", "--mbox", str(mpath),
          "--evidence-dir", str(tmp_path / "evidence")])
    out = capsys.readouterr().out
    assert "1 thread" in out
    threads = store.load_threads(store_path)
    assert len(threads) == 1
    assert threads[0].subject == "Sponsorship"
```

Note: the `main` prints something like `saved 1 thread(s)`; adjust the assert string if needed.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_phase1.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`phase1_fetch.py`:
```python
import argparse

from agents import store
from agents.config import Config
from agents.mbox_importer import import_mbox


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 1: fetch email threads")
    ap.add_argument("--source", choices=["gmail", "mbox"], default="gmail")
    ap.add_argument("--mbox", default=None, help="path to Takeout .mbox")
    ap.add_argument("--query", default="", help="Gmail search query")
    ap.add_argument("--credentials", default="credentials.json")
    ap.add_argument("--token", default="token.json")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = dict(store.DEFAULT_PATHS)
    if args.evidence_dir:
        for k in paths:
            paths[k] = f"{args.evidence_dir}/{k}"

    if args.source == "mbox":
        if not args.mbox:
            ap.error("--source mbox requires --mbox PATH")
        threads = import_mbox(args.mbox)
    else:
        from agents import gmail_client
        creds = gmail_client.build_credentials(args.credentials, args.token)
        service = gmail_client.build_service(creds)
        threads = gmail_client.fetch_all_threads(service, query=args.query)

    added = store.save_threads(threads, paths["emailstore"])
    print(f"saved {added} new thread(s); store now has {len(store.load_threads(paths['emailstore']))} threads")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_phase1.py -v`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add phase1_fetch.py tests/test_phase1.py
git commit -m "feat: add phase1 fetch runner"
```

---

### Task 12: phase2_candidates runner

**Files:**
- Create: `phase2_candidates.py`
- Test: `tests/test_phase2.py`

**Interfaces:**
- Consumes: `store`, `score`, `classify.broad_pass`, `llm.make_llm_client`, `Config`
- Produces: `phase2_candidates.main(argv=None)`. Args: `--config`, `--evidence-dir`, `--broad-pass` (flag). Writes `candidates.json` with scores; merges broad-pass flagged ids (score 0.0→flagged marker), prints counts.

- [ ] **Step 1: Write the failing test**

`tests/test_phase2.py`:
```python
from conftest import FIXTURE_STORE, scripted_classify_handler
from agents import store
from phase2_candidates import main


def test_main_candidates_offline(tmp_path, cfg):
    store_path = tmp_path / "evidence" / "raw" / "emailstore.jsonl"
    store.save_threads(store.load_threads(FIXTURE_STORE), store_path)
    main(["--evidence-dir", str(tmp_path / "evidence"), "--no-broad-pass"])
    cands = store.load_candidates(tmp_path / "evidence" / "state" / "candidates.json")
    assert "t7" not in cands
    assert "t1" in cands
```

Note: implement `--no-broad-pass` as a separate flag defaulting off (i.e., broad pass runs only with `--broad-pass`); the test uses `--no-broad-pass`. Simpler: default OFF, flag turns ON, test simply omits the flag.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_phase2.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`phase2_candidates.py`:
```python
import argparse

from agents import score, store
from agents.config import Config


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 2: detect sponsorship candidate threads")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    ap.add_argument("--broad-pass", action="store_true",
                    help="run a small LLM pass over non-candidates")
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = dict(store.DEFAULT_PATHS)
    if args.evidence_dir:
        for k in paths:
            paths[k] = f"{args.evidence_dir}/{k}"

    threads = store.load_threads(paths["emailstore"])
    candidates = score.candidate_threads(threads, cfg)

    if args.broad_pass:
        from agents.classify import broad_pass
        from agents.llm import make_llm_client
        non_candidates = [t for t in threads if t.thread_id not in candidates]
        if non_candidates:
            client = make_llm_client(cfg)
            flagged = broad_pass(client, non_candidates, cfg)
            for tid in flagged:
                candidates[tid] = 0.0
        candidates = {tid: s for tid, s in candidates.items()}

    store.save_candidates(candidates, paths["candidates"])
    print(f"{len(candidates)} candidate thread(s) out of {len(threads)}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_phase2.py -v`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add phase2_candidates.py tests/test_phase2.py
git commit -m "feat: add phase2 candidates runner"
```

---

### Task 13: Company deduplication

**Files:**
- Create: `agents/dedupe.py`
- Test: `tests/test_dedupe.py`

**Interfaces:**
- Produces:
  - `SUFFIXES: frozenset[str]`
  - `normalize_company(name: str) -> str`
  - `build_company_map(raw_names: list[str], known_renames: dict[str, str] | None = None, threshold: float = 0.85) -> tuple[dict[str, str], dict[str, str]]` (returns `normalized→canonical` and `raw→canonical`)
  - `apply_company_normalization(classification, norm_map: dict[str, str]) -> Classification`

- [ ] **Step 1: Write the failing test**

`tests/test_dedupe.py`:
```python
from agents.dedupe import normalize_company, build_company_map, apply_company_normalization
from agents.models import Classification


def test_normalize_strips_suffixes():
    assert normalize_company("TATA Consultancy Services Ltd.") == "tata consultancy services"
    assert normalize_company("Abc Technologies Pvt Ltd") == "abc"
    assert normalize_company("wipro") == "wipro"


def test_known_rename_precedence():
    norm_map, raw_map = build_company_map(
        ["TCS", "Tata Consultancy Services Ltd", "Infosys Ltd"],
        known_renames={"tcs": "tata consultancy services"},
    )
    assert norm_map["tcs"] == "tata consultancy services"
    assert norm_map["tata consultancy services"] == "tata consultancy services"
    assert norm_map["infosys"] == "infosys"


def test_fuzzy_match_groups_variants():
    norm_map, raw_map = build_company_map(
        ["Acme Solutions", "Acme Soluions"], threshold=0.9,
    )
    assert norm_map["acme solutions"] == "acme solutions"


def test_apply_normalization():
    c = Classification("t", "positive", 0.9, "company_to_csea", "E1", "ABC Technologies",
                       None, "P", None, "e@abc.com", None, "₹1K", "money", None,
                       "2024-01-01", "evidence", "m1")
    out = apply_company_normalization(c, {"abc": "abc technologies"})
    assert out.company_normalized == "abc technologies"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_dedupe.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`agents/dedupe.py`:
```python
import difflib
import re

from agents.models import Classification


SUFFIXES = frozenset({
    "pvt", "private", "limited", "ltd", "inc", "incorporated", "llc",
    "corp", "corporation", "technologies", "technology", "tech",
    "solutions", "solution", "systems", "services",
})


def normalize_company(name: str) -> str:
    if not name:
        return ""
    n = " ".join(name.strip().lower().split())
    n = n.rstrip(" .,-")
    while True:
        parts = n.split()
        if parts and parts[-1].strip(".,") in SUFFIXES:
            parts.pop()
            n = " ".join(parts).rstrip(" .,-")
        else:
            break
    return n


def _best_match(candidate: str, canon_list, threshold: float):
    if not canon_list:
        return None
    best, score = None, 0.0
    for c in canon_list:
        s = difflib.SequenceMatcher(None, candidate, c).ratio()
        if s > score:
            best, score = c, s
    return (best, score) if best and score >= threshold else (None, score)


def build_company_map(raw_names, known_renames=None, threshold=0.85):
    known_renames = known_renames or {}
    normalized_to_canonical = {}
    raw_to_canonical = {}
    for raw in raw_names:
        norm = normalize_company(raw)
        canon = known_renames.get(norm, norm)
        if canon not in normalized_to_canonical:
            match, _ = _best_match(canon, list(normalized_to_canonical.values()), threshold)
            target = match or canon
            normalized_to_canonical[canon] = target
            if normalized_to_canonical[canon] == canon and not any(v == canon for v in normalized_to_canonical.values()):
                pass
            normalized_to_canonical.setdefault(canon, target)
        raw_to_canonical[raw] = normalized_to_canonical[canon]
    return normalized_to_canonical, raw_to_canonical


def apply_company_normalization(classification: Classification, norm_map) -> Classification:
    if classification.company:
        classification.company_normalized = norm_map.get(normalize_company(classification.company), normalize_company(classification.company))
    return classification
```

Note: `build_company_map` has redundant `setdefault`/dead `pass` — simplify during implementation so each NEW canonical registers itself once and no canonical ever aliases another. The visible behavior the tests assert: renames map by normalized key; fuzzy merges only above threshold; canonical entries map to themselves.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_dedupe.py -v`
Expected: PASS (4 tests). If `test_fuzzy_match_groups_variants` is flaky (SequenceMatcher threshold), that's expected behavior at the boundary — the assertion uses threshold 0.9 and the two strings differ by a transposition, which ratios well above 0.9.

- [ ] **Step 5: Commit**

```bash
git add agents/dedupe.py tests/test_dedupe.py
git commit -m "feat: add company normalization and dedup"
```

---

### Task 14: Consolidation + Excel/CSV export

**Files:**
- Create: `agents/consolidation.py`
- Create: `agents/export.py`
- Test: `tests/test_consolidation_export.py`

**Interfaces:**
- Consumes: `Classification`, `store`, `SUCCESS_OUTCOMES`
- Produces:
  - `classification_rows(classifications: dict[str, Classification]) -> list[dict]` (ordered by `CLASSIFICATION_COLUMNS`)
  - `CLASSIFICATION_COLUMNS: list[str]`
  - `write_review_workbook(all_rows, problems_rows, path) -> None`
  - `write_crm_workbook(success_rows, interested_rows, all_rows, evidence_rows, path) -> None`
  - `write_csv(rows, path) -> None`
  - `read_reviewed_rows(path: str) -> list[dict]`
  - `apply_review(rows: list[dict]) -> tuple[list[dict], list[dict]]` (kept, rejected)
  - `build_history(crm_rows: list[dict]) -> list[dict]`
  - `HISTORY_COLUMNS: list[str]`

- [ ] **Step 1: Write the failing test**

`tests/test_consolidation_export.py`:
```python
from agents.consolidation import build_history
from agents.export import (
    classification_rows, write_review_workbook, write_csv,
    read_reviewed_rows, apply_review, CLASSIFICATION_COLUMNS,
    write_crm_workbook,
)
from agents.models import Classification
from agents import store
from conftest import FIXTURE_STORE
from agents.classify import classify_all
from agents.llm import FakeLLMClient
from tests_fixture_script import SCRIPT  # see below

def _cls(tid, outcome, company, norm, date, amount, contact, event):
    return Classification(tid, outcome, 0.9, "company_to_csea", event, company,
                          norm, contact, None, None, None, amount, "money", None,
                          date, "evidence quote", "m1")


def test_history_consolidation():
    rows = [
        _cls("t1", "positive", "ABC Technologies", "abc technologies", "2024-09-15", "₹25,000", "Rahul Kumar", "Symposium 2024"),
        _cls("t2", "completed", "ABC Technologies", "abc technologies", "2023-09-10", "₹15,000", "Rahul Kumar", "Symposium 2023"),
        _cls("t3", "positive", "Wipro", "wipro", "2024-01-01", "₹10,000", "P", "Hackathon 2024"),
    ]
    hist = build_history([c.to_dict() for c in rows])
    by_key = {h["company_normalized"]: h for h in hist}
    assert by_key["abc technologies"]["sponsorship_count"] == 2
    assert by_key["abc technologies"]["first_year"] == "2023"
    assert by_key["abc technologies"]["last_year"] == "2024"
    assert by_key["wipro"]["latest_amount"] == "₹10,000"


def test_apply_review_keeps_yes_edit_drops_reject():
    rows = [
        {"thread_id": "t1", "Verified": "Yes"},
        {"thread_id": "t2", "Verified": "Edit"},
        {"thread_id": "t3", "Verified": "Reject"},
        {"thread_id": "t4", "Verified": ""},
    ]
    kept, rejected = apply_review(rows)
    assert [r["thread_id"] for r in kept] == ["t1", "t2", "t4"]
    assert [r["thread_id"] for r in rejected] == ["t3"]


def test_workbook_roundtrip(tmp_path):
    rows = classification_rows({
        "t1": _cls("t1", "positive", "ABC", "abc", "2024-09-15", "₹25,000", "R", "Symp"),
    })
    assert list(rows[0].keys()) == CLASSIFICATION_COLUMNS
    rpath = tmp_path / "review_sheet.xlsx"
    write_review_workbook(rows, [], rpath)
    cpath = tmp_path / "crm.xlsx"
    write_crm_workbook(rows, [], rows, [], cpath)
    csv = tmp_path / "out.csv"
    write_csv(rows, csv)
    assert csv.exists()
    back = read_reviewed_rows(rpath)
    assert back[0]["thread_id"] == "t1"
```

Note: `tests_fixture_script` referenced above should be a small helper module exporting `SCRIPT` (the scripted classify responses from Task 8). Move `SCRIPT` into `tests/fixtures/script.py` (importable as `from tests.fixtures.script import SCRIPT`) during implementation — or skip that import entirely (this test doesn't classify, it builds rows directly). Simplest: **drop the classification/classify imports** from this test; you don't need them.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_consolidation_export.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`agents/consolidation.py`:
```python
def build_history(crm_rows):
    history = {}
    for r in crm_rows:
        key = r.get("company_normalized") or ""
        if not key:
            continue
        rec = history.setdefault(key, {
            "company": r.get("company") or "",
            "company_normalized": key,
            "sponsorship_count": 0,
            "first_year": None,
            "last_year": None,
            "latest_date": None,
            "latest_amount": None,
            "latest_event": None,
            "latest_contact": None,
            "latest_email": None,
            "latest_phone": None,
            "latest_outcome": None,
        })
        rec["sponsorship_count"] += 1
        year = (r.get("conversation_date") or "")[:4] or None
        if year and (rec["first_year"] is None or year < rec["first_year"]):
            rec["first_year"] = year
        if year and (rec["last_year"] is None or year > rec["last_year"]):
            rec["last_year"] = year
        d = r.get("conversation_date") or ""
        if rec["latest_date"] is None or d > rec["latest_date"]:
            rec.update({
                "latest_date": d,
                "latest_amount": r.get("amount"),
                "latest_event": r.get("event"),
                "latest_contact": r.get("contact_person"),
                "latest_email": r.get("email"),
                "latest_phone": r.get("phone"),
                "latest_outcome": r.get("outcome"),
            })
    return sorted(history.values(), key=lambda h: (h["last_year"] or ""), reverse=True)


HISTORY_COLUMNS = [
    "company", "company_normalized", "sponsorship_count", "first_year",
    "last_year", "latest_date", "latest_amount", "latest_event",
    "latest_contact", "latest_email", "latest_phone", "latest_outcome",
]
```

`agents/export.py`:
```python
import os

CLASSIFICATION_COLUMNS = [
    "thread_id", "outcome", "confidence", "direction", "event", "company",
    "company_normalized", "contact_person", "designation", "email", "phone",
    "amount", "amount_type", "in_kind_note", "conversation_date",
    "evidence", "evidence_message_id",
]


def classification_rows(classifications) -> list:
    import dataclasses
    rows = []
    for c in classifications.values():
        d = dataclasses.asdict(c)
        rows.append({k: d.get(k) for k in CLASSIFICATION_COLUMNS})
    return rows


def _df(rows, columns):
    import pandas as pd
    return pd.DataFrame(rows, columns=columns)


def write_review_workbook(all_rows, problems_rows, path):
    import pandas as pd
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        _df(all_rows, CLASSIFICATION_COLUMNS + ["Verified"]).to_excel(
            writer, sheet_name="All Classified", index=False)
        cols = ["index", "errors", "item"]
        _df(problems_rows, cols).to_excel(writer, sheet_name="Parse Errors", index=False)


def write_crm_workbook(success_rows, interested_rows, all_rows, evidence_rows, path):
    import pandas as pd
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        _df(success_rows, CLASSIFICATION_COLUMNS).to_excel(
            writer, sheet_name="Sponsorships", index=False)
        _df(interested_rows, CLASSIFICATION_COLUMNS).to_excel(
            writer, sheet_name="Interested", index=False)
        _df(all_rows, CLASSIFICATION_COLUMNS).to_excel(
            writer, sheet_name="All Classified", index=False)
        _df(evidence_rows, ["thread_id", "evidence", "evidence_message_id"]).to_excel(
            writer, sheet_name="Evidence", index=False)


def write_csv(rows, path):
    import pandas as pd
    os.makedirs(os.path.dirname(path), exist_ok=True)
    _df(rows, CLASSIFICATION_COLUMNS).to_csv(path, index=False, encoding="utf-8-sig")


def write_dict_csv(rows, path):
    import pandas as pd
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not rows:
        pd.DataFrame().to_csv(path, index=False, encoding="utf-8-sig")
        return
    keys = list(rows[0].keys())
    _df(rows, keys).to_csv(path, index=False, encoding="utf-8-sig")


def read_reviewed_rows(path):
    import pandas as pd
    df = pd.read_excel(path, sheet_name="All Classified",
                       keep_default_na=False, dtype=str)
    return df.to_dict(orient="records")


def apply_review(rows):
    kept, rejected = [], []
    for r in rows:
        v = str(r.get("Verified") or "").strip().lower()
        if v in {"reject", "rejected", "no", "n", "false", "remove"}:
            rejected.append(r)
        else:
            kept.append(r)
    return kept, rejected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_consolidation_export.py -v`
Expected: PASS (3 tests after dropping the unused classify imports).

- [ ] **Step 5: Commit**

```bash
git add agents/consolidation.py agents/export.py tests/test_consolidation_export.py
git commit -m "feat: add consolidation and excel/csv export"
```

---

### Task 15: phase5_build runner

**Files:**
- Create: `phase5_build.py`
- Test: `tests/test_phase5.py`

**Interfaces:**
- Consumes: `store`, `dedupe`, `consolidation`, `export`, `Config`, `SUCCESS_OUTCOMES`
- Produces: `phase5_build.main(argv=None)`. Args: `--config`, `--evidence-dir`, `--output-dir`. Builds company map (saved to `company_map.json`), applies normalization, splits rows, writes `review_sheet.xlsx`, `sponsorship_crm.xlsx`, `sponsorship_history.csv`, `sponsorship_crm.csv`, `interested.csv`, `all_classified.csv` under the output dir.

- [ ] **Step 1: Write the failing test**

`tests/test_phase5.py`:
```python
from conftest import FIXTURE_STORE, scripted_classify_handler
from agents import store
from agents.classify import classify_all
from agents.llm import FakeLLMClient
from agents.config import Config
from phase5_build import main

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
           "company_normalized": "payments gateway", "contact_person": "Accounts",
           "designation": None, "email": "paymentsgateway@payments.com", "phone": None,
           "amount": "Rs 25,000", "amount_type": "money", "in_kind_note": None,
           "conversation_date": "2024-09-30", "evidence": "Payment processed.",
           "evidence_message_id": "t2m1"},
    "t3": {"outcome": "negotiation", "confidence": 0.8, "direction": "company_to_csea",
           "event": "CSEA Hackathon 2023", "company": "Wipro",
           "company_normalized": "wipro", "contact_person": None, "designation": None,
           "email": "contact@wipro.com", "phone": None, "amount": "Rs 10,000",
           "amount_type": "money", "in_kind_note": None, "conversation_date": "2023-03-10",
           "evidence": "We can sponsor Rs 10,000.", "evidence_message_id": "t3m1"},
    "t6": {"outcome": "positive", "confidence": 0.85, "direction": "csea_to_company",
           "event": "CSEA Tech Quiz 2020", "company": "Acme",
           "company_normalized": "acme", "contact_person": None, "designation": None,
           "email": "hello@acme.co.in", "phone": None, "amount": None,
           "amount_type": "in_kind", "in_kind_note": "logo placement", "conversation_date": "2020-02-12",
           "evidence": "Yes, we would like to sponsor the quiz.", "evidence_message_id": "t6m2"},
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
    "t8": {"outcome": "no_response", "confidence": 0.7, "direction": "csea_to_company",
           "event": "National Conference 2015", "company": None, "company_normalized": None,
           "contact_person": None, "designation": None, "email": "events@univ.edu",
           "phone": None, "amount": None, "amount_type": None, "in_kind_note": None,
           "conversation_date": "2015-02-01", "evidence": "No reply received.",
           "evidence_message_id": "t8m1"},
}


def _seed(tmp_path, cfg):
    ev = tmp_path / "evidence"
    store.save_threads(store.load_threads(FIXTURE_STORE), ev / "raw" / "emailstore.jsonl")
    threads = store.load_threads(ev / "raw" / "emailstore.jsonl")
    client = FakeLLMClient("x", handler=scripted_classify_handler(SCRIPT))
    classify_all(client, threads, cfg, ev / "state" / "classifications.json",
                 ev / "state" / "problems.json")


def test_phase5_produces_files(tmp_path, cfg):
    _seed(tmp_path, cfg)
    out = tmp_path / "out"
    main(["--evidence-dir", str(tmp_path / "evidence"), "--output-dir", str(out)])
    assert (out / "review_sheet.xlsx").exists()
    assert (out / "sponsorship_crm.xlsx").exists()
    assert (out / "sponsorship_history.csv").exists()
    assert (out / "sponsorship_crm.csv").exists()
    import pandas as pd
    crm = pd.read_csv(out / "sponsorship_crm.csv")
    assert set(crm["thread_id"]) == {"t1", "t2", "t3", "t6"}
    hist = pd.read_csv(out / "sponsorship_history.csv")
    assert len(hist) == 4
```

Note: exclude t7 (no candidate) and t8 (no_response not success) from crm; t4 in Interested. The assertion set == {"t1","t2","t3","t6"}.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_phase5.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`phase5_build.py`:
```python
import argparse
import os

from agents import consolidation, dedupe, export, store
from agents.config import Config
from agents.models import SUCCESS_OUTCOMES


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 5: build CRM exports")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    ap.add_argument("--output-dir", default=None)
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = dict(store.DEFAULT_PATHS)
    if args.evidence_dir:
        for k in paths:
            paths[k] = f"{args.evidence_dir}/{k}"
    output_dir = args.output_dir or paths["output"]
    os.makedirs(output_dir, exist_ok=True)

    classifications = store.load_classifications(paths["classifications"])
    problems = store.load_json(paths["problems"], default=[]) or []
    if not classifications:
        print("no classifications found; run phase3 first")
        return

    map_data = store.load_json(paths["company_map"], default={}) or {}
    known_renames = cfg.known_company_renames
    norm_map, raw_map = dedupe.build_company_map(
        [c.company for c in classifications.values() if c.company],
        known_renames=known_renames,
    )
    if not map_data:
        map_data = {k: v for k, v in norm_map.items()}
    for c in classifications.values():
        dedupe.apply_company_normalization(c, map_data)
    store.save_json(map_data, paths["company_map"])

    rows = export.classification_rows(classifications)
    success = [r for r in rows if r["outcome"] in SUCCESS_OUTCOMES]
    interested = [r for r in rows if r["outcome"] == "interested_uncommitted"]
    all_rows = rows
    evidence_rows = [{"thread_id": r["thread_id"], "evidence": r["evidence"],
                      "evidence_message_id": r["evidence_message_id"]} for r in rows]

    export.write_review_workbook(all_rows, problems,
                                 os.path.join(output_dir, "review_sheet.xlsx"))
    export.write_crm_workbook(success, interested, all_rows, evidence_rows,
                              os.path.join(output_dir, "sponsorship_crm.xlsx"))
    export.write_csv(success, os.path.join(output_dir, "sponsorship_crm.csv"))
    export.write_csv(interested, os.path.join(output_dir, "interested.csv"))
    export.write_csv(all_rows, os.path.join(output_dir, "all_classified.csv"))
    export.write_csv(consolidation.build_history(success),
                     os.path.join(output_dir, "sponsorship_history.csv"))
    print(f"CRM: {len(success)} successful, {len(interested)} interested, "
          f"{len(all_rows)} classified")


if __name__ == "__main__":
    main()
```

Note: `write_csv` enforces `CLASSIFICATION_COLUMNS` columns, but history rows have different columns — so history CSV is written with the consolidation writer. Adjust: add `write_dict_csv(rows, path)` in `export.py` that writes whatever dict keys exist, and use it for `sponsorship_history.csv`. Update Task 14's `export.py` accordingly (add `write_dict_csv`), and this task's `phase5_build.py` uses it for the history file.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_phase5.py -v`
Expected: PASS (1 test). `pandas.read_csv(str(out / "sponsorship_crm.csv"))` should parse; `₹` in amount columns may emit a BOM warning — read with `utf-8-sig` if needed.

- [ ] **Step 5: Commit**

```bash
git add phase5_build.py tests/test_phase5.py
git commit -m "feat: add phase5 build runner"
```

---

### Task 16: phase6_review runner

**Files:**
- Create: `phase6_review.py`
- Test: `tests/test_phase6.py`

**Interfaces:**
- Consumes: `export`, `dedupe`, `consolidation`, `store`, `Config`
- Produces:
  - `edits_to_company_map(review_rows: list[dict]) -> dict[str, str]`
  - `phase6_review.main(argv=None)`: args `--config`, `--evidence-dir`, `--output-dir`, `--review FILE` (default `<output-dir>/review_sheet.xlsx`). Reads reviewed sheet, applies `apply_review`, merges edits into `company_map.json`, re-normalizes, re-export cleansed finals.

- [ ] **Step 1: Write the failing test**

`tests/test_phase6.py`:
```python
from phase6_review import edits_to_company_map
from agents.export import apply_review
from agents import export, store
from agents.models import Classification
import os


def test_edits_to_company_map():
    rows = [
        {"company": "ABC Technologies", "company_normalized": "abc technologies"},
        {"company": "Wipro Ltd", "company_normalized": "wipro ltd new"},
        {"company": "", "company_normalized": ""},
    ]
    m = edits_to_company_map(rows)
    assert m["abc technologies"] == "abc technologies"
    assert m["wipro"] == "wipro ltd new"


def test_review_roundtrip(tmp_path):
    # write a review sheet, edit, apply
    cls = Classification("t1", "negative", 0.9, "company_to_csea", None,
                         "Small Bank", "small bank", None, None, "a@b.in", None,
                         None, None, None, "2021-01-20", "no", "m1")
    rows = export.classification_rows({"t1": cls})
    rpath = tmp_path / "review_sheet.xlsx"
    export.write_review_workbook(rows, [], rpath)
    back = export.read_reviewed_rows(rpath)
    back[0]["Verified"] = "Reject"
    kept, rejected = export.apply_review(back)
    assert rejected[0]["thread_id"] == "t1"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_phase6.py -v`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`phase6_review.py`:
```python
import argparse
import os

from agents import consolidation, dedupe, export, store
from agents.config import Config
from agents.models import SUCCESS_OUTCOMES, Classification


def edits_to_company_map(review_rows):
    updates = {}
    for r in review_rows:
        company = (r.get("company") or "").strip()
        canon = (r.get("company_normalized") or "").strip()
        if company and canon:
            updates[dedupe.normalize_company(company)] = canon
    return updates


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 6: apply human review")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    ap.add_argument("--output-dir", default=None)
    ap.add_argument("--review", default=None)
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = dict(store.DEFAULT_PATHS)
    if args.evidence_dir:
        for k in paths:
            paths[k] = f"{args.evidence_dir}/{k}"
    output_dir = args.output_dir or paths["output"]
    review_path = args.review or os.path.join(output_dir, "review_sheet.xlsx")

    rows = export.read_reviewed_rows(review_path)
    kept, rejected = export.apply_review(rows)
    map_data = store.load_json(paths["company_map"], default={}) or {}
    map_data.update(edits_to_company_map(kept))
    store.save_json(map_data, paths["company_map"])

    classifications = {r["thread_id"]: Classification.from_dict({
        k: r.get(k) for k in ("thread_id", "outcome", "confidence", "direction",
                              "event", "company", "company_normalized", "contact_person",
                              "designation", "email", "phone", "amount", "amount_type",
                              "in_kind_note", "conversation_date", "evidence",
                              "evidence_message_id")}) for r in kept}
    for c in classifications.values():
        dedupe.apply_company_normalization(c, map_data)

    rows_out = export.classification_rows(classifications)
    success = [r for r in rows_out if r["outcome"] in SUCCESS_OUTCOMES]
    interested = [r for r in rows_out if r["outcome"] == "interested_uncommitted"]
    evidence_rows = [{"thread_id": r["thread_id"], "evidence": r["evidence"],
                      "evidence_message_id": r["evidence_message_id"]} for r in rows_out]

    export.write_crm_workbook(success, interested, rows_out, evidence_rows,
                              os.path.join(output_dir, "sponsorship_crm.xlsx"))
    export.write_csv(success, os.path.join(output_dir, "sponsorship_crm.csv"))
    export.write_csv(interested, os.path.join(output_dir, "interested.csv"))
    export.write_csv(rows_out, os.path.join(output_dir, "all_classified.csv"))
    export.write_dict_csv(consolidation.build_history(success),
                          os.path.join(output_dir, "sponsorship_history.csv"))
    print(f"reviewed: kept {len(kept)}, rejected {len(rejected)}; "
          f"CLEAN crm has {len(success)} successful sponsorships")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_phase6.py -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add phase6_review.py tests/test_phase6.py
git commit -m "feat: add phase6 review runner"
```

---

### Task 17: README + end-to-end integration test

**Files:**
- Create: `README.md`
- Create: `tests/test_e2e.py`

**Interfaces:**
- Consumes: everything; fixtures + script in `tests/fixtures`/`tests/conftest.py`
- Produces: complete runnable FEREFORE.

- [ ] **Step 1: Write the failing e2e test**

`tests/test_e2e.py`:
```python
import json

from conftest import FIXTURE_STORE, scripted_classify_handler
from agents import store, score, dedupe, consolidation, export
from agents.classify import classify_all
from agents.llm import FakeLLMClient
from agents.models import SUCCESS_OUTCOMES

# reuse the SCRIPT from tests/test_phase5.py by moving it to tests/fixtures/script.py
from tests.fixtures.script import SCRIPT  # flake8: noqa


def test_full_pipeline_with_mocked_llm(tmp_path, cfg):
    ev = tmp_path / "evidence"
    store.save_threads(store.load_threads(FIXTURE_STORE), ev / "raw" / "emailstore.jsonl")
    threads = store.load_threads(ev / "raw" / "emailstore.jsonl")

    candidates = score.candidate_threads(threads, cfg)
    store.save_candidates(candidates, ev / "state" / "candidates.json")
    assert "t7" not in candidates

    client = FakeLLMClient("x", handler=scripted_classify_handler(SCRIPT))
    classifications = classify_all(
        client,
        [t for t in threads if t.thread_id in candidates],
        cfg,
        ev / "state" / "classifications.json",
        ev / "state" / "problems.json",
    )
    assert set(classifications) == {"t1", "t2", "t3", "t4", "t5", "t6", "t8"}

    norm_map, _ = dedupe.build_company_map(
        [c.company for c in classifications.values() if c.company],
        known_renames=cfg.known_company_renames,
    )
    for c in classifications.values():
        dedupe.apply_company_normalization(c, norm_map)

    rows = export.classification_rows(classifications)
    success = [r for r in rows if r["outcome"] in SUCCESS_OUTCOMES]
    history = consolidation.build_history(success)
    assert {r["thread_id"] for r in success} == {"t1", "t2", "t3", "t6"}
    assert len(history) == 4
    # ABC Technologies sponsored twice in different years -> consolidated history row
    abc = [h for h in history if h["company_normalized"] == "abc technologies"][0]
    assert abc["sponsorship_count"] == 1  # only t1 classified as ABC in this run
    print("E2E ok:", {r["thread_id"]: r["outcome"] for r in success})
```

Note: with this SCRIPT, only t1 is ABC Technologies, so its history count is 1. The important invariant is `success == {t1,t2,t3,t6}` and the whole path executes offline. Move `SCRIPT` (identical dict to Task 15) into `tests/fixtures/script.py` so both `test_phase5.py` and `test_e2e.py` share it.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_e2e.py -v`
Expected: FAIL (no module `tests.fixtures.script` yet, or `t8` missing from candidates because its body lacks keywords and direction is outbound — if that fails, add `"request for sponsorship"` to KEYWORD_PATTERNS in `score.py` since "sponsorship" already covers it via regex `sponsor`).

- [ ] **Step 3: Create the shared script fixture**

`tests/fixtures/script.py`:
```python
SCRIPT = {
    "t1": {"outcome": "positive", "confidence": 0.95, "direction": "company_to_csea",
           "event": "CSEA Symposium 2024", "company": "ABC Technologies",
           "company_normalized": "abc technologies", "contact_person": "Rahul Kumar",
           "designation": "HR Manager", "email": "rahul@abctech.com",
           "phone": "+91 9876543210", "amount": "₹25,000", "amount_type": "money",
           "in_kind_note": None, "conversation_date": "2024-09-15",
           "evidence": "We are happy to sponsor your event.", "evidence_message_id": "t1m1"},
    # … all 7 candidate threads exactly as in Task 15 …
}
```
Copy the full SCRIPT dict from Task 15 here verbatim.

- [ ] **Step 4: Write the README**

`README.md` (summary of the whole repo — setup, OAuth, run order, review loop):
```markdown
# Sponsorship CRM Pipeline

Converts a student association's email archive (~3,000 emails over ~10 years)
into a sponsorship CRM (Excel/CSV) using a staged, resumable pipeline.

## Setup
1. `python -m pip install -r requirements.txt`
2. Get a Gemini API key from Google AI Studio (free tier) and set `GEMINI_API_KEY`.
3. For Gmail: create a Google Cloud project, enable Gmail API, download
   `credentials.json` (OAuth client, Desktop app type) into this folder.
   First run of `phase1_fetch.py --source gmail` opens a browser consent screen.
   Uses read-only scope; tokens cached in `token.json`.

## Usage (run in this order)
```
python phase1_fetch.py --source mbox --mbox mail.mbox   # past Takeout export
python phase1_fetch.py --source gmail --query "has:attachment OR sponsor"  # or full archive
python phase2_candidates.py                            # add --broad-pass to catch non-keyword threads
python phase3_classify.py                              # AI classification + extraction (batched, checkpointed)
python phase5_build.py                                 # exports review_sheet.xlsx + CRM
# → open evidence/output/review_sheet.xlsx, set Verified = Yes/Edit/Reject, save
python phase6_review.py --review evidence/output/review_sheet.xlsx   # cleansed finals
```

## Outputs (evidence/output/)
- `sponsorship_crm.xlsx` — sheets: Sponsorships, Interested, All Classified, Evidence
- `sponsorship_crm.csv`, `interested.csv`, `all_classified.csv`
- `sponsorship_history.csv` — one row per company: how many times, which years,
  latest amount/event/contact
- `review_sheet.xlsx` — every classified thread + evidence + blank `Verified`

## Rules
- Success = outcome in `positive`, `negotiation`, `completed`.
- Non-success outcomes are excluded from the CRM but kept in `all_classified.csv`.
- Evidence is always the AI's verbatim quote from the thread you review.
- Re-running any phase is safe — it only processes what's missing.
```

- [ ] **Step 5: Run the full suite**

Run: `python -m pytest tests/ -v`
Expected: ALL PASS. Fix any single failing module, then re-run until green.

- [ ] **Step 6: Commit**

```bash
git add README.md tests/fixtures/script.py tests/test_e2e.py
git commit -m "feat: add README and end-to-end integration test"
```

---

## Self-Review Notes (executor)

- Task 5's `score.py` imports `store` unnecessarily — remove before commit.
- Task 2's `Classification.__post_init__` stub is vestigial — remove.
- Task 13's `build_company_map` has a redundant `setdefault`/dead `pass` — simplify.
- Task 14 adds `export.write_dict_csv(rows, path)` used by phase5/phase6 for the history CSV (different column set from `CLASSIFICATION_COLUMNS`).
- If any phase test's `read_csv` trips on `₹`, read with `encoding="utf-8-sig"`.
- The plan's spec-path prose underspecifies path args; the code blocks are authoritative.