"""In-process metrics with Prometheus text exposition (no client library needed).

Covers the six dashboard pillars:
  health   - request counts, errors, latency histograms, LLM circuit state
  trace    - per-agent-node latency
  quality  - triage confidence, KB relevance, CSAT, fallbacks
  safety   - guardrail blocks, PII redactions, policy denials
  cost     - input/output tokens and USD
  business - outcomes (auto-resolved, escalated, approval) -> deflection, hours saved
"""
from __future__ import annotations

import threading
from collections import defaultdict

DEFAULT_BUCKETS = (5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000)


def _key(labels: dict | None) -> tuple:
    return tuple(sorted((labels or {}).items()))


class Metrics:
    def __init__(self):
        self._lock = threading.Lock()
        self.counters: dict[str, dict[tuple, float]] = defaultdict(lambda: defaultdict(float))
        self.gauges: dict[str, dict[tuple, float]] = defaultdict(dict)
        self.hists: dict[str, dict[tuple, dict]] = defaultdict(dict)
        self.help: dict[str, str] = {}

    def inc(self, name: str, labels: dict | None = None, value: float = 1.0, help: str = "") -> None:
        with self._lock:
            self.counters[name][_key(labels)] += value
            if help:
                self.help[name] = help

    def set(self, name: str, value: float, labels: dict | None = None, help: str = "") -> None:
        with self._lock:
            self.gauges[name][_key(labels)] = value
            if help:
                self.help[name] = help

    def observe(self, name: str, value: float, labels: dict | None = None, help: str = "",
                buckets: tuple = DEFAULT_BUCKETS) -> None:
        with self._lock:
            h = self.hists[name].get(_key(labels))
            if h is None:
                h = {"buckets": {b: 0 for b in buckets}, "sum": 0.0, "count": 0}
                self.hists[name][_key(labels)] = h
            for b in h["buckets"]:
                if value <= b:
                    h["buckets"][b] += 1
            h["sum"] += value
            h["count"] += 1
            if help:
                self.help[name] = help

    def counter_total(self, name: str, **match) -> float:
        with self._lock:
            return sum(v for k, v in self.counters.get(name, {}).items()
                       if all(dict(k).get(mk) == mv for mk, mv in match.items()))

    def hist_summary(self, name: str) -> dict:
        """Aggregate histogram across labels: count, mean, approx p50/p95 from buckets."""
        with self._lock:
            series = list(self.hists.get(name, {}).items())
        out = {}
        for labels, h in series:
            label = dict(labels).get("node", "all")
            cnt = h["count"]
            out[label] = {"count": cnt, "mean_ms": round(h["sum"] / cnt, 1) if cnt else 0,
                          "p95_ms": _quantile(h, 0.95)}
        return out

    def render_prometheus(self) -> str:
        lines: list[str] = []
        with self._lock:
            for name, series in sorted(self.counters.items()):
                lines += [f"# HELP {name} {self.help.get(name, name)}", f"# TYPE {name} counter"]
                for k, v in series.items():
                    lines.append(f"{name}{_fmt(k)} {v}")
            for name, series in sorted(self.gauges.items()):
                lines += [f"# HELP {name} {self.help.get(name, name)}", f"# TYPE {name} gauge"]
                for k, v in series.items():
                    lines.append(f"{name}{_fmt(k)} {v}")
            for name, series in sorted(self.hists.items()):
                lines += [f"# HELP {name} {self.help.get(name, name)}", f"# TYPE {name} histogram"]
                for k, h in series.items():
                    for b, c in h["buckets"].items():
                        lines.append(f"{name}_bucket{_fmt(k, le=str(b))} {c}")
                    lines.append(f"{name}_bucket{_fmt(k, le='+Inf')} {h['count']}")
                    lines.append(f"{name}_sum{_fmt(k)} {h['sum']}")
                    lines.append(f"{name}_count{_fmt(k)} {h['count']}")
        return "\n".join(lines) + "\n"


def _fmt(k: tuple, **extra) -> str:
    items = list(k) + list(extra.items())
    if not items:
        return ""
    return "{" + ",".join(f'{a}="{str(b).replace(chr(34), "")}"' for a, b in items) + "}"


def _quantile(h: dict, q: float) -> float:
    target = h["count"] * q
    for b, c in sorted(h["buckets"].items()):
        if c >= target:
            return float(b)
    return float(max(h["buckets"]))


METRICS = Metrics()
