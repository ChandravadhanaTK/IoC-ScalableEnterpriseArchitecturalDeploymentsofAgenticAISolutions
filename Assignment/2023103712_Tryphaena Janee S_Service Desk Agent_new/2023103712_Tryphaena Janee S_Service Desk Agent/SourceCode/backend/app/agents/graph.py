"""A small, explicit state-graph engine (LangGraph-style, zero dependencies).

Why not a free-running ReAct loop? Enterprise workflows need:
  * a finite, reviewable set of states and transitions
  * deterministic interrupt points for human approval
  * bounded execution (max steps) and a guaranteed failure path
  * per-node tracing and metrics

Each node is `fn(state, ctx) -> next_node_name`. Special targets:
  END        finish the run
If a node raises, the engine records the error and routes to `failure_node`
(escalation). If the failure node itself raises, `safe_fallback` sets a canned
reply so the user is never left without an answer.
"""
from __future__ import annotations

import logging
import time
from typing import Callable

from ..monitoring.metrics import METRICS

END = "__end__"
log = logging.getLogger("servicedesk.graph")

NodeFn = Callable[[dict, "object"], str]


class StateGraph:
    def __init__(self, nodes: dict[str, NodeFn], entry: str, failure_node: str, max_steps: int = 20):
        self.nodes = nodes
        self.entry = entry
        self.failure_node = failure_node
        self.max_steps = max_steps

    def run(self, state: dict, ctx, start: str | None = None) -> dict:
        node = start or self.entry
        steps = 0
        state.setdefault("history", [])
        state.setdefault("errors", [])
        while node != END:
            steps += 1
            if steps > self.max_steps:
                state["errors"].append({"node": node, "error": "max_steps_exceeded"})
                METRICS.inc("agent_errors_total", {"node": node, "type": "max_steps"})
                safe_fallback(state, "loop_guard")
                break
            fn = self.nodes.get(node)
            if fn is None:
                state["errors"].append({"node": node, "error": "unknown_node"})
                safe_fallback(state, "unknown_node")
                break
            t0 = time.perf_counter()
            try:
                with ctx.tracer.span(f"agent.{node}", kind="agent") as attrs:
                    nxt = fn(state, ctx)
                    attrs["next"] = nxt
            except Exception as exc:  # noqa: BLE001 - routed to failure path deliberately
                log.exception("node %s failed", node, extra={"trace_id": ctx.tracer.trace_id, "node": node})
                state["errors"].append({"node": node, "error": f"{type(exc).__name__}: {exc}"[:300]})
                METRICS.inc("agent_errors_total", {"node": node, "type": type(exc).__name__},
                            help="Unhandled exceptions inside agent nodes")
                if node == self.failure_node:
                    safe_fallback(state, "failure_path_failed")
                    nxt = END
                else:
                    state["failure_reason"] = f"internal error in {node}"
                    nxt = self.failure_node
            elapsed = (time.perf_counter() - t0) * 1000
            METRICS.observe("agent_node_latency_ms", elapsed, {"node": node},
                            help="Latency of each agent node")
            state["history"].append({"node": node, "next": nxt, "ms": round(elapsed, 2),
                                     "ts": time.time()})
            node = nxt
        return state


def safe_fallback(state: dict, reason: str) -> None:
    state["outcome"] = "escalated"
    state["status"] = "ESCALATED"
    state["resolution"] = f"fallback:{reason}"
    state["reply"] = ("Sorry - I hit a problem handling this automatically. Your request has been "
                      "saved and routed to the Service Desk team, who will contact you shortly.")
