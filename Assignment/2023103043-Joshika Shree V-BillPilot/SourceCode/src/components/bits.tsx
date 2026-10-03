import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    processed: "bg-success/15 text-success", approved: "bg-success/15 text-success",
    needs_review: "bg-warning/25 text-accent-foreground", processing: "bg-muted text-muted-foreground",
    rejected: "bg-destructive/15 text-destructive", completed: "bg-success/15 text-success",
    awaiting_review: "bg-warning/25 text-accent-foreground", running: "bg-primary/10 text-primary",
    failed: "bg-destructive/15 text-destructive", active: "bg-success/15 text-success",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", map[status] ?? "bg-muted")}>{status.replace("_", " ")}</span>;
}

export function SeverityBadge({ s }: { s: string | null }) {
  if (!s) return null;
  const c = s === "HIGH" ? "bg-destructive/15 text-destructive" : s === "MEDIUM" ? "bg-warning/30 text-accent-foreground" : "bg-muted text-muted-foreground";
  return <span className={cn("rounded px-2 py-0.5 text-xs font-bold", c)}>{s}</span>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>{children}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
