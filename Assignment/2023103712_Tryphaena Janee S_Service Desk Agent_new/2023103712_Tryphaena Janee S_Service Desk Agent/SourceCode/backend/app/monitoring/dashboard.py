"""Builds the monitoring dashboard payload.

Durable KPIs (volumes, outcomes, cost, CSAT) are computed from the database so
they survive restarts and are consistent across replicas. Fine-grained runtime
signals (node latency, guardrail hits) come from the in-process metrics registry,
which Prometheus scrapes at /metrics for long-term storage and alerting.
"""
from __future__ import annotations

import statistics
import time
from collections import Counter, defaultdict

from ..config import settings
from .metrics import METRICS

STARTED_AT = time.time()

# Alert thresholds shown on the dashboard (mirrored in deploy/prometheus/alerts.yml)
SLO = {"p95_latency_ms": 4000, "auto_resolution_rate_min": 0.40, "error_rate_max": 0.02,
       "csat_min": 4.0, "cost_per_ticket_max_usd": 0.05, "guardrail_block_rate_max": 0.05}


def _pct(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    vals = sorted(values)
    idx = min(len(vals) - 1, int(round(q * (len(vals) - 1))))
    return round(vals[idx], 1)


def build_summary(store, llm, hours: int = 24) -> dict:
    since = time.time() - hours * 3600
    rows = store.analytics_rows(since)
    tickets, traces, approvals = rows["tickets"], rows["traces"], rows["approvals"]

    total = len(tickets)
    by_status = Counter(t["status"] for t in tickets)
    by_resolution = Counter(t["resolution"] or "open" for t in tickets)
    by_category = Counter(t["category"] or "uncategorised" for t in tickets)
    auto = by_resolution.get("auto_resolved", 0)
    escalated = by_resolution.get("escalated", 0)
    decided = sum(v for k, v in by_resolution.items() if k != "open")
    deflection = auto / decided if decided else 0.0

    latencies = [tr["total_ms"] for tr in traces]
    tin = sum(tr["input_tokens"] for tr in traces)
    tout = sum(tr["output_tokens"] for tr in traces)
    spend = sum(tr["cost_usd"] for tr in traces)

    csats = [t["csat"] for t in tickets if t["csat"]]
    mttr = defaultdict(list)
    for t in tickets:
        if t["resolved_at"]:
            mttr[t["resolution"] or "other"].append((t["resolved_at"] - t["created_at"]) / 60)

    waits = [(a["decided_at"] - a["created_at"]) / 60 for a in approvals if a["decided_at"]]
    errors = METRICS.counter_total("agent_errors_total")
    runs = max(1, len(traces))
    blocks = METRICS.counter_total("guardrail_blocks_total")
    hours_saved = auto * settings.minutes_saved_per_auto_resolution / 60

    # hourly series for the trend chart
    buckets = defaultdict(lambda: Counter())
    for t in tickets:
        hour = int(t["created_at"] // 3600 * 3600)
        buckets[hour][t["resolution"] or "open"] += 1
    series = [{"hour": h, **dict(c)} for h, c in sorted(buckets.items())]

    breaker = getattr(llm, "breaker", None)
    p95 = _pct(latencies, 0.95)
    auto_rate = round(deflection, 3)
    csat_avg = round(statistics.mean(csats), 2) if csats else None
    cost_per_ticket = round(spend / total, 5) if total else 0.0

    alerts = []
    if latencies and p95 > SLO["p95_latency_ms"]:
        alerts.append({"severity": "warning", "signal": "health", "msg": f"p95 latency {p95} ms above SLO"})
    if decided >= 10 and auto_rate < SLO["auto_resolution_rate_min"]:
        alerts.append({"severity": "warning", "signal": "business", "msg": "Auto-resolution rate below target"})
    if errors / runs > SLO["error_rate_max"]:
        alerts.append({"severity": "critical", "signal": "health", "msg": "Agent error rate above 2%"})
    if csat_avg is not None and csat_avg < SLO["csat_min"]:
        alerts.append({"severity": "warning", "signal": "quality", "msg": f"CSAT {csat_avg} below 4.0"})
    if breaker and breaker.state != "closed":
        alerts.append({"severity": "critical", "signal": "health", "msg": f"LLM circuit {breaker.state} - rules fallback active"})
    if total and blocks / total > SLO["guardrail_block_rate_max"]:
        alerts.append({"severity": "warning", "signal": "safety", "msg": "Unusual guardrail block rate - possible abuse"})

    return {
        "window_hours": hours,
        "generated_at": time.time(),
        "slo": SLO,
        "alerts": alerts,
        "health": {
            "uptime_s": round(time.time() - STARTED_AT),
            "agent_runs": len(traces),
            "error_count": errors,
            "error_rate": round(errors / runs, 4),
            "latency_avg_ms": round(statistics.mean(latencies), 1) if latencies else 0,
            "latency_p50_ms": _pct(latencies, 0.5),
            "latency_p95_ms": p95,
            "llm_model": getattr(llm, "name", "unknown"),
            "llm_circuit": breaker.state if breaker else "n/a (mock)",
            "llm_fallbacks": METRICS.counter_total("llm_fallbacks_total"),
        },
        "trace": {"node_latency": METRICS.hist_summary("agent_node_latency_ms")},
        "quality": {
            "csat_avg": csat_avg,
            "csat_responses": len(csats),
            "triage_confidence": METRICS.hist_summary("triage_confidence_pct"),
            "tool_success_rate": _tool_success(),
        },
        "safety": {
            "guardrail_blocks": blocks,
            "pii_redactions": METRICS.counter_total("guardrail_redactions_total"),
            "output_redactions": METRICS.counter_total("guardrail_output_redactions_total"),
            "policy_denials": METRICS.counter_total("policy_denials_total"),
            "approvals_requested": len(approvals),
            "approvals_pending": sum(1 for a in approvals if a["status"] == "PENDING"),
            "approvals_rejected": sum(1 for a in approvals if a["status"] == "REJECTED"),
        },
        "cost": {
            "input_tokens": tin,
            "output_tokens": tout,
            "total_usd": round(spend, 4),
            "per_ticket_usd": cost_per_ticket,
            "per_auto_resolution_usd": round(spend / auto, 5) if auto else None,
        },
        "business": {
            "tickets": total,
            "auto_resolved": auto,
            "escalated": escalated,
            "awaiting_approval": by_status.get("AWAITING_APPROVAL", 0),
            "auto_resolution_rate": auto_rate,
            "agent_hours_saved": round(hours_saved, 1),
            "cost_avoided_usd": round(hours_saved * settings.loaded_cost_per_agent_hour - spend, 2),
            "mttr_minutes": {k: round(statistics.mean(v), 1) for k, v in mttr.items()},
            "approval_wait_avg_min": round(statistics.mean(waits), 1) if waits else None,
            "by_category": dict(by_category),
            "by_resolution": dict(by_resolution),
        },
        "series": series,
    }


def _tool_success() -> dict:
    out = {}
    with METRICS._lock:
        series = dict(METRICS.counters.get("tool_calls_total", {}))
    agg = defaultdict(lambda: {"ok": 0, "fail": 0})
    for labels, v in series.items():
        d = dict(labels)
        agg[d["tool"]]["ok" if d["ok"] == "true" else "fail"] += v
    for tool, c in agg.items():
        n = c["ok"] + c["fail"]
        out[tool] = {"calls": int(n), "success_rate": round(c["ok"] / n, 3) if n else None}
    return out
