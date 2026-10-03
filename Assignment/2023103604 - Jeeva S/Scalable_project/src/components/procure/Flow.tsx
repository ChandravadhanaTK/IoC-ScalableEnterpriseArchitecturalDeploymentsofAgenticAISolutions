import { useState } from "react";
import { ChevronDown, CornerLeftUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageId, StageStatus } from "@/lib/procure/data";

export interface StageState { status: StageStatus; elapsedMs?: number; toolCalls?: string[]; output?: unknown; runs?: number }
export type Stages = Record<StageId, StageState>;

export const STAGE_META: { id: StageId; label: string; kind: "Rules" | "AI"; desc: string }[] = [
  { id: "guardrail", label: "Guardrail", kind: "Rules", desc: "Blocks prompt-injection attempts" },
  { id: "requirement", label: "Requirement", kind: "AI", desc: "Extracts category, qty, budget, specs" },
  { id: "policy", label: "Policy", kind: "Rules", desc: "Retrieves relevant policy snippets" },
  { id: "catalog", label: "Catalog", kind: "Rules", desc: "search_catalog tool ranks products" },
  { id: "budget", label: "Budget", kind: "Rules", desc: "Checks request & department budget" },
  { id: "recommendation", label: "Recommendation", kind: "AI", desc: "Picks top + alternative from catalog only" },
  { id: "validator", label: "Validator", kind: "AI", desc: "Scores grounding 0–10, loops if < 8" },
  { id: "routing", label: "Approval Routing", kind: "Rules", desc: "Frozen threshold config" },
];

export const emptyStages = (): Stages =>
  Object.fromEntries(STAGE_META.map((s) => [s.id, { status: "idle" as StageStatus }])) as Stages;

export function KindTag({ kind }: { kind: "Rules" | "AI" }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider", kind === "AI" ? "bg-ai text-ai-foreground" : "bg-rules text-rules-foreground")}>
      {kind === "AI" ? "AI" : "RULES"}
    </span>
  );
}

const statusDot: Record<StageStatus, string> = {
  idle: "bg-muted-foreground/30",
  running: "bg-primary animate-pulse-ring",
  done: "bg-success",
  error: "bg-destructive",
  skipped: "bg-muted-foreground/30",
  blocked: "bg-destructive",
};

export function FlowDiagram({ stages, attempt }: { stages: Stages; attempt: number }) {
  const g = stages.guardrail;
  const nodes = STAGE_META.filter((s) => s.id !== "guardrail");
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Agent flow</h2>
        <span className="eyebrow">live</span>
      </div>
      <div className={cn("mb-3 flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs", g.status === "blocked" ? "border-destructive text-destructive" : "text-muted-foreground")}>
        <ShieldCheck className="h-4 w-4" /> Guardrail: {g.status === "idle" ? "waiting" : g.status === "blocked" ? "BLOCKED" : g.status === "running" ? "scanning…" : "clean"}
        <span className="ml-auto"><KindTag kind="Rules" /></span>
      </div>
      <ol className="relative">
        {nodes.map((n, i) => {
          const st = stages[n.id];
          const active = st.status === "running";
          return (
            <li key={n.id} className="relative">
              <div className={cn("relative flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-all", active && "border-primary bg-accent shadow-md", st.status === "error" && "border-destructive")}>
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", statusDot[st.status])} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">{n.label} <KindTag kind={n.kind} /></div>
                  <p className="truncate text-xs text-muted-foreground">{n.desc}</p>
                </div>
                {st.elapsedMs != null && <span className="font-mono text-[11px] text-muted-foreground">{(st.elapsedMs / 1000).toFixed(1)}s</span>}
              </div>
              {n.id === "validator" && attempt > 1 && (
                <div className="absolute -right-2 -top-12 flex items-center gap-1 rounded-full bg-ai px-2 py-0.5 font-mono text-[10px] text-ai-foreground shadow">
                  <CornerLeftUp className="h-3 w-3" /> loop · attempt {attempt}/3
                </div>
              )}
              {i < nodes.length - 1 && <div className="ml-[17px] h-3 w-px bg-border" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AgentCards({ stages }: { stages: Stages }) {
  return (
    <div className="space-y-2">
      {STAGE_META.map((m) => <AgentCard key={m.id} meta={m} st={stages[m.id]} />)}
    </div>
  );
}

function AgentCard({ meta, st }: { meta: (typeof STAGE_META)[number]; st: StageState }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel overflow-hidden">
      <button className="flex w-full items-center gap-2 px-3 py-2 text-left" onClick={() => setOpen((o) => !o)}>
        <span className={cn("h-2 w-2 rounded-full", statusDot[st.status])} />
        <span className="text-sm font-medium">{meta.label}</span>
        <KindTag kind={meta.kind} />
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {st.status}{st.elapsedMs != null ? ` · ${(st.elapsedMs / 1000).toFixed(1)}s` : ""}{st.runs && st.runs > 1 ? ` · ×${st.runs}` : ""}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t bg-muted/50 px-3 py-2 text-xs">
          <p className="eyebrow mb-1">Tool calls</p>
          <p className="mb-2 font-mono">{st.toolCalls?.length ? st.toolCalls.join(", ") : meta.kind === "AI" ? "llm" : "—"}</p>
          <p className="eyebrow mb-1">Output</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{st.output !== undefined ? JSON.stringify(st.output, null, 2) : "—"}</pre>
        </div>
      )}
    </div>
  );
}
