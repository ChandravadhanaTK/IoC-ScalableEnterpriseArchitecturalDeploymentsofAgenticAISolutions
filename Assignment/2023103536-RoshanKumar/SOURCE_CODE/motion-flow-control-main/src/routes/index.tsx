import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useDisruptions, useLogs, useNetwork, useOrders, usePendingApprovals, useRuns } from "@/lib/data";
import { Kpi, Panel, StatusBadge } from "@/components/detour/bits";
import { NetworkGraph } from "@/components/detour/NetworkGraph";
import { ActivityStream, SimulateButton } from "@/components/detour/agent";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Detour Control Center" },
      { name: "description", content: "Live supply network health, active disruptions, pending approvals and agent activity." },
      { property: "og:title", content: "Overview — Detour Control Center" },
      { property: "og:description", content: "Live supply network health and agent activity for planners." },
    ],
  }),
  component: Overview,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function Overview() {
  const { data: orders = [] } = useOrders();
  const { data: net } = useNetwork();
  const { data: dis = [] } = useDisruptions();
  const { data: pending = [] } = usePendingApprovals();
  const { data: runs = [] } = useRuns();
  const { data: logs = [] } = useLogs(undefined, 14);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -60]);

  const atRisk = orders.filter((o: any) => ["AT_RISK", "ESCALATED"].includes(o.status)).length;
  const resolved = orders.filter((o: any) => ["REROUTED", "EXPEDITED", "SUBSTITUTED"].includes(o.status) || o.disruption_status === "MONITORED").length;
  const active = dis.filter((d: any) => d.status === "ACTIVE" || d.status === "ANALYZING");

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-mono">Operations · Pune Plant inbound</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Navigate disruption. Keep supply moving.</h1>
        </div>
        <SimulateButton size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Purchase orders" value={orders.length} />
        <Kpi label="Active disruptions" value={active.length} tone={active.length ? "crit" : "idle"} />
        <Kpi label="At-risk POs" value={atRisk} tone={atRisk ? "crit" : "idle"} />
        <Kpi label="Pending approvals" value={pending.length} tone={pending.length ? "warn" : "idle"} />
        <Kpi label="Resolved POs" value={resolved} tone="ok" />
      </div>

      <motion.div style={{ y: heroY }}>
        <Panel title="Network health · live flows" action={<Link to="/network" className="flex items-center gap-1 text-xs text-primary">Open canvas <ArrowRight className="size-3" /></Link>}>
          <NetworkGraph data={net} />
        </Panel>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Disruptions">
          <ul className="divide-y divide-border">
            {dis.map((d: any) => {
              const run = runs.find((r: any) => r.disruption_id === d.id);
              return (
                <li key={d.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link to="/disruptions/$id" params={{ id: d.id }} className="font-medium hover:text-primary">{d.title}</Link>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {d.severity} · {d.duration_days}-day · {run ? `${run.total_pos} exposed · ${run.processed_pos}/${run.total_pos} processed` : "not simulated"}
                    </div>
                  </div>
                  <StatusBadge status={run?.status ?? d.status} />
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Recent agent activity" action={<Link to="/actions" className="text-xs text-primary">Full log</Link>}>
          {logs.length ? <ActivityStream logs={logs} compact /> : <div className="p-8 text-center text-sm text-muted-foreground">No agent activity yet. Simulate a port closure to watch Detour respond.</div>}
        </Panel>
      </div>
    </div>
  );
}
