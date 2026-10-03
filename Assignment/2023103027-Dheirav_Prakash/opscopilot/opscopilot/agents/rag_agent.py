"""Stage A: agentic RAG with typed tools, citations and a reflection loop.

Graph:
    retrieve -> plan_tools -> (run_tools)* -> generate -> evaluate -> [revise | END]

retrieve    access-aware hybrid search over the policy corpus
plan_tools  the model proposes typed tool calls; the tool layer validates,
            authorises and executes them, then feeds observations back
generate    draft answer with citations
evaluate    groundedness check; unsupported claims trigger a bounded revision

The iteration and tool-call budgets are the loop guard from Module 2.
"""
from __future__ import annotations

import json
import re
from typing import Any, Literal, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from ..config import settings
from ..identity import Identity
from ..knowledge.retrieval import retrieve
from ..llm import chat_model, structured
from ..telemetry import GROUNDED, LOOP_GUARD, REVISIONS, get_logger, log, record_usage, span
from ..tools.shipments import READ_TOOLS, TOOLS_BY_NAME, run_tool_call
from . import prompts

logger = get_logger("rag_agent")


class RagState(TypedDict, total=False):
    question: str
    identity: Identity
    evidence: list[dict[str, Any]]      # serialised chunks
    tool_results: list[dict[str, Any]]
    tool_calls_made: int
    plan_passes: int
    last_pass_added: int
    draft: str
    evaluation: dict[str, Any]
    iterations: int
    answer: str
    citations: list[str]
    stopped_by: str


class Evaluation(BaseModel):
    grounded: bool = Field(description="True only if every claim is supported and cited")
    unsupported_claims: list[str] = Field(default_factory=list, description="Claims not supported by evidence or tool results")
    missing_citations: list[str] = Field(default_factory=list, description="Policy claims with no citation")
    notes: str = Field(default="", description="One or two sentences for the writer")


def _evidence_block(state: RagState) -> str:
    chunks = state.get("evidence", [])
    ev = "\n\n".join(f"[{c['citation']}] {c['title']}, section {c['section']}\n{c['body']}" for c in chunks) or "(no evidence retrieved)"
    tools = "\n\n".join(f"TOOL RESULT [tool:{t['tool']}] args={json.dumps(t.get('args', {}))}\n{t['observation']}" for t in state.get("tool_results", []) if t.get("ok")) or "(no tool results)"
    allowed = [f"[{c['citation']}]" for c in chunks] + [f"[tool:{t['tool']}]" for t in state.get("tool_results", []) if t.get("ok")]
    return (f"EVIDENCE:\n{ev}\n\nTOOL RESULTS:\n{tools}\n\nALLOWED CITATIONS (use these exact strings and no others): "
            + (", ".join(allowed) or "(none)"))


def _parse_text_tool_calls(reply: AIMessage) -> list[dict[str, Any]]:
    """Small local models often write the call as a JSON object in the text
    body instead of a native tool call. Accept that shape too. Arguments still
    go through schema validation and the policy gate, so nothing is trusted here."""
    text = reply.content if isinstance(reply.content, str) else ""
    text = text.strip()
    if not text.startswith("{"):
        return []
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        return []
    if isinstance(obj, dict) and "name" in obj:
        return [{"name": obj["name"], "args": obj.get("arguments") or obj.get("args") or {}}]
    return []


def _arg_key(tool_name: str, args: dict[str, Any]) -> str:
    """Canonical key for a tool call: validated args when the schema accepts them."""
    tool_obj = TOOLS_BY_NAME.get(tool_name)
    if tool_obj is not None:
        try:
            args = tool_obj.args_schema.model_validate(args or {}).model_dump()
        except Exception:  # noqa: BLE001 - invalid args keep their raw form
            pass
    return json.dumps(args or {}, sort_keys=True)


# ---- nodes ---------------------------------------------------------------

def retrieve_node(state: RagState) -> dict:
    with span("retrieve", logger):
        chunks = retrieve(state["question"], state["identity"])
    return {"evidence": [
        {"citation": c.citation, "title": c.title, "section": c.section, "access": c.access,
         "body": c.text.split("\n", 1)[1] if "\n" in c.text else c.text}
        for c in chunks
    ], "tool_results": [], "tool_calls_made": 0, "plan_passes": 0, "last_pass_added": 0, "iterations": 0}


