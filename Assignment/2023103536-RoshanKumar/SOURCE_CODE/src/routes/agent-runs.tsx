import { createFileRoute, Link } from "@tanstack/react-router";
import { useRuns } from "@/lib/data";
import { Empty, PageHeader, Panel, StatusBadge, Stagger } from "@/components/detour/bits";
import { clock, inr, shortDate } from "@/lib/format";

export const Route = createFileRoute("/agent-runs")({
  head: () => ({
    meta: [
      { title: "Agent Runs — Detour" },
      { name: "description", content: "History of orchestrator agent runs with outcomes, cost and approvals." },
      { property: "og:title", content: "Agent Runs — Detour" },
      { property: "og:description", content: "Orchestrator agent run history." },
    ],
  }),
  component: RunsPage,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function RunsPage() {
  const { data: runs = [], isLoading } = useRuns();
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Orchestrator" title="Agent Runs" />
      <Panel>
        {isLoading ? <Empty>Loading…</Empty> : !runs.length ? <Empty>No runs yet.</Empty> : (
          <ul className="divide-y divide-border">
            {runs.map((r: any, i: number) => {
              const c = r.summary?.counts;
              return (
                <Stagger key={r.id} i={i}>
                  <li className="flex flex-wrap items-center gap-4 px-4 py-3">
                    <div className="min-w-48 flex-1">
                      <Link to="/disruptions/$id" params={{ id: r.disruption_id }} className="font-medium hover:text-primary">{r.disruption?.title}</Link>
                      <div className="font-mono text-[11px] text-muted-foreground">{r.id.slice(0, 8)} · {shortDate(r.started_at)} {clock(r.started_at)}</div>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{r.processed_pos}/{r.total_pos} POs</div>
                    {c && <div className="font-mono text-[11px] text-muted-foreground">R{c.REROUTE} · E{c.EXPEDITE} · S{c.SUBSTITUTE} · N{c.NO_ACTION} · X{c.ESCALATE}</div>}
                    {r.summary?.total_cost != null && <div className="font-mono text-xs">{inr(r.summary.total_cost)}</div>}
                    {r.summary?.note && <div className="text-xs text-muted-foreground">{r.summary.note}</div>}
                    <StatusBadge status={r.status} />
                  </li>
                </Stagger>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
