import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  IDLE: "bg-neutral-soft text-muted-foreground",
  PROCESSING: "bg-info-soft text-info",
  VALIDATING: "bg-info-soft text-info",
  AWAITING_APPROVAL: "bg-warning-soft text-warning",
  COMPLETED: "bg-success-soft text-success",
  FAILED: "bg-danger-soft text-danger",
  TODO: "bg-neutral-soft text-foreground",
  IN_PROGRESS: "bg-info-soft text-info",
  OVERDUE: "bg-danger-soft text-danger",
  HIGH: "bg-danger-soft text-danger",
  MEDIUM: "bg-warning-soft text-warning",
  LOW: "bg-neutral-soft text-muted-foreground",
  PENDING: "bg-warning-soft text-warning",
  APPROVED: "bg-success-soft text-success",
  REJECTED: "bg-neutral-soft text-muted-foreground line-through",
  UPCOMING: "bg-warning-soft text-warning",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const live = value === "PROCESSING" || value === "VALIDATING";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide",
        tone[value] ?? "bg-neutral-soft text-muted-foreground",
        className,
      )}
    >
      {live && <span className="pulse-dot size-1.5 rounded-full bg-current" />}
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function EmptyState({ title = "No data yet", hint }: { title?: string; hint?: string | undefined }) {
  return (
    <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow?: string | undefined; title: string; desc?: string | undefined; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
