import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, Factory, Route as RouteIcon } from "lucide-react";
import { useDisruptions, useRuns } from "@/lib/data";
import { PageHeader, StatusBadge, Stagger } from "@/components/detour/bits";
import { SimulateButton } from "@/components/detour/agent";

export const Route = createFileRoute("/disruptions/")({
  head: () => ({
    meta: [
      { title: "Disruptions — Detour" },
      { name: "description", content: "Trigger port closures, supplier shutdowns and route suspensions and watch the agent respond." },
      { property: "og:title", content: "Disruptions — Detour" },
      { property: "og:description", content: "Disruption scenarios ready to simulate." },
    ],
  }),
  component: DisruptionsPage,
});

const ICON = { PORT_CLOSURE: Anchor, SUPPLIER_SHUTDOWN: Factory, ROUTE_UNAVAILABLE: RouteIcon } as Record<string, typeof Anchor>;

/* eslint-disable @typescript-eslint/no-explicit-any */
function DisruptionsPage() {
  const { data: dis = [] } = useDisruptions();
  const { data: runs = [] } = useRuns();
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Scenarios" title="Disruptions" />
      <div className="grid gap-4 lg:grid-cols-3">
        {dis.map((d: any, i: number) => {
          const Icon = ICON[d.type] ?? Anchor;
          const run = runs.find((r: any) => r.disruption_id === d.id);
          return (
            <Stagger key={d.id} i={i}>
              <div className="hud-panel flex h-full flex-col p-5">
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-crit" />
                  <StatusBadge status={d.severity} />
                </div>
                <Link to="/disruptions/$id" params={{ id: d.id }} className="mt-4 text-lg font-semibold hover:text-primary">{d.title}</Link>
                <div className="label-mono mt-1">{d.type.replace(/_/g, " ")} · {d.duration_days} days</div>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{d.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  {run ? <StatusBadge status={run.status} /> : <span className="font-mono text-[11px] text-muted-foreground">No runs yet</span>}
                  <SimulateButton disruptionId={d.id} label="Simulate" size="sm" />
                </div>
              </div>
            </Stagger>
          );
        })}
      </div>
    </div>
  );
}