def plan_tools_node(state: RagState) -> dict:
    """Let the model propose tool calls, then run them through the gate."""
    llm = chat_model(temperature=0).bind_tools(READ_TOOLS)
    prior = "\n".join(f"- {t['tool']}({json.dumps(t.get('args', {}))})" for t in state.get("tool_results", [])) or "(none yet)"
    messages = [
        SystemMessage(content=prompts.TOOL_PLANNER_SYSTEM),
        HumanMessage(content=f"Question: {state['question']}\n\nTool calls already made:\n{prior}\n\nIf live data is needed and not already fetched, call the right tool. Otherwise reply with the single word DONE."),
    ]
    with span("plan_tools", logger):
        reply: AIMessage = llm.invoke(messages)
    record_usage(reply, step="plan_tools")
    calls = list(getattr(reply, "tool_calls", []) or []) or _parse_text_tool_calls(reply)
    results = list(state.get("tool_results", []))
    made = state.get("tool_calls_made", 0)
    # Dedup on the normalised (validated) arguments so `{}` and `{"lane": null}`
    # are the same call. Failed calls are keyed on their raw args.
    seen = {(t["tool"], _arg_key(t["tool"], t.get("args", {}))) for t in results}
    added = 0
    passes = state.get("plan_passes", 0) + 1
    for call in calls:
        if made >= settings.max_tool_calls:
            LOOP_GUARD.inc()
            log(logger, "tool budget exhausted", budget=settings.max_tool_calls)
            return {"tool_results": results, "tool_calls_made": made, "plan_passes": passes, "last_pass_added": added, "stopped_by": "tool_budget"}
        key = (call["name"], _arg_key(call["name"], call.get("args", {})))
        if key in seen:
            continue
        results.append(run_tool_call(call, state["identity"]))
        seen.add(key)
        made += 1
        added += 1
    return {"tool_results": results, "tool_calls_made": made, "plan_passes": passes, "last_pass_added": added}


def route_after_plan(state: RagState) -> Literal["plan_tools", "generate"]:
    """Plan again only if the last pass produced a new call, there is budget
    left, and we have not already planned twice. Two passes is enough to
    fetch a list and then drill into one item; more is usually a loop."""
    if state.get("stopped_by"):
        return "generate"
    if (state.get("last_pass_added", 0) > 0
            and state.get("plan_passes", 0) < 2
            and state.get("tool_calls_made", 0) < settings.max_tool_calls):
        return "plan_tools"
    return "generate"


def generate_node(state: RagState) -> dict:
    llm = chat_model()
    feedback = ""
    ev = state.get("evaluation")
    if ev and not ev.get("grounded", True):
        feedback = ("\n\nEVALUATOR NOTES on your previous draft. Fix these precisely:\n"
                    f"- unsupported claims: {ev.get('unsupported_claims')}\n"
                    f"- missing citations: {ev.get('missing_citations')}\n- {ev.get('notes')}\n\nPREVIOUS DRAFT:\n{state.get('draft','')}")
    messages = [
        SystemMessage(content=prompts.RAG_ANSWER_SYSTEM),
        HumanMessage(content=f"{_evidence_block(state)}\n\nQUESTION: {state['question']}{feedback}"),
    ]
    with span("generate", logger):
        reply = llm.invoke(messages)
    record_usage(reply, step="generate")
    text = reply.content if isinstance(reply.content, str) else str(reply.content)
    return {"draft": text.strip(), "iterations": state.get("iterations", 0) + 1}


def evaluate_node(state: RagState) -> dict:
    messages = [
        SystemMessage(content=prompts.EVALUATOR_SYSTEM),
        HumanMessage(content=f"{_evidence_block(state)}\n\nDRAFT:\n{state['draft']}"),
    ]
    with span("evaluate", logger):
        try:
            ev = structured(Evaluation, messages, step="evaluate")
        except (ValueError, TypeError) as e:
            # The evaluator could not produce a verdict. Do not pretend the
            # draft is grounded: let it through with an explicit "unverified"
            # verdict that the dashboard counts separately, and no revision.
            log(logger, "evaluator failed", error=str(e))
            GROUNDED.labels(verdict="unverified").inc()
            return {"evaluation": {"grounded": False, "unsupported_claims": [], "missing_citations": [],
                                   "notes": f"evaluator unavailable: {e}", "verified": False}}
    verdict = _deterministic_checks(state, ev)
    GROUNDED.labels(verdict="grounded" if verdict["grounded"] else "unsupported").inc()
    return {"evaluation": verdict}


BRACKET_RE = re.compile(r"\[([^\[\]]+)\]")
CITE_ID_RE = re.compile(r"^(?:[A-Z]{3}-[A-Z]{3}-\d{3} §\d+(?:\.\d+)?|tool:[a-z_]+)$")


def find_citations(text: str) -> list[str]:
    """Citation ids in a draft. Accepts several ids in one bracket, separated
    by commas or semicolons, because the writer often groups them."""
    out: list[str] = []
    for group in BRACKET_RE.findall(text):
        for part in re.split(r"[;,]", group):
            part = part.strip()
            if CITE_ID_RE.match(part):
                out.append(part)
    return out
