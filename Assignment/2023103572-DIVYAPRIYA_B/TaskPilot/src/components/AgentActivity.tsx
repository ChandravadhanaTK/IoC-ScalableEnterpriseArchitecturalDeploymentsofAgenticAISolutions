import { Activity, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { ActivityEntry } from "@/types/task";

const pipeline = ["Analyzing Goal", "Creating Tasks", "Prioritizing", "Scheduling", "Saving Plan"];

export function AgentActivity({ entries, busy }: { entries: ActivityEntry[]; busy: boolean }) {
  const doneSteps = Math.max(0, entries.filter((e) => e.status === "done").length - 1);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-semibold">
        <Activity className="h-4 w-4 text-primary" /> Agent Activity
      </h2>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {pipeline.map((p, i) => (
          <span
            key={p}
            className={`rounded-md px-2 py-1 text-[11px] font-medium ${
              i < doneSteps ? "bg-success/15 text-success" : busy && i === doneSteps ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {p}
          </span>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {entries.length === 0 && <li className="text-sm text-muted-foreground">Idle — waiting for a goal.</li>}
        {entries.map((e) => (
          <li key={e.id} className="flex animate-in fade-in slide-in-from-left-1 items-start gap-2 text-sm">
            {e.status === "done" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
            {e.status === "running" && <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />}
            {e.status === "error" && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
            <span className="flex-1">{e.message}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{e.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
