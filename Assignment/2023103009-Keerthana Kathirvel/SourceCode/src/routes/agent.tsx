import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, CheckCircle2, Database, Mail, MapPin, Search, ShieldAlert, Wrench, XCircle } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import { EmptyState, LoadingGrid, PageHeader, Panel, PriorityBadge, RequirePermission, StatCard } from "@/components/common";
import { AgentWorkflow } from "@/components/agent/AgentWorkflow";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "Agent Activity — CampusFlow AI" },
      { name: "description", content: "Live view of the AI triage agent: status, current task, tools used and approval requests." },
      { property: "og:title", content: "Agent Activity — CampusFlow AI" },
      { property: "og:description", content: "What the CampusFlow AI agent is doing right now." },
    ],
  }),
  component: () => <RequirePermission perm="agent.view"><AgentPage /></RequirePermission>,
});

const TOOLS = [
  { name: "incident_db.lookup", icon: Database, calls: 412, ok: 99.8 },
  { name: "location_resolver", icon: MapPin, calls: 388, ok: 98.4 },
  { name: "similar_incident_search", icon: Search, calls: 301, ok: 99.1 },
  { name: "notify_department", icon: Mail, calls: 276, ok: 96.7 },
  { name: "work_order.create", icon: Wrench, calls: 142, ok: 94.2 },
];
const FAILED = [
  { t: "notify_department timed out (retry succeeded)", id: "INC-02415", at: "08:12" },
  { t: "work_order.create rejected: asset ID unknown", id: "INC-02402", at: "06:48" },
  { t: "Guardrail: action blocked pending approval", id: "INC-02404", at: "05:30" },
];

function AgentPage() {
  const { data, isLoading } = useIncidents();
  if (isLoading || !data) return <><PageHeader title="Agent activity" /><LoadingGrid /></>;
  const pending = data.filter((i) => i.approval === "pending");
  const current = data.find((i) => i.status === "New") ?? data[0];
  if (!current) return <EmptyState title="No incidents yet" />;

  return (
    <>
      <PageHeader title="Agent activity" description="Operations of the campusflow-triage-v2 agent" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agent status" value={<span className="flex items-center gap-2 text-2xl"><span className="size-2.5 rounded-full bg-success animate-pulse-dot" />Running</span>} hint="Uptime 6d 14h" icon={Bot} tone="success" />
        <StatCard label="Successful actions" value="1,482" hint="Last 7 days" icon={CheckCircle2} tone="success" />
        <StatCard label="Failed actions" value="23" hint="1.5% · all recovered or escalated" icon={XCircle} tone="critical" />
        <StatCard label="Approval requests" value={pending.length} hint="Awaiting a manager" icon={ShieldAlert} tone="warning" />
      </div>

      <Panel title="Current task" className="mt-4" action={<span className="font-mono text-xs text-primary">{current.id}</span>}>
        <p className="mb-3 text-sm"><b>{current.title}</b> — {current.location}</p>
        <AgentWorkflow active={current.approval === "pending" ? 5 : 4} />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Tools used">
          <div className="space-y-3">{TOOLS.map((t) => (
            <div key={t.name} className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><t.icon className="size-4" /></span><div className="flex-1"><p className="font-mono text-xs">{t.name}</p><p className="text-xs text-muted-foreground">{t.calls} calls · {t.ok}% ok</p></div></div>
          ))}</div>
        </Panel>
        <Panel title="Recent actions">
          <div className="space-y-3">{data.slice(0, 6).map((i) => (
            <div key={i.id} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /><div><p>Routed <Link to="/incidents/$id" params={{ id: i.id }} className="font-mono text-xs text-primary">{i.id}</Link> to {i.department}</p><p className="text-xs text-muted-foreground">{fmtDateTime(i.createdAt)}</p></div></div>
          ))}</div>
        </Panel>
        <Panel title="Failed actions">
          <div className="space-y-3">{FAILED.map((f) => (
            <div key={f.t} className="flex gap-2 text-sm"><XCircle className="mt-0.5 size-4 shrink-0 text-critical" /><div><p>{f.t}</p><p className="text-xs text-muted-foreground">{f.id} · {f.at}</p></div></div>
          ))}</div>
        </Panel>
      </div>

      <Panel title="Human approval requests" className="mt-4">
        {pending.length ? <div className="divide-y">{pending.map((i) => (
          <Link key={i.id} to="/incidents/$id" params={{ id: i.id }} className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/40"><span className="w-20 font-mono text-xs text-muted-foreground">{i.id}</span><span className="flex-1 truncate">{i.title}</span><span className="hidden text-xs text-muted-foreground md:block">{i.analysis.requiresApproval && (i.priority === "Critical" ? "Critical priority" : i.category === "Security" ? "Security incident" : "Low confidence")}</span><PriorityBadge p={i.priority} /></Link>
        ))}</div> : <EmptyState title="No pending approvals" />}
      </Panel>
    </>
  );
}
