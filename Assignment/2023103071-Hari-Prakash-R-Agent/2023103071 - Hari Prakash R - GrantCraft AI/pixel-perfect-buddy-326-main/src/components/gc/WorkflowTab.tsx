import { useState } from "react";
import { ArrowRight, Route as RouteIcon, Search, ShieldCheck, FileText, Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Panel, Pill, Code, PageHead } from "./shared";

const ROLES = [
  { name: "Supervisor Router", icon: RouteIcon, resp: "Routes state between agents, enforces step limits, triggers HITL & failure handlers.", model: "Rule-based + GPT-4o-mini" },
  { name: "Grant Scout", icon: Search, resp: "Semantic search across CSR portals & grant DB; ranks by similarity & eligibility fit.", model: "Claude 3.5 Sonnet" },
  { name: "Compliance & Eligibility", icon: ShieldCheck, resp: "Parses 80G/12A/501(c)(3)/FCRA docs; applies policy rules; redacts PII.", model: "Deterministic rules + LLM parser" },
  { name: "Proposal Architect", icon: FileText, resp: "Drafts grounded proposal from impact RAG; every claim cited and verified.", model: "Claude 3.5 Sonnet (temp 0.2)" },
  { name: "Financial Auditor", icon: Calculator, resp: "Recomputes budget in Python sandbox; enforces admin cap ≤ 10%.", model: "No LLM math — Python only" },
];
const STATES = ["IDLE", "DISCOVERING", "AUDITING", "DRAFTING", "VERIFYING_MATH", "HITL_REVIEW"];

const SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GrantCraftState",
  "type": "object",
  "required": ["run_id", "tenant_id", "state", "request"],
  "properties": {
    "run_id":    { "type": "string", "format": "uuid" },
    "tenant_id": { "type": "string" },
    "state":     { "enum": ["IDLE","DISCOVERING","AUDITING","DRAFTING","VERIFYING_MATH","HITL_REVIEW","COMPLETED","FAILED_SAFE"] },
    "request":   { "type": "object", "properties": { "title": {"type":"string"}, "amount_usd": {"type":"number"} } },
    "grant_matches": { "type": "array", "items": { "type": "object",
        "properties": { "grant_id": {"type":"string"}, "similarity": {"type":"number","minimum":0,"maximum":1} } } },
    "compliance": { "type": "object", "properties": {
        "tax_status": { "enum": ["VALID","MISSING","EXPIRED"] }, "pii_redacted": {"type":"integer"} } },
    "draft": { "type": "object", "properties": {
        "sections": {"type":"array"}, "groundedness": {"type":"number"}, "citations": {"type":"array"} } },
    "budget": { "type": "object", "properties": {
        "lines": {"type":"array"}, "admin_ratio": {"type":"number","maximum":0.10} } },
    "hitl": { "type": "object", "properties": {
        "decision": { "enum": ["APPROVED","REVISION","REJECTED"] }, "signer": {"type":"string"}, "sha256": {"type":"string"} } }
  }
}`;

const TOOLS = `Grant_Vector_Search(query: str, top_k: int=3, namespace: tenant_id) -> [{grant_id, similarity}]
CSR_Portal_API(filters: dict) -> [{grant_id, deadline, max_amount}]
NGO_Doc_Parser(files: [uri]) -> {tax_status, registration_ids(redacted)}
Policy_Rule_Engine(facts: dict) -> {pass: bool, violations: [str]}
Impact_RAG_Retriever(query: str, k: int=12) -> [chunk]
Citation_Verifier(draft: str, chunks: [chunk]) -> {groundedness: float}
Python_Sandbox_Calc(budget: json) -> {total, admin, ratio}
Cap_Rule_Checker(ratio: float, cap: 0.10) -> {pass, recalculated_budget?}`;

const FAILS = [
  { key: "match", title: "Low Grant Match (<70% similarity)", at: 1, mitigation: "Query expansion with synonyms & SDG tags → re-search; if still <70%, pause and prompt the human for refined eligibility criteria." },
  { key: "tax", title: "Missing Mandatory Tax Certificate", at: 2, mitigation: "Immediate compliance halt → FAILED_SAFE before any drafting LLM call. Zero drafting tokens spent; remediation checklist sent to NGO." },
  { key: "halluc", title: "RAG Hallucination (<0.85 groundedness)", at: 3, mitigation: "Self-correction retry loop (max 2) with strict citation mode, temperature=0.0; unsupported claims stripped." },
  { key: "budget", title: "Budget Cap Violation (admin >10%)", at: 4, mitigation: "Deterministic Python recalculation loop rebalances admin into program lines until ratio ≤ 10%." },
];

export function WorkflowTab() {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const active = FAILS.filter((f) => on[f.key]);
  const haltAt = on["tax"] ? 2 : -1;
  return (
    <div>
      <PageHead kicker="Deliverable 2" title="Agent Workflow & Orchestration Spec" desc="Who does what, how state moves, what's passed between agents, and how each failure is contained." />
      <div className="grid gap-3 md:grid-cols-5">
        {ROLES.map((r) => (
          <div key={r.name} className="glass p-4">
            <r.icon className="size-5 text-primary" />
            <div className="mt-2 font-semibold">{r.name}</div>
            <p className="mt-1 text-xs text-muted-foreground">{r.resp}</p>
            <Pill tone="accent" className="mt-3">{r.model}</Pill>
          </div>
        ))}
      </div>

      <Panel title="State Machine" className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          {STATES.map((s, i) => {
            const flagged = active.some((f) => f.at === i);
            const dead = haltAt >= 0 && i > haltAt;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={cn("rounded-lg border px-3 py-2 font-mono text-xs", flagged ? (s === "AUDITING" ? "glow-danger text-destructive" : "border-warning text-warning") : dead ? "opacity-30" : "border-primary/40 text-primary")}>
                  {s}{flagged && s !== "AUDITING" && " ↻"}
                </div>
                {i < STATES.length - 1 && <ArrowRight className="size-4 text-muted-foreground" />}
              </div>
            );
          })}
          <ArrowRight className="size-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <div className={cn("rounded-lg border px-3 py-1.5 font-mono text-xs text-success", haltAt >= 0 && "opacity-30")}>COMPLETED</div>
            <div className={cn("rounded-lg border px-3 py-1.5 font-mono text-xs text-destructive", haltAt >= 0 && "glow-danger")}>FAILED_SAFE</div>
          </div>
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Handoff State Schema"><Code>{SCHEMA}</Code></Panel>
        <Panel title="Tool Contracts"><Code>{TOOLS}</Code></Panel>
      </div>

      <Panel title="Failure Paths & Recovery Simulator" className="mt-5">
        <div className="grid gap-3 md:grid-cols-2">
          {FAILS.map((f) => (
            <div key={f.key} className={cn("rounded-lg border p-4 transition", on[f.key] && "glow-danger bg-destructive/5")}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className={cn("size-4", on[f.key] ? "text-destructive" : "text-muted-foreground")} />{f.title}</div>
                <Switch checked={!!on[f.key]} onCheckedChange={(v) => setOn((p) => ({ ...p, [f.key]: v }))} />
              </div>
              {on[f.key] ? (
                <div className="mt-3 flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /><span><b className="text-success">Mitigation:</b> <span className="text-muted-foreground">{f.mitigation}</span></span></div>
              ) : <div className="mt-3 text-xs text-muted-foreground">Toggle to inject this failure.</div>}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
