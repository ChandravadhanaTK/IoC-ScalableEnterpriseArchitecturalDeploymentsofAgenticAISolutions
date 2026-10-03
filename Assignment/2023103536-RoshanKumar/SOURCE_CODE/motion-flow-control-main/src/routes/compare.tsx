import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useActions } from "@/lib/data";
import { Empty, PageHeader, Panel, StatusBadge } from "@/components/detour/bits";
import { CandidateTable } from "@/components/detour/agent";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Scenario Comparison — Detour" },
      { name: "description", content: "Side-by-side comparison of reroute, expedite, substitute and hold options for each purchase order." },
      { property: "og:title", content: "Scenario Comparison — Detour" },
      { property: "og:description", content: "Compare the agent's candidate options per PO." },
    ],
  }),
  component: ComparePage,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function ComparePage() {
  const { data: actions = [] } = useActions();
  // latest run's actions only
  const latestRun = actions.length ? actions[actions.length - 1].agent_run_id : null;
  const mine = actions.filter((a: any) => a.agent_run_id === latestRun);
  const pos = [...new Set(mine.map((a: any) => a.po_id))] as string[];
  const [po, setPo] = useState<string | null>(null);
  const cur = po ?? pos.find((p) => p === "PO-106") ?? pos[0];
  const attempts = mine.filter((a: any) => a.po_id === cur);
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Decision analysis" title="Scenario Comparison" />
      {!pos.length ? (
        <Panel><Empty>Run a disruption scenario to compare options.</Empty></Panel>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {pos.map((p) => (
              <button key={p} onClick={() => setPo(p)} className={cn("rounded border px-3 py-1 font-mono text-xs", cur === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{p}</button>
            ))}
          </div>
          <div className="space-y-4">
            {attempts.map((a: any) => (
              <Panel key={a.id} title={`${a.po_id} · ${a.po?.product?.name} · attempt ${a.attempt}`} action={<div className="flex gap-1.5"><StatusBadge status={a.action_type} />{a.requires_approval && <StatusBadge status={a.approval_status} />}</div>}>
                <div className="p-4">
                  <p className="mb-4 text-sm text-muted-foreground">{a.reason}</p>
                  <CandidateTable candidates={a.candidates ?? []} />
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
