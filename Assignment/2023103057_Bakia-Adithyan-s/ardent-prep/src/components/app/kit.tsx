import type { ReactNode } from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass p-5", className)}>{children}</div>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium">{children}</p>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, action, sub }: { eyebrow?: string; title: string; action?: ReactNode; sub?: string }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">{eyebrow}</p>}
        <h1 className="mt-1 max-w-[40ch] font-display text-3xl font-semibold leading-tight text-balance">{title}</h1>
        {sub && <p className="mt-1.5 max-w-[60ch] text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

export function Meter({ value, max = 10, tone = "primary" }: { value: number; max?: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", toneBg[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

type Tone = "primary" | "accent" | "success" | "warning" | "destructive" | "muted";
const toneBg: Record<Tone, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground/30",
};
const tonePill: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function Pill({ tone = "primary", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", tonePill[tone], className)}>{children}</span>;
}

export function scoreTone(score: number | null | undefined): Tone {
  if (score == null) return "muted";
  if (score >= 7.5) return "success";
  if (score >= 5) return "warning";
  return "destructive";
}

export const statusMeta: Record<string, { label: string; tone: Tone }> = {
  planning: { label: "Planning", tone: "muted" },
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  in_progress: { label: "In progress", tone: "accent" },
  completed: { label: "Completed", tone: "success" },
};

export function StatusPill({ status }: { status: string }) {
  const m = statusMeta[status] ?? { label: status, tone: "muted" as Tone };
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

export function EmptyState({ title = "No data yet", body, action }: { title?: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <Inbox className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="max-w-[40ch] text-xs text-muted-foreground">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-destructive/5 p-5 text-center">
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="size-4" /> {message}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function BulletList({ items, empty = "None noted", tone = "primary" }: { items: string[]; empty?: string; tone?: Tone }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-snug">
          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", toneBg[tone])} />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}
