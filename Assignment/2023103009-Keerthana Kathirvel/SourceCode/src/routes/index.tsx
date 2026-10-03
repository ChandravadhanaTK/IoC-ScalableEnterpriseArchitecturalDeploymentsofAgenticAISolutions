import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertOctagon, CheckCircle2, Clock, FolderOpen, Gauge, Layers, Bot } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import { trendData } from "@/data/mockData";
import { EmptyState, ErrorState, LoadingGrid, PageHeader, Panel, PriorityBadge, StatCard, StatusBadge, Meter } from "@/components/common";
import { fmtDateTime } from "@/lib/format";
import { DEPARTMENTS } from "@/types/domain";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — CampusFlow AI" },
      { name: "description", content: "Live overview of campus incidents, response times, department workload and AI agent activity." },
      { property: "og:title", content: "Operations Dashboard — CampusFlow AI" },
      { property: "og:description", content: "Live overview of campus incidents and AI agent activity." },
    ],
  }),
  component: Dashboard,
});

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

function Dashboard() {
  const { data, isLoading, error, refetch } = useIncidents();

  if (isLoading) return <><PageHeader title="Operations Dashboard" description="Loading live campus metrics…" /><LoadingGrid count={8} /></>;
  if (error || !data) return <ErrorState message="Could not load incidents." onRetry={() => refetch()} />;

  const open = data.filter((i) => !["Resolved", "Closed"].includes(i.status));
  const resolved = data.filter((i) => ["Resolved", "Closed"].includes(i.status));
  const critical = data.filter((i) => i.priority === "Critical");
  const avgRes = resolved.reduce((s, i) => s + (i.resolutionHours ?? 0), 0) / (resolved.length || 1);
  const workload = Object.values(DEPARTMENTS).map((d) => ({ dept: d.split(" ")[0], open: open.filter((i) => i.department === d).length, total: data.filter((i) => i.department === d).length }));

  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-hero p-6 text-primary-foreground shadow-elevated">
        <div className="absolute inset-0 bg-glow" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Saturday shift · Main Campus</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">{open.length} active incidents, {critical.filter((i) => !["Resolved", "Closed"].includes(i.status)).length} critical</h1>
            <p className="mt-1 text-sm opacity-80">The triage agent auto-routed {data.length - data.filter((i) => i.approval === "pending").length} of {data.length} incidents this period.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary"><Link to="/report">Report incident</Link></Button>
            <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/triage">Open AI triage</Link></Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total" value={data.length} hint="Last 14 days" icon={Layers} />
        <StatCard label="Open" value={open.length} hint="Awaiting resolution" icon={FolderOpen} tone="info" />
        <StatCard label="Resolved" value={resolved.length} hint="Resolved or closed" icon={CheckCircle2} tone="success" />
        <StatCard label="Critical" value={critical.length} hint="Highest priority" icon={AlertOctagon} tone="critical" />
        <StatCard label="Avg response" value="14m" hint={`Avg resolution ${avgRes.toFixed(1)}h`} icon={Clock} tone="warning" />
        <StatCard label="Resolution rate" value={`${Math.round((resolved.length / data.length) * 100)}%`} hint="SLA target 85%" icon={Gauge} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Incident trends" description="Reported vs resolved, daily" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="reported" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="resolved" stroke="var(--chart-3)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Department workload" description="Open vs total incidents">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={workload} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="dept" tick={axis} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Bar dataKey="total" fill="var(--accent)" radius={[0, 6, 6, 0]} barSize={14} />
                <Bar dataKey="open" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Recent incidents" className="xl:col-span-2" action={<Link to="/incidents" className="text-xs font-semibold text-primary">View all</Link>}>
          {data.length === 0 ? <EmptyState title="No incidents yet" /> : (
            <div className="divide-y">
              {data.slice(0, 6).map((i) => (
                <Link key={i.id} to="/incidents/$id" params={{ id: i.id }} className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg">
                  <span className="font-mono text-xs text-muted-foreground w-20">{i.id}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.title}</p>
                    <p className="text-xs text-muted-foreground">{i.location} · {fmtDateTime(i.createdAt)}</p>
                  </div>
                  <PriorityBadge p={i.priority} />
                  <span className="hidden sm:block"><StatusBadge s={i.status} /></span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="AI agent activity" description="Last decisions" action={<Bot className="size-4 text-primary" />}>
          <div className="space-y-3">
            {data.slice(0, 5).map((i) => (
              <div key={i.id} className="rounded-xl bg-muted/60 p-3">
                <div className="flex items-center justify-between text-xs"><span className="font-mono text-muted-foreground">{i.id}</span><span className="font-semibold text-primary">{Math.round(i.analysis.confidence * 100)}%</span></div>
                <p className="mt-1 text-sm">Routed to <b>{i.department}</b> as {i.category}</p>
                <div className="mt-2"><Meter value={i.analysis.confidence * 100} tone={i.analysis.confidence > 0.8 ? "success" : "warning"} /></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
