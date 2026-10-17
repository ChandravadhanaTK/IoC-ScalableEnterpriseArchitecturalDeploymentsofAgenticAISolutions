import { useState } from "react";
import { Lock, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel, Pill, PageHead } from "./shared";

type Node = { name: string; inputs: string; outputs: string; security: string };
type Layer = { title: string; nodes: Node[] };
type Boundary = { title: string; controls: string[] };

const L1: Layer = { title: "Layer 1 · Client & Presentation", nodes: [
  { name: "React Portal", inputs: "User funding requests, document uploads", outputs: "HTTPS calls to API Gateway", security: "CSP headers, SRI, short-lived JWT in memory" },
  { name: "Role-Based Views", inputs: "JWT role claims", outputs: "Scoped UI per Writer / Auditor / Director", security: "Server-enforced RBAC; UI only reflects claims" },
  { name: "HITL Approval Console", inputs: "Paused workflow state", outputs: "Signed approve / revise / reject decision", security: "Step-up MFA, decision signed with SHA-256 into audit ledger" },
]};
const L2: Layer = { title: "Layer 2 · Security & Guardrail Gateway", nodes: [
  { name: "Prompt Injection Filter", inputs: "Raw user prompt + documents", outputs: "Sanitised prompt or block event", security: "Classifier + heuristic rules; blocks jailbreak patterns" },
  { name: "Presidio PII Redactor", inputs: "Sanitised text", outputs: "Text with [REDACTED_*] tokens", security: "Reversible vault-backed tokenisation; no PII reaches LLM" },
  { name: "Hallucination & Math Guardrail", inputs: "Agent outputs", outputs: "Verified output or retry signal", security: "Groundedness ≥ 0.85, deterministic math recheck" },
]};
const L3: Layer = { title: "Layer 3 · Stateful Multi-Agent Orchestration", nodes: [
  { name: "LangGraph Orchestrator", inputs: "Validated request", outputs: "State transitions across agents", security: "Typed state, max-step limits, checkpointing" },
  { name: "Redis Shared State Store", inputs: "Agent checkpoints", outputs: "Resumable workflow state", security: "TLS, ACLs per tenant key prefix, TTL" },
  { name: "Episodic Memory", inputs: "Past proposals & outcomes", outputs: "Context for future drafting", security: "Tenant-scoped, retention policies" },
  { name: "LiteLLM Model Router", inputs: "LLM requests", outputs: "Claude 3.5 Sonnet / GPT-4o → fallback Gemini 1.5 Pro", security: "Circuit breaker, per-tenant budgets, no-training data agreements" },
]};
const L4: Layer = { title: "Layer 4 · Knowledge, Tooling & Data", nodes: [
  { name: "Pinecone Vector DB", inputs: "Embeddings + tenant_id", outputs: "Top-k grant & impact chunks", security: "Namespace per tenant, metadata filter enforced" },
  { name: "PostgreSQL Compliance DB", inputs: "NGO certificates, policies", outputs: "Eligibility facts", security: "Row-Level Security by tenant_id, encrypted at rest" },
  { name: "Python Math Sandbox", inputs: "Budget JSON", outputs: "Deterministic totals & ratios", security: "gVisor isolation, no network, CPU/time limits" },
  { name: "External CSR Portal APIs", inputs: "Search criteria", outputs: "Live grant listings", security: "Egress allow-list, signed requests, response schema validation" },
]};
const B: Boundary[] = [
  { title: "Trust Boundary 1 · Public Edge → API Gateway", controls: ["TLS 1.3", "OAuth2 / JWT", "WAF", "Rate Limiting"] },
  { title: "Trust Boundary 2 · Gateway → Agent Runtime", controls: ["Zero-Trust Service Mesh", "mTLS", "SPIFFE identities"] },
  { title: "Trust Boundary 3 · Orchestrator → Tools & Tenant Data", controls: ["Sandboxed Tool Execution", "Row-Level Security", "Egress allow-list"] },
];

export function ArchitectureTab() {
  const [sel, setSel] = useState<Node | null>(L3.nodes[0]!);
  const LayerRow = ({ l, tone }: { l: Layer; tone: string }) => (
    <div className={cn("rounded-xl border p-4", tone)}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Layers className="size-4" />{l.title}</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {l.nodes.map((n) => (
          <button key={n.name} onClick={() => setSel(n)} className={cn("rounded-lg border bg-background/60 p-3 text-left text-sm font-medium transition hover:-translate-y-0.5", sel?.name === n.name && "glow-primary")}>{n.name}</button>
        ))}
      </div>
    </div>
  );
  const Bound = ({ b }: { b: Boundary }) => (
    <div className="my-2 flex flex-wrap items-center gap-2 rounded-lg border-2 border-dashed border-destructive/50 px-4 py-2">
      <Lock className="size-4 text-destructive" /><span className="text-xs font-semibold text-destructive">{b.title}</span>
      {b.controls.map((c) => <Pill key={c} tone="danger">{c}</Pill>)}
    </div>
  );
  return (
    <div>
      <PageHead kicker="Deliverable 1" title="Enterprise Architecture Blueprint" desc="Four horizontal layers separated by explicit trust boundaries. Click any component to inspect it." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid-bg rounded-xl p-2">
          <LayerRow l={L1} tone="bg-info/5" /><Bound b={B[0]!} />
          <LayerRow l={L2} tone="bg-warning/5" /><Bound b={B[1]!} />
          <LayerRow l={L3} tone="bg-accent/10" /><Bound b={B[2]!} />
          <LayerRow l={L4} tone="bg-primary/5" />
        </div>
        <Panel title="Inspect Component" className="h-fit lg:sticky lg:top-4" right={sel && <button onClick={() => setSel(null)}><X className="size-4" /></button>}>
          {sel ? (
            <div className="space-y-4 text-sm">
              <div className="font-display text-lg font-bold text-primary">{sel.name}</div>
              <div><div className="text-xs uppercase text-muted-foreground">Inputs</div><div>{sel.inputs}</div></div>
              <div><div className="text-xs uppercase text-muted-foreground">Outputs</div><div>{sel.outputs}</div></div>
              <div><div className="text-xs uppercase text-muted-foreground">Security controls</div><div className="text-success">{sel.security}</div></div>
            </div>
          ) : <p className="text-sm text-muted-foreground">Select a node.</p>}
        </Panel>
      </div>
    </div>
  );
}
