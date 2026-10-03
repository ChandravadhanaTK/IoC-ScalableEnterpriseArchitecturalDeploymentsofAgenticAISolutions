import statistics
from collections import Counter

COST_PER_REQUEST_USD = 0.002  # estimated model/tool cost placeholder


class Metrics:
    def __init__(self):
        self.reset()

    def reset(self):
        self.requests = 0
        self.states = Counter()
        self.latencies = []
        self.blocked = 0
        self.escalations = 0
        self.approvals = Counter()

    def record(self, state, latency_ms):
        self.requests += 1
        self.states[state] += 1
        self.latencies.append(latency_ms)
        if state == "ESCALATED":
            self.escalations += 1
        if state == "BLOCKED":
            self.blocked += 1

    def snapshot(self):
        lat = sorted(self.latencies)
        p = lambda q: lat[min(len(lat) - 1, int(q * len(lat)))] if lat else 0
        resolved = self.states["RESOLVED"] + self.states["DONE"]
        return {
            "requests": self.requests,
            "outcomes": dict(self.states),
            "latency_ms": {"p50": round(p(0.5), 2), "p95": round(p(0.95), 2),
                           "avg": round(statistics.mean(lat), 2) if lat else 0},
            "blocked_requests": self.blocked,
            "escalation_rate": round(self.escalations / self.requests, 3) if self.requests else 0,
            "auto_resolution_rate": round(resolved / self.requests, 3) if self.requests else 0,
            "approvals": dict(self.approvals),
            "estimated_cost_usd": round(self.requests * COST_PER_REQUEST_USD, 4),
        }


metrics = Metrics()
