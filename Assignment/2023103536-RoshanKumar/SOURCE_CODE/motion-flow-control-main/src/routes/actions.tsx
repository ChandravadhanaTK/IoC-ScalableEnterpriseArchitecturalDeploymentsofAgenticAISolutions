import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useLogs } from "@/lib/data";
import { Empty, PageHeader, Panel } from "@/components/detour/bits";
import { clock } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "Action Log — Detour" },
      { name: "description", content: "Immutable, chronological audit trail of every agent tool call, decision, approval and verification." },
      { property: "og:title", content: "Action Log — Detour" },
      { property: "og:description", content: "Immutable audit trail of agent decisions." },
    ],
  }),
  component: ActionsPage,
});

const DOT: Record<string, string> = {
  DECISION: "bg-agent", VERIFIED: "bg-ok", ACTION_EXECUTED: "bg-ok", RUN_COMPLETE: "bg-ok", APPROVED: "bg-ok",
  APPROVAL_REQUIRED: "bg-warn", WAITING: "bg-warn", ESCALATED: "bg-crit", REJECTED: "bg-crit", ACTION_FAILED: "bg-crit", DISRUPTION_DETECTED: "bg-crit",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function ActionsPage() {
  const { data: logs = [], isLoading } = useLogs(undefined, 400);
  const asc = [...logs].reverse();
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Audit" title="Action Log" />
      <Panel>
        {isLoading ? <Empty>Loading…</Empty> : !asc.length ? <Empty>No events yet.</Empty> : (
          <ol className="relative ml-6 border-l border-border py-4">
            {asc.map((l: any, i: number) => (
              <motion.li key={l.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min((i % 20) * 0.02, 0.3) }} className="relative py-2 pl-6 pr-4">
                <span className={cn("absolute -left-[5px] top-3.5 size-2.5 rounded-full border-2 border-background", DOT[l.event_type] ?? "bg-idle")} />
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-mono text-[11px] text-muted-foreground">{clock(l.created_at)}</span>
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground">{l.event_type}</span>
                  {l.po_id && <span className="font-mono text-[11px] text-primary">{l.po_id}</span>}
                  <span className={cn("font-mono text-[10px]", l.actor === "PLANNER" ? "text-warn" : "text-muted-foreground")}>{l.actor}</span>
                </div>
                <div className={cn("text-sm", l.event_type.startsWith("TOOL") && "font-mono text-xs text-muted-foreground")}>{l.message}</div>
              </motion.li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
