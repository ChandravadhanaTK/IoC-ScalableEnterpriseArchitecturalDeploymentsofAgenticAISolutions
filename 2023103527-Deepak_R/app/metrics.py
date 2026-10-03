import threading
from collections import defaultdict


class Metrics:
    def __init__(self):
        self.lock = threading.Lock()
        self.counters = defaultdict(int)
        self.latency_ms = []
        self.paid_total = 0.0

    def inc(self, name, n=1):
        with self.lock:
            self.counters[name] += n

    def observe(self, ms):
        with self.lock:
            self.latency_ms.append(ms)
            self.latency_ms = self.latency_ms[-500:]

    def paid(self, amt):
        with self.lock:
            self.paid_total += amt

    def snapshot(self):
        with self.lock:
            lat = sorted(self.latency_ms)
            p95 = lat[max(int(len(lat) * 0.95) - 1, 0)] if lat else 0
            total = self.counters["claims_total"] or 1
            return {
                "health": "UP",
                "counters": dict(self.counters),
                "latency_p95_ms": round(p95, 2),
                "auto_approval_rate": round(self.counters["approved_auto"] / total, 3),
                "rejection_rate": round(self.counters["rejected"] / total, 3),
                "failure_rate": round(self.counters["failed"] / total, 3),
                "guardrail_blocks": self.counters["guardrail_blocks"],
                "total_payout_inr": round(self.paid_total, 2),
            }

    def prometheus(self):
        s = self.snapshot()
        lines = [f"agromitra_{k} {v}" for k, v in s["counters"].items()]
        lines += [f"agromitra_latency_p95_ms {s['latency_p95_ms']}",
                  f"agromitra_total_payout_inr {s['total_payout_inr']}"]
        return "\n".join(lines) + "\n"


metrics = Metrics()
