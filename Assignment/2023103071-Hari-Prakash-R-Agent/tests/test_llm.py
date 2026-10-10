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


def test_make_llm_client_requires_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    cfg = Config(model="gemini-3.6-flash")
    with pytest.raises(LLMError):
        make_llm_client(cfg)  # no GEMINI_API_KEY set → LLMError