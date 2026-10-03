import { Check, Loader2 } from "lucide-react";
import { WORKFLOW_STEPS } from "@/agent/triageAgent";
import { cn } from "@/lib/utils";

/** active: index of current step; skipApproval greys out the approval step. */
export function AgentWorkflow({ active, skipApproval }: { active: number; skipApproval?: boolean }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {WORKFLOW_STEPS.map((s, i) => {
        const skipped = skipApproval && s === "Human Approval";
        const done = i < active;
        const current = i === active;
        return (
          <li key={s} className="flex items-center">
            <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              skipped ? "border-dashed text-muted-foreground opacity-60" :
              done ? "border-success/40 bg-success/10 text-success" :
              current ? "border-primary bg-primary text-primary-foreground shadow-elevated" : "bg-card text-muted-foreground")}>
              {done && !skipped ? <Check className="size-3.5" /> : current ? <Loader2 className="size-3.5 animate-spin" /> : <span className="size-3.5 text-center leading-none">{i + 1}</span>}
              {s}{skipped && " (not needed)"}
            </div>
            {i < WORKFLOW_STEPS.length - 1 && <span className={cn("mx-1 h-px w-5", done ? "bg-success" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
