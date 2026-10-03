import { AlertTriangle, CheckCircle2, ChevronRight, FileText, Siren, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { inr, type AnalysisResult } from "@/lib/procure/data";

export function EscalateBadge({ result }: { result: AnalysisResult }) {
  if (!result.escalate) return null;
  return (
    <span title={result.escalateReasons.join(", ")} className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
      <Siren className="h-3.5 w-3.5" /> Escalate to human review
    </span>
  );
}

export function ApprovalChain({ chain, done = 0 }: { chain: string[]; done?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chain.map((c, i) => (
        <span key={c} className="flex items-center gap-1.5">
          <span className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", i < done ? "border-success bg-success text-success-foreground" : "bg-card")}>{c}</span>
          {i < chain.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </span>
      ))}
    </div>
  );
}

export function BudgetBar({ result }: { result: AnalysisResult }) {
  const { total, budget } = result;
  const avail = budget.deptAvailable;
  const pct = avail > 0 ? Math.min(100, (total / avail) * 100) : 100;
  const over = total > avail;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span>{inr(total)} of {inr(avail)} available ({result.department})</span><span className="font-mono">{pct.toFixed(1)}%</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", over ? "bg-destructive" : pct > 60 ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Request budget: {budget.requestBudget ? inr(budget.requestBudget) : "not stated"} · Status: <span className="font-mono font-medium text-foreground">{budget.status}</span>
      </p>
    </div>
  );
}

export function PolicyEvidence({ result }: { result: AnalysisResult }) {
  return (
    <ul className="space-y-1.5">
      {result.policy.snippets.map((s, i) => (
        <li key={i} className="flex gap-2 text-xs">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          <span>{s.text} <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-secondary px-1 font-mono text-[10px] text-muted-foreground"><FileText className="h-2.5 w-2.5" />{s.source}</span></span>
        </li>
      ))}
      {result.policy.snippets.length === 0 && <li className="text-xs text-muted-foreground">No matching policy snippets.</li>}
    </ul>
  );
}

export function RiskFlags({ result }: { result: AnalysisResult }) {
  const flags = [...result.recommendation.risk_flags, ...result.budget.notes];
  if (flags.length === 0) return <p className="text-xs text-muted-foreground">No risk flags.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...new Set(flags)].map((f) => (
        <span key={f} className="inline-flex items-center gap-1 rounded-md bg-warning px-2 py-0.5 text-xs text-warning-foreground"><AlertTriangle className="h-3 w-3" />{f}</span>
      ))}
    </div>
  );
}

export function ValidatorHistory({ result }: { result: AnalysisResult }) {
  return (
    <div className="flex flex-wrap gap-2">
      {result.validatorHistory.map((v) => (
        <div key={v.attempt} title={v.feedback} className={cn("rounded-md border px-2.5 py-1.5 text-xs", v.score >= 8 ? "border-success" : "border-warning")}>
          <span className="eyebrow">Attempt {v.attempt}</span>
          <div className="font-display text-lg font-bold">{v.score}<span className="text-xs text-muted-foreground">/10</span></div>
        </div>
      ))}
    </div>
  );
}

function PickCard({ label, pick, qty, primary }: { label: string; pick: NonNullable<AnalysisResult["recommendation"]["alternative"]>; qty: number; primary?: boolean }) {
  const p = pick.product;
  return (
    <div className={cn("rounded-lg border p-3", primary && "border-primary bg-accent")}>
      <p className="eyebrow mb-1">{label}</p>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-xs text-muted-foreground">{p.vendor}{p.preferred_vendor ? " · preferred" : ""} · <Star className="inline h-3 w-3" /> {p.rating}</p>
        </div>
        <div className="text-right">
          <div className="font-display font-bold">{inr(p.price)}</div>
          {qty > 1 && <div className="text-xs text-muted-foreground">× {qty} = {inr(p.price * qty)}</div>}
        </div>
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{p.specs.join(" · ")} · {p.warranty} · {p.delivery_days}d</p>
      <p className="mt-2 text-sm">{pick.reason}</p>
    </div>
  );
}

export function ResultSummary({ result, approvalsDone = 0 }: { result: AnalysisResult; approvalsDone?: number }) {
  const r = result.recommendation;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="panel space-y-3 p-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Recommendation</h2>
          <EscalateBadge result={result} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <PickCard label="Top pick" pick={r.top} qty={result.requirement.quantity} primary />
          {r.alternative ? <PickCard label="Alternative" pick={r.alternative} qty={result.requirement.quantity} /> : <div className="grid place-items-center rounded-lg border border-dashed p-3 text-xs text-muted-foreground">No alternative in catalog</div>}
        </div>
        {r.reasons.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-sm">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
        {result.escalate && <p className="text-xs text-destructive">Escalation reasons: {result.escalateReasons.join(" · ")}</p>}
        <div><p className="eyebrow mb-1.5">Budget impact</p><BudgetBar result={result} /></div>
      </div>
      <div className="space-y-4">
        <div className="panel p-4"><p className="eyebrow mb-2">Approval chain · {inr(result.total)}</p><ApprovalChain chain={result.approvalChain} done={approvalsDone} /></div>
        <div className="panel p-4"><p className="eyebrow mb-2">Validator score history</p><ValidatorHistory result={result} /></div>
        <div className="panel p-4"><p className="eyebrow mb-2">Risk flags</p><RiskFlags result={result} /></div>
      </div>
      <div className="panel p-4 lg:col-span-3">
        <p className="eyebrow mb-2">Policy evidence · {result.policy.sources.join(", ")}</p>
        <PolicyEvidence result={result} />
      </div>
    </div>
  );
}
