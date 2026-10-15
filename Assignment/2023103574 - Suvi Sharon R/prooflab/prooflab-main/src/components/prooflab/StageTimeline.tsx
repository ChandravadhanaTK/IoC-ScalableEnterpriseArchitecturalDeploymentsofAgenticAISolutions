import { Check, Loader2, Minus, X } from "lucide-react";
import { STAGES, type StageId, type StageStatus } from "@/lib/agent/types";
import { cn } from "@/lib/utils";

const label: Record<StageStatus, string> = {
  pending: "Pending", running: "Running", completed: "Completed", skipped: "Skipped", error: "Failed",
};

export function StageTimeline({ status }: { status: Record<StageId, StageStatus> }) {
  return (
    <ol className="space-y-0">
      {STAGES.map((s, i) => {
        const st = status[s.id];
        return (
          <li key={s.id} className="relative flex gap-4 pb-5 last:pb-0">
            {i < STAGES.length - 1 && (
              <span className={cn("absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px", st === "completed" ? "bg-signal" : "bg-border")} />
            )}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-mono",
                st === "pending" && "border-border bg-card text-muted-foreground",
                st === "running" && "border-signal bg-accent text-accent-foreground",
                st === "completed" && "border-signal bg-signal text-signal-foreground",
                st === "skipped" && "border-border bg-muted text-muted-foreground",
                st === "error" && "border-destructive bg-destructive text-destructive-foreground",
              )}
            >
              {st === "running" ? <Loader2 className="size-3.5 animate-spin" /> : st === "completed" ? <Check className="size-3.5" /> : st === "skipped" ? <Minus className="size-3.5" /> : st === "error" ? <X className="size-3.5" /> : String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-1 items-baseline justify-between gap-2 pt-1">
              <span className={cn("text-sm", st === "pending" ? "text-muted-foreground" : "font-medium text-foreground")}>{s.title}</span>
              <span className={cn("label-mono", st === "running" && "text-signal", st === "error" && "text-destructive")}>{label[st]}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
