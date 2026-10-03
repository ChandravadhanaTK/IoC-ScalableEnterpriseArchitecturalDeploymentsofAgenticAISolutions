"""
Enterprise Support-Desk Agent (capstone starter)
================================================
A small multi-agent system that shows the five capstone deliverables in code:

  1. Architecture   -> layers: input guard -> agents -> tools -> audit/metrics
  2. Workflow       -> Triage agent -> Resolver agent -> approval -> done/escalate
  3. Deployment     -> config from environment variables (dev / staging / prod)
  4. Security       -> tool allow-list per role, PII redaction, approval gate, audit log
  5. Monitoring     -> metrics.jsonl (latency, tokens, cost, outcome) per request

Setup:
    pip install anthropic
    export ANTHROPIC_API_KEY="your-key"
Run:
    python 1_agentic_support_desk.py "Refund order A100, the item arrived broken"
Try also:
    python 1_agentic_support_desk.py "Where is my order A200?"
    python 1_agentic_support_desk.py "Refund order A300"      # > limit -> needs approval
"""
import json
import os
import re
import sys
import time
import uuid

import anthropic

# --------------------------------------------------------------------------
# Config (Deployment): same code, different behaviour per environment
# --------------------------------------------------------------------------
APP_ENV = os.getenv("APP_ENV", "dev")                 # dev | staging | prod
MODEL = os.getenv("AGENT_MODEL", "claude-sonnet-5-5")
MAX_STEPS = int(os.getenv("MAX_STEPS", "8"))          # failure path: stop loops
REFUND_AUTO_LIMIT = float(os.getenv("REFUND_AUTO_LIMIT", "500"))
# Illustrative prices (USD per million tokens). Replace with your real rates.
PRICE_IN, PRICE_OUT = 3.0, 15.0

client = None  # created in main() so the file can be imported/tested without a key

# --------------------------------------------------------------------------
# Fake business systems (replace with real APIs/databases)
# --------------------------------------------------------------------------
ORDERS = {
    "A100": {"status": "delivered", "total": 120.0, "item": "Headphones"},
    "A200": {"status": "in transit", "total": 60.0, "item": "Phone case"},
    "A300": {"status": "delivered", "total": 900.0, "item": "Laptop"},
}


# --------------------------------------------------------------------------
# Security: audit log, PII redaction, approval gate
# --------------------------------------------------------------------------
TRACE_ID = ""
metrics = {}


def audit(event: str, **data):
    """Append-only record of everything important (who/what/when)."""
    record = {"ts": time.time(), "trace": TRACE_ID, "env": APP_ENV, "event": event, **data}
    with open("audit.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")


def redact(text: str) -> str:
    """Privacy guardrail: hide emails and phone numbers."""
    text = re.sub(r"[\w.+-]+@[\w-]+\.[\w.]+", "[EMAIL]", text)
    return re.sub(r"\b\d{10}\b", "[PHONE]", text)


def human_approval(action: str) -> bool:
    """Human-in-the-loop. Only interactive in dev; otherwise deny by default."""
    if APP_ENV != "dev":
        audit("approval_auto_denied", action=action)
        return False
    answer = input(f"\n[APPROVAL NEEDED] {action}\nApprove? (y/n): ").strip().lower()
    return answer == "y"


# --------------------------------------------------------------------------
# Tools (with business rules enforced in code, not left to the model)
# --------------------------------------------------------------------------
def lookup_order(order_id: str) -> str:
    order = ORDERS.get(order_id.upper())
    return json.dumps(order) if order else "Error: order not found."


def check_refund_policy(order_id: str) -> str:
    order = ORDERS.get(order_id.upper())
    if not order:
        return "Error: order not found."
    if order["status"] != "delivered":
        return "Not refundable yet: order has not been delivered."
    return f"Refundable up to {order['total']}. Over {REFUND_AUTO_LIMIT} needs human approval."


def issue_refund(order_id: str, amount: float) -> str:
    order = ORDERS.get(order_id.upper())
    if not order:
        return "Error: order not found."
    if amount > order["total"]:
        return "Error: refund is larger than the order total."
    if amount > REFUND_AUTO_LIMIT:
        if not human_approval(f"Refund {amount} for order {order_id}"):
            metrics["outcome"] = "denied"
            return "Refund NOT issued: human approver rejected it."
        audit("approval_granted", order=order_id, amount=amount)
    audit("refund_issued", order=order_id, amount=amount)
    return f"Refund of {amount} issued for order {order_id}."


FUNCTIONS = {
    "lookup_order": lookup_order,
    "check_refund_policy": check_refund_policy,
    "issue_refund": issue_refund,
}

TOOL_SPECS = {
    "lookup_order": {
        "name": "lookup_order",
        "description": "Get status, item and total for an order ID.",
        "input_schema": {"type": "object",
                         "properties": {"order_id": {"type": "string"}},
                         "required": ["order_id"]},
    },
    "check_refund_policy": {
        "name": "check_refund_policy",
        "description": "Check whether an order can be refunded.",
        "input_schema": {"type": "object",
                         "properties": {"order_id": {"type": "string"}},
                         "required": ["order_id"]},
    },
    "issue_refund": {
        "name": "issue_refund",
        "description": "Issue a refund. Large refunds trigger human approval.",
        "input_schema": {"type": "object",
                         "properties": {"order_id": {"type": "string"},
                                        "amount": {"type": "number"}},
                         "required": ["order_id", "amount"]},
    },
}

