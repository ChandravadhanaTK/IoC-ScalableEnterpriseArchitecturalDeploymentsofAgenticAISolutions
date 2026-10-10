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