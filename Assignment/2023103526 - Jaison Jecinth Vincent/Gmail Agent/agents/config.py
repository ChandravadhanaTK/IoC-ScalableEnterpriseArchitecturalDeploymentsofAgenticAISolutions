from dataclasses import dataclass, field
import os
import yaml


@dataclass
class Config:
    org_name: str = "Example Org"
    use_case: str = "general email classification"
    association_name: str = ""
    events: list = field(default_factory=lambda: ["Example Event"])
    model: str = "gemini-3.6-flash"
    provider: str = "gemini"
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
    own_addresses: list = field(default_factory=list)
    config_dir: str = ""

    def __post_init__(self):
        # Backwards compat: legacy `association_name` aliases `org_name`.
        if self.association_name and self.org_name in ("", "Example Org"):
            self.org_name = self.association_name
        if not self.association_name:
            self.association_name = self.org_name

    @classmethod
    def from_dict(cls, d: dict) -> "Config":
        valid = set(cls.__dataclass_fields__.keys())
        data = {k: v for k, v in d.items() if k in valid}
        # Legacy alias: association_name -> org_name (explicit file value wins).
        if "association_name" in data and "org_name" not in data:
            data["org_name"] = data["association_name"]
        cfg = cls(**data)
        cfg.association_name = cfg.org_name
        return cfg

    @classmethod
    def load(cls, path: str = "config.yaml") -> "Config":
        d = {}
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                d = yaml.safe_load(f) or {}
        # Env overrides (never put secrets in YAML).
        for key, env in (("org_name", "ORG_NAME"), ("use_case", "USE_CASE"),
                         ("model", "MODEL"), ("provider", "PROVIDER")):
            val = os.environ.get(env)
            if val:
                d[key] = val
        cfg = cls.from_dict(d)
        cfg.config_dir = os.path.dirname(os.path.abspath(path))
        return cfg