from agents.config import Config


def test_load_returns_defaults_when_missing():
    cfg = Config.load("docs/does-not-exist.yaml")
    assert cfg.org_name == "Example Org"
    assert cfg.association_name == cfg.org_name
    assert cfg.use_case
    assert cfg.model == "gemini-3.6-flash"
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