import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { agentStep } from "@/lib/agent.functions";
import { useActions, useDisruptions, useLogs, useNetwork, useOrders, useRuns } from "@/lib/data";
import { AnimatedNumber, Kpi, Panel, StatusBadge } from "@/components/detour/bits";
import { NetworkGraph } from "@/components/detour/NetworkGraph";
import { ActivityStream, ApprovalSpotlight, DecisionDrawer, SimulateButton } from "@/components/detour/agent";
import { inr, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/disruptions/$id")({
  head: () => ({
    meta: [
      { title: "Scenario Workspace — Detour" },
      { name: "description", content: "Watch the Detour agent evaluate each exposed purchase order, act, verify and escalate." },
      { property: "og:title", content: "Scenario Workspace — Detour" },
      { property: "og:description", content: "Live agent response to a supply-chain disruption." },
    ],
  }),
  component: Workspace,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function Workspace() {
  const { id } = Route.useParams();
  const { data: dis = [] } = useDisruptions();
  const d = dis.find((x: any) => x.id === id);
  const { data: runs = [] } = useRuns(id);
  const run = runs[0];
  const { data: actions = [] } = useActions(run?.id ?? null);
  const { data: logs = [] } = useLogs(run?.id ?? null);
  const { data: orders = [] } = useOrders();
  const { data: net } = useNetwork();
  const [sel, setSel] = useState<any>(null);
  const step = useServerFn(agentStep);
  const qc = useQueryClient();
  const driving = useRef<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // Drive the single orchestrator loop: one PO per server call, state persisted in DB.
  useEffect(() => {
    if (!run || run.status !== "RUNNING" || run.processed_pos >= run.total_pos || driving.current === run.id) return;
    driving.current = run.id;
    (async () => {
      try {
        for (let i = 0; i < 30 && mounted.current; i++) {
          const r = await step({ data: { runId: run.id } });
          qc.invalidateQueries();
          if (r.done) break;
          await new Promise((res) => setTimeout(res, 400));
        }
      } finally {
        driving.current = null;
      }
    })();
  }, [run?.id, run?.status, run?.processed_pos, run?.total_pos, step, qc]);

  const final = new Map<string, any>();
  for (const a of actions) if (a.execution_status !== "SKIPPED" && a.execution_status !== "FAILED") final.set(a.po_id, a);
  const exposedIds: string[] = run?.queue ?? [];
  const exposed = exposedIds.map((pid) => orders.find((o: any) => o.id === pid)).filter(Boolean);
  const finals = [...final.values()];
  const resolved = finals.filter((a) => a.execution_status === "EXECUTED" && a.action_type !== "ESCALATE").length;
  const pending = actions.filter((a: any) => a.approval_status === "PENDING");
  const escalated = finals.filter((a) => a.action_type === "ESCALATE").length;
  const cost = finals.filter((a) => a.execution_status === "EXECUTED").reduce((s, a) => s + Number(a.estimated_cost), 0);
  const running = run?.status === "RUNNING";
  const current = running ? exposedIds[run.processed_pos - 1] : null;
  const done = run && (run.status === "COMPLETED" || run.status === "ESCALATED");

  if (!d) return <div className="p-10 text-center text-muted-foreground">Loading scenario…</div>;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-mono">Scenario workspace · {d.id}</div>
          <h1 className="mt-1 text-3xl font-semibold uppercase tracking-tight">{d.title}</h1>
          <div className="mt-2 flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <StatusBadge status={d.severity} /> {d.duration_days} DAYS
            <span>·</span> AGENT {run ? <StatusBadge status={run.status} /> : <StatusBadge status="IDLE" />}
          </div>
        </div>
        <SimulateButton disruptionId={d.id} label={run ? "Re-run scenario" : "Simulate"} />
      </div>

      {!run ? (
        <Panel><div className="p-12 text-center text-muted-foreground">This scenario hasn't been simulated yet. Start it to watch the agent respond.</div></Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Exposed POs" value={run.total_pos} tone="crit" />
            <Kpi label="Processed" value={run.processed_pos} tone="agent" hint={`of ${run.total_pos}`} />
            <Kpi label="Resolved" value={resolved} tone="ok" />
            <Kpi label="Approval required" value={pending.length} tone="warn" />
            <Kpi label="Escalated" value={escalated} tone="crit" />
          </div>

          <div className="h-1 overflow-hidden rounded bg-muted">
            <motion.div className="h-full bg-agent" animate={{ width: `${run.total_pos ? (run.processed_pos / run.total_pos) * 100 : 0}%` }} transition={{ duration: 0.6 }} />
          </div>

          {done && run.summary && <Summary s={run.summary} />}

          <Panel title="Live network">
            <NetworkGraph data={net} className="h-[400px]" />
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
            <Panel title="Exposure table" action={<span className="font-mono text-[11px] text-muted-foreground">click a PO for the decision record</span>}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="label-mono border-b border-border text-left">{["PO", "Product", "Required", "ETA", "Action", "Cost", "Status"].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr></thead>
                  <tbody>
                    {exposed.map((o: any, i: number) => {
                      const a = final.get(o.id);
                      const isCur = current === o.id && !a;
                      return (
                        <motion.tr key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} onClick={() => setSel(o)} className={cn("cursor-pointer border-b border-border/50 hover:bg-accent/40", isCur && "bg-agent/10", a?.approval_status === "PENDING" && "bg-warn/10")}>
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono">{isCur && <Loader2 className="mr-1 inline size-3 animate-spin text-agent" />}{o.id}</td>
                          <td className="px-3 py-2.5">{o.product?.name}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{shortDate(o.required_date)}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{shortDate(o.expected_arrival)}</td>
                          <td className="px-3 py-2.5">{a ? <StatusBadge status={a.action_type.replace("NO_ACTION", "NO ACTION")} tone={a.action_type === "ESCALATE" ? "crit" : a.action_type === "NO_ACTION" ? "idle" : "ok"} /> : <span className="font-mono text-[11px] text-muted-foreground">{isCur ? "evaluating…" : "queued"}</span>}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{a ? inr(a.estimated_cost) : "—"}</td>
                          <td className="px-3 py-2.5"><StatusBadge status={a?.approval_status === "PENDING" ? "APPROVAL" : o.status} tone={a?.approval_status === "PENDING" ? "warn" : undefined} /></td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-3 font-mono text-xs text-muted-foreground">
                <span>Additional cost committed</span>
                <span className="text-base text-foreground"><AnimatedNumber value={cost} format={(n) => inr(n)} /></span>
              </div>
            </Panel>
            <Panel title="Agent activity" action={<Link to="/compare" className="text-xs text-primary">Compare options</Link>}>
              <ActivityStream logs={logs} active={running} />
            </Panel>
          </div>
        </>
      )}
      <ApprovalSpotlight pending={pending} />
      <DecisionDrawer po={sel} actions={actions} onClose={() => setSel(null)} />
    </div>
  );
}

function Summary({ s }: { s: any }) {
  const c = s.counts ?? {};
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="hud-panel border-ok/40 p-5">
      <div className="flex items-center gap-2 text-ok"><CheckCircle2 className="size-5" /><span className="label-mono !text-ok">Disruption response complete</span></div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {[
          ["Exposed", s.exposed],
          ["Rerouted", c.REROUTE],
          ["Expedited", c.EXPEDITE],
          ["Substituted", c.SUBSTITUTE],
          ["No action", c.NO_ACTION],
          ["Escalated", c.ESCALATE],
          ["Stockouts prevented", s.stockouts_prevented],
          ["Human approvals", s.human_approvals],
        ].map(([l, v]) => (
          <div key={l as string}><div className="label-mono">{l}</div><div className="mt-1 font-mono text-2xl"><AnimatedNumber value={Number(v ?? 0)} /></div></div>
        ))}
      </div>
      <div className="mt-4 font-mono text-sm text-muted-foreground">Additional cost: <span className="text-foreground"><AnimatedNumber value={Number(s.total_cost)} format={(n) => inr(n)} /></span></div>
    </motion.div>
  );
}
