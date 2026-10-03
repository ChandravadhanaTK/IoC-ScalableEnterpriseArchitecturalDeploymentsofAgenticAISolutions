import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { EngineMode } from "@/lib/placepilot/types";
import { cn } from "@/lib/utils";

export function EngineBadge({ engine, className }: { engine: EngineMode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        engine === "real" ? "border-info/50 bg-info/10 text-info" : "border-warning/50 bg-warning/10 text-warning",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", engine === "real" ? "bg-info" : "bg-warning")} />
      {engine === "real" ? "Real AI Execution" : "Deterministic Demo Engine"}
    </span>
  );
}

export function DemoLabel() {
  return (
    <span className="rounded-sm border border-dashed border-muted-foreground/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      Demo metric
    </span>
  );
}

export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 border-b border-border pb-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{kicker}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-3xl text-muted-foreground">{children}</div>}
    </header>
  );
}

export function Panel({ title, right, children, className }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{title}</h2>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

const PILL: Record<string, string> = {
  pass: "bg-success/15 text-success border-success/40",
  Eligible: "bg-success/15 text-success border-success/40",
  COMPLETED: "bg-success/15 text-success border-success/40",
  fail: "bg-destructive/15 text-destructive border-destructive/40",
  Ineligible: "bg-destructive/15 text-destructive border-destructive/40",
  FAILED: "bg-destructive/15 text-destructive border-destructive/40",
  borderline: "bg-warning/15 text-warning border-warning/40",
  Borderline: "bg-warning/15 text-warning border-warning/40",
  FALLBACK: "bg-warning/15 text-warning border-warning/40",
  AWAITING_APPROVAL: "bg-primary/15 text-primary border-primary/40",
  PROCESSING: "bg-info/15 text-info border-info/40",
  VALIDATING: "bg-info/15 text-info border-info/40",
};
export function Pill({ v, label }: { v: string; label?: string }) {
  return (
    <span className={cn("inline-flex rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", PILL[v] ?? "border-border bg-muted text-muted-foreground")}>
      {label ?? (v === "unknown" ? "Not specified" : v)}
    </span>
  );
}

export function ArchTabs() {
  const tabs = [
    ["/architecture", "Architecture"],
    ["/architecture/agents", "Agent Workflow"],
    ["/architecture/deployment", "Deployment"],
    ["/architecture/security", "Security"],
    ["/monitoring", "Monitoring"],
    ["/monitoring/traces", "Traces"],
  ] as const;
  return (
    <nav className="mb-6 flex flex-wrap gap-1 font-mono text-xs">
      {tabs.map(([to, l]) => (
        <Link key={to} to={to} activeOptions={{ exact: true }} className="rounded-sm border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "!border-primary !text-primary bg-primary/10" }}>
          {l}
        </Link>
      ))}
    </nav>
  );
}

export const btn = "inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-sm border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent disabled:opacity-50";
export const input = "w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
