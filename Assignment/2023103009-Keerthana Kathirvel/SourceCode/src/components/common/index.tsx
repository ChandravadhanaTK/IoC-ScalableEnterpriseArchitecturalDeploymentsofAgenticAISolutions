import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Priority, Status } from "@/types/domain";
import { useAuth, type Permission } from "@/lib/auth";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, action, children, className }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}>
      {title && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }: { label: string; value: ReactNode; hint?: string; icon: LucideIcon; tone?: "primary" | "success" | "warning" | "critical" | "info" }) {
  const tones = { primary: "bg-primary/10 text-primary", success: "bg-success/12 text-success", warning: "bg-warning/18 text-warning-foreground", critical: "bg-critical/10 text-critical", info: "bg-info/12 text-info" };
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={cn("grid size-9 place-items-center rounded-xl", tones[tone])}><Icon className="size-4" /></span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-info/12 text-info",
  High: "bg-warning/20 text-warning-foreground",
  Critical: "bg-critical/12 text-critical",
};
export function PriorityBadge({ p }: { p: Priority }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", PRIORITY_STYLE[p])}>{p === "Critical" && <span className="size-1.5 rounded-full bg-critical animate-pulse-dot" />}{p}</span>;
}

const STATUS_STYLE: Record<Status, string> = {
  New: "bg-primary/10 text-primary",
  "Under Review": "bg-warning/20 text-warning-foreground",
  Assigned: "bg-info/12 text-info",
  "In Progress": "bg-accent text-accent-foreground",
  Resolved: "bg-success/12 text-success",
  Closed: "bg-muted text-muted-foreground",
};
export function StatusBadge({ s }: { s: Status }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[s])}><span className="size-1.5 rounded-full bg-current" />{s}</span>;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: { title: string; description?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Icon className="size-5" /></span>
      <p className="mt-3 font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="mt-2 font-semibold">Something went wrong</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export function LoadingGrid({ count = 4 }: { count?: number }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;
}

export function RequirePermission({ perm, children }: { perm: Permission; children: ReactNode }) {
  const { can, user } = useAuth();
  if (can(perm)) return <>{children}</>;
  return <EmptyState icon={Lock} title="Access restricted" description={`Your role (${user.role}) is not authorized to view this area. Authorization check: "${perm}". Switch role in the header to explore.`} />;
}

export function Meter({ value, tone = "primary" }: { value: number; tone?: "primary" | "success" | "warning" | "critical" }) {
  const c = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", critical: "bg-critical" }[tone];
  return <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", c)} style={{ width: `${Math.min(100, value)}%` }} /></div>;
}
