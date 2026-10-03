"""Generic (domain-agnostic) parsing contract.

RED tests: these describe the desired generic behavior and must FAIL
before the general-purpose refactor.
"""
import pathlib
import sys

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def test_config_defaults_are_generic_placeholders():
    from agents.config import Config
    cfg = Config()
    # Must not ship CSEA/sponsorship-specific defaults
    assert cfg.org_name == "Example Org"
    assert cfg.use_case
    assert "CSEA" not in cfg.org_name
    # legacy alias still works for backwards compat
    assert cfg.association_name == cfg.org_name


def test_config_legacy_association_name_alias():
    from agents.config import Config
    cfg = Config.from_dict({"association_name": "ACM", "events": ["Hackathon"]})
    assert cfg.org_name == "ACM"
    assert cfg.events == ["Hackathon"]


def test_config_example_file_has_placeholders_only():
    import yaml
    p = PROJECT_ROOT / "config.yaml.example"
    assert p.exists(), "config.yaml.example must exist"
    d = yaml.safe_load(p.read_text(encoding="utf-8")) or {}
    blob = str(d).lower()
    for secret in ("abacus.org.in", "cseaceg", "gmail.com"):
        assert secret not in blob, f"example config must not contain {secret!r}"
    assert d.get("org_name")
    assert d.get("use_case")


def test_system_prompt_is_generic():
    from agents.config import Config
    from agents.classify import CLASSIFY_SYSTEM
    from agents.rules import build_system_prompt
    cfg = Config(org_name="Acme Org", use_case="vendor triage")
    cats = [{"name": "vendor_followup", "description": "Vendor needs follow-up.", "examples": []}]
    prompt = build_system_prompt("Acme Org", "vendor triage", cats)
    assert "Acme Org" in prompt
    assert "vendor triage" in prompt
    assert "vendor_followup" in prompt
    assert "CSEA" not in prompt
    assert "sponsor" not in prompt.lower()

    legacy = CLASSIFY_SYSTEM(cfg)
    assert "Acme Org" in legacy
    assert "CSEA" not in legacy


def test_default_rules_are_valid_and_generic_example():
    from agents.rules import DEFAULT_RULES, validate_rules
    assert validate_rules(DEFAULT_RULES) == []
    blob = str(DEFAULT_RULES).lower()
    assert "csea" not in blob
    assert "govi" not in blob and "guvi" not in blob


def test_consolidation_uses_generic_count_column():
    from agents.consolidation import HISTORY_COLUMNS, build_history
    assert "sponsorship_count" not in HISTORY_COLUMNS
    assert "match_count" in HISTORY_COLUMNS
    rows = [{
        "company": "Acme", "company_normalized": "acme",
        "conversation_date": "2024-01-02", "amount": None,
        "event": None, "contact_person": None, "email": None,
        "phone": None, "outcome": "vendor_followup",
    }]
    hist = build_history(rows)
    assert hist[0]["match_count"] == 1


def test_secret_hygiene_files():
    p = PROJECT_ROOT / ".env.example"
    assert p.exists(), ".env.example must exist"
    assert "GEMINI_API_KEY" in p.read_text(encoding="utf-8") or "API_KEY" in p.read_text(encoding="utf-8")
    gitignore = (PROJECT_ROOT / ".gitignore").read_text(encoding="utf-8")
    for pat in (".env", "credentials.json", "token.json", "*.mbox", "evidence/"):
        assert pat in gitignore, f".gitignore must cover {pat}"