# Authorization: each role may only use its own tools (least privilege)
ROLE_TOOLS = {
    "triage": [],
    "resolver": ["lookup_order", "check_refund_policy", "issue_refund"],
}


def run_tool(role: str, name: str, args: dict) -> str:
    """Single choke point for every tool call: authorize -> run -> log."""
    metrics["tool_calls"] += 1
    if name not in ROLE_TOOLS[role]:
        audit("tool_blocked", role=role, tool=name)
        return "Error: this role is not allowed to use that tool."
    try:
        result = FUNCTIONS[name](**args)
    except Exception as e:  # failure path: tool crash must not crash the agent
        audit("tool_error", tool=name, error=str(e))
        return f"Error: tool failed ({e})."
    audit("tool_call", role=role, tool=name, args=args)
    return result


# --------------------------------------------------------------------------
# Model call with retry (resilience)
# --------------------------------------------------------------------------
def call_model(**kwargs):
    for attempt in range(3):
        try:
            resp = client.messages.create(model=MODEL, max_tokens=800, **kwargs)
            metrics["api_calls"] += 1
            metrics["input_tokens"] += resp.usage.input_tokens
            metrics["output_tokens"] += resp.usage.output_tokens
            return resp
        except anthropic.APIError as e:
            audit("api_error", attempt=attempt, error=str(e))
            time.sleep(2 ** attempt)
    raise RuntimeError("Model unavailable after 3 attempts")


def text_of(resp) -> str:
    return "".join(b.text for b in resp.content if b.type == "text")


# --------------------------------------------------------------------------
# Agent 1: Triage (no tools, only classifies)
# --------------------------------------------------------------------------
TRIAGE_PROMPT = (
    "You are a support triage agent. Classify the customer message. "
    'Reply with JSON only: {"category": "refund" | "order_status" | "other", '
    '"reason": "<short>"}'
)


def triage(message: str) -> str:
    resp = call_model(system=TRIAGE_PROMPT, messages=[{"role": "user", "content": message}])
    raw = re.sub(r"```(?:json)?", "", text_of(resp)).strip()
    try:
        category = json.loads(raw)["category"]
    except (ValueError, KeyError, TypeError):  # failure path: bad output -> human
        audit("triage_parse_failed", raw=raw[:200])
        return "other"
    audit("triage", category=category)
    return category


# --------------------------------------------------------------------------
# Agent 2: Resolver (tool loop with step limit)
# --------------------------------------------------------------------------
RESOLVER_PROMPT = (
    "You are a support resolver agent. Use the tools to solve the customer's "
    "request. Always look up the order and check policy before refunding. "
    "Never invent order data. Be brief and polite."
)


def resolve(message: str):
    tools = [TOOL_SPECS[t] for t in ROLE_TOOLS["resolver"]]
    messages = [{"role": "user", "content": message}]
    for step in range(MAX_STEPS):
        resp = call_model(system=RESOLVER_PROMPT, tools=tools, messages=messages)
        if resp.stop_reason != "tool_use":
            return text_of(resp)
        messages.append({"role": "assistant", "content": resp.content})
        results = []
        for block in resp.content:
            if block.type == "tool_use":
                print(f"  [step {step + 1}] {block.name}({block.input})")
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": run_tool("resolver", block.name, block.input)})
        messages.append({"role": "user", "content": results})
    audit("max_steps_reached")
    return None  # caller escalates


# --------------------------------------------------------------------------
# Orchestrator: the workflow that ties everything together
# --------------------------------------------------------------------------
def escalate(reason: str) -> str:
    metrics["outcome"] = "escalated"
    audit("escalated", reason=reason)
    return f"I've passed this to a human agent ({reason}). They will contact you soon."


def handle_request(user_text: str) -> str:
    global TRACE_ID, metrics
    TRACE_ID = uuid.uuid4().hex[:8]
    metrics = {"trace": TRACE_ID, "env": APP_ENV, "api_calls": 0, "tool_calls": 0,
               "input_tokens": 0, "output_tokens": 0, "outcome": "resolved"}
    start = time.time()

    safe_text = redact(user_text)                    # input guardrail
    audit("request_received", text=safe_text)

    try:
        category = triage(safe_text)
        if category not in ("refund", "order_status"):
            answer = escalate("request type not supported")
        else:
            answer = resolve(safe_text)
            if answer is None:
                answer = escalate("agent could not finish in time")
            else:
                answer = redact(answer)              # output guardrail
    except Exception as e:                           # last-resort failure path
        audit("fatal_error", error=str(e))
        answer = escalate("system error")

    metrics["latency_s"] = round(time.time() - start, 2)
    metrics["est_cost_usd"] = round(
        metrics["input_tokens"] / 1e6 * PRICE_IN + metrics["output_tokens"] / 1e6 * PRICE_OUT, 5)
    with open("metrics.jsonl", "a", encoding="utf-8") as f:   # monitoring feed
        f.write(json.dumps(metrics) + "\n")
    audit("request_finished", outcome=metrics["outcome"])
    return answer


def main():
    global client
    client = anthropic.Anthropic()
    message = " ".join(sys.argv[1:]) or "Refund order A100, the item arrived broken"
    print(f"Customer: {message}\n")
    answer = handle_request(message)
    print(f"\nAgent: {answer}")
    print(f"\nMetrics: {json.dumps(metrics)}")


if __name__ == "__main__":
    main()