NUM_RE = re.compile(r"(?<![\w§-])\d{2,}(?:,\d{3})*(?![\w-])")   # whole numbers of 2+ digits, not ids or section marks


def _is_numeric_claim(claim: str) -> bool:
    """A claim whose substance is a figure: a threshold, a percentage, an amount."""
    return bool(re.search(r"\b(INR|percent|%|hours?|days?|threshold|above|below|exceeds|limit|maximum|minimum)\b", claim, re.I))


def _deterministic_checks(state: RagState, ev: Evaluation) -> dict[str, Any]:
    """Two checks a 7B evaluator gets wrong in both directions, done in code.

    1. A citation that does not exist in the retrieved evidence is always a
       problem, whatever the model said (it invents section numbers).
    2. A claim the model flagged as unsupported, whose every number appears
       verbatim in the evidence or tool results, is treated as supported (the
       model misreads tables and flags correct thresholds)."""
    allowed = {c["citation"] for c in state.get("evidence", [])} | {f"tool:{t['tool']}" for t in state.get("tool_results", []) if t.get("ok")}
    draft = state.get("draft", "")
    invalid = sorted(set(find_citations(draft)) - allowed)
    corpus = _evidence_block(state)
    corpus_nums = set(NUM_RE.findall(corpus))
    kept = []
    for claim in ev.unsupported_claims:
        nums = NUM_RE.findall(claim)
        # Only a claim that is *about* numbers (a threshold, a value, a
        # percentage) and whose numbers all occur as whole tokens in the
        # evidence is rescued from the model's verdict.
        if nums and all(n in corpus_nums for n in nums) and len(nums) >= 1 and _is_numeric_claim(claim):
            continue
        kept.append(claim)
    kept += [f"citation [{c}] does not exist in the evidence; cite only ids listed in EVIDENCE or TOOL RESULTS" for c in invalid]
    # 3. Shipment facts must be attributed to the tool that produced them.
    used_tools = [t["tool"] for t in state.get("tool_results", []) if t.get("ok")]
    if used_tools and "tool:" not in draft and re.search(r"SHP-\d{4}", draft):
        kept.append(f"shipment facts are not attributed; mark them with [tool:{used_tools[0]}]")
    # `grounded` tracks unsupported claims only; missing citations on hedges
    # are recorded as a warning and do not trigger a revision (see routing).
    return {"grounded": not kept, "unsupported_claims": kept,
            "missing_citations": ev.missing_citations, "notes": ev.notes, "invalid_citations": invalid, "verified": True}


def route_after_evaluate(state: RagState) -> Literal["generate", "finalize"]:
    """Revise only for unsupported claims. A missing citation on an otherwise
    supported sentence is recorded in the evaluation but is not worth another
    model round trip; small evaluators flag hedges and recommendations as
    uncited far too often."""
    ev = state.get("evaluation", {})
    if ev.get("grounded", True) or not ev.get("unsupported_claims"):
        return "finalize"
    if state.get("iterations", 0) >= settings.max_iterations:
        LOOP_GUARD.inc()
        log(logger, "iteration budget exhausted", iterations=state["iterations"])
        return "finalize"
    return "generate"


def finalize_node(state: RagState) -> dict:
    draft = state.get("draft", "")
    cites = sorted(set(find_citations(draft)))
    REVISIONS.observe(max(0, state.get("iterations", 1) - 1))
    ev = state.get("evaluation", {})
    if not ev.get("verified", True):
        stopped = "unverified"
    else:
        stopped = state.get("stopped_by") or ("iteration_budget" if ev.get("unsupported_claims") else "grounded")
    return {"answer": draft, "citations": cites, "stopped_by": stopped}


def build_rag_graph():
    g = StateGraph(RagState)
    g.add_node("retrieve", retrieve_node)
    g.add_node("plan_tools", plan_tools_node)
    g.add_node("generate", generate_node)
    g.add_node("evaluate", evaluate_node)
    g.add_node("finalize", finalize_node)
    g.set_entry_point("retrieve")
    g.add_edge("retrieve", "plan_tools")
    g.add_conditional_edges("plan_tools", route_after_plan, {"plan_tools": "plan_tools", "generate": "generate"})
    g.add_edge("generate", "evaluate")
    g.add_conditional_edges("evaluate", route_after_evaluate, {"generate": "generate", "finalize": "finalize"})
    g.add_edge("finalize", END)
    return g.compile()


def ask(question: str, identity: Identity) -> RagState:
    graph = build_rag_graph()
    with span("rag.total", logger):
        return graph.invoke({"question": question, "identity": identity}, config={"recursion_limit": 20})
