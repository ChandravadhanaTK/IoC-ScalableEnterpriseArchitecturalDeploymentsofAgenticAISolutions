import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Priority, Status } from "@/lib/data";

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, action, children, className }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, delta, icon, tone = "primary" }: { label: string; value: string; delta?: string; icon: ReactNode; tone?: "primary" | "teal" | "warning" | "destructive" | "success" }) {
  const tones = {
    primary: "bg-primary/10 text-primary", teal: "bg-teal/12 text-teal", warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive", success: "bg-success/12 text-success",
  };
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg [&_svg]:size-4", tones[tone])}>{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
    </div>
  );
}

const statusTone: Record<Status, string> = {
  New: "bg-info/12 text-info border-info/25",
  "AI Analyzing": "bg-teal/12 text-teal border-teal/30",
  "Awaiting Approval": "bg-warning/15 text-warning border-warning/30",
  Assigned: "bg-primary/10 text-primary border-primary/25",
  "In Progress": "bg-chart-3/10 text-chart-3 border-chart-3/25",
  Escalated: "bg-destructive/10 text-destructive border-destructive/30",
  Resolved: "bg-success/12 text-success border-success/30",
  Closed: "bg-muted text-muted-foreground border-border",
};
export function StatusBadge({ status }: { status: Status }) {
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone[status])}><span className="size-1.5 rounded-full bg-current" />{status}</span>;
}

const prioTone: Record<Priority, string> = {
  Critical: "bg-destructive text-destructive-foreground", High: "bg-warning/20 text-warning",
  Medium: "bg-primary/10 text-primary", Low: "bg-muted text-muted-foreground",
};
export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold", prioTone[priority])}>{priority}</span>;
}

export function Meter({ value, tone = "primary" }: { value: number; tone?: "primary" | "teal" | "warning" | "destructive" }) {
  const c = { primary: "bg-primary", teal: "bg-teal", warning: "bg-warning", destructive: "bg-destructive" }[tone];
  return <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", c)} style={{ width: `${value}%` }} /></div>;
}

export const chartTooltip = {
  contentStyle: { borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12, boxShadow: "var(--shadow-card)" },
};
