import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { TriageResult } from "@/types/domain";
import { Meter, PriorityBadge } from "@/components/common";

export function AnalysisCard({ a }: { a: TriageResult }) {
  const pct = Math.round(a.confidence * 100);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Category" value={a.category} />
        <Field label="Priority" value={<PriorityBadge p={a.priority} />} />
        <Field label="Department" value={a.department} />
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-xs text-muted-foreground">Confidence</p>
          <p className="text-lg font-bold">{pct}%</p>
          <Meter value={pct} tone={pct >= 80 ? "success" : pct >= 70 ? "warning" : "critical"} />
        </div>
      </div>
      <div className={a.requiresApproval ? "flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-3" : "flex gap-3 rounded-xl border border-success/40 bg-success/10 p-3"}>
        {a.requiresApproval ? <ShieldAlert className="size-5 shrink-0 text-warning-foreground" /> : <ShieldCheck className="size-5 shrink-0 text-success" />}
        <div className="text-sm">
          <p className="font-semibold">{a.requiresApproval ? "Human approval required" : "Auto-routing permitted"}</p>
          <p className="text-muted-foreground">{a.requiresApproval ? "High-risk policy: Critical priority, Security category or confidence below 70% needs a Department Manager." : "Low-risk incident within guardrail thresholds."}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reasoning</p>
        <p className="mt-1 text-sm">{a.reasoning}</p>
        {a.signals.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{a.signals.map((s) => <span key={s} className="rounded-md bg-accent px-2 py-0.5 font-mono text-[11px] text-accent-foreground">{s}</span>)}</div>}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended actions</p>
        <ol className="mt-2 space-y-2">{a.actions.map((x, i) => <li key={x} className="flex gap-2 text-sm"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>{x}</li>)}</ol>
      </div>
      <p className="text-xs text-muted-foreground">Model {a.model} · {a.latencyMs} ms</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><div className="mt-1 font-semibold">{value}</div></div>;
}
