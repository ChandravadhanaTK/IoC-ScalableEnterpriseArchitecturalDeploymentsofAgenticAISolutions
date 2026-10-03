import { BarChart3 } from "lucide-react";
import type { Progress, Task } from "@/types/task";

export function ProgressCard({ progress, tasks }: { progress: Progress; tasks: Task[] }) {
  const count = (p: string) => tasks.filter((t) => t.priority === p && !t.completed).length;
  const stats = [
    ["Total", progress.total],
    ["Completed", progress.completed],
    ["Pending", progress.pending],
  ] as const;
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-semibold">
        <BarChart3 className="h-4 w-4 text-primary" /> Overall Progress
      </h2>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-3xl font-bold">{progress.percent}%</span>
        <span className="text-xs text-muted-foreground">complete</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-muted p-2">
            <div className="text-lg font-semibold">{v}</div>
            <div className="text-[11px] text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      <h3 className="mt-5 text-sm font-semibold">Priority summary (pending)</h3>
      <div className="mt-2 space-y-1.5 text-sm">
        <Row label="High" n={count("High")} cls="bg-destructive" />
        <Row label="Medium" n={count("Medium")} cls="bg-warning" />
        <Row label="Low" n={count("Low")} cls="bg-success" />
      </div>
    </section>
  );
}

function Row({ label, n, cls }: { label: string; n: number; cls: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      <span className="flex-1">{label}</span>
      <span className="font-medium">{n}</span>
    </div>
  );
}
