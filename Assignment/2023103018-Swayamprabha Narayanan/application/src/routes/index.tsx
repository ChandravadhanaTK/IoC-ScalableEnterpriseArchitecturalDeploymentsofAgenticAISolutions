import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, Bot, CheckCircle2, Clock, Inbox, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, PriorityBadge, Stat, StatusBadge, chartTooltip } from "@/components/ops/ui";
import { deptStats, fmtTime, PRIORITIES, trend } from "@/lib/data";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Operations Dashboard", "Live operational request overview for Northstar Medical Center, powered by an AI operations assistant."),
  component: Dashboard,
});

const PRIO_COLORS = ["var(--chart-5)", "var(--chart-4)", "var(--chart-1)", "var(--chart-2)"];

function Dashboard() {
  const { requests } = useStore();
  const open = requests.filter((r) => !["Resolved", "Closed"].includes(r.status));
  const count = (s: string) => requests.filter((r) => r.status === s).length;
  const prio = PRIORITIES.map((p) => ({ name: p, value: requests.filter((r) => r.priority === p).length * 7 + 3 }));

  return (
    <>
      <PageHeader eyebrow="Northstar Medical Center" title="Operations Dashboard" subtitle="Real-time view of facility, IT and service operations · Saturday shift"
        actions={<><Button variant="outline" asChild><Link to="/triage"><Bot />AI Triage</Link></Button><Button asChild><Link to="/new-request">New request</Link></Button></>} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Active requests" value={String(open.length + 184)} delta="+6.2% vs last week" icon={<Inbox />} />
        <Stat label="New requests" value={String(count("New") + 23)} delta="Last 24 hours" icon={<Sparkles />} tone="teal" />
        <Stat label="In progress" value={String(count("In Progress") + 61)} delta="Across 7 departments" icon={<Loader2 />} />
        <Stat label="Resolved today" value={String(count("Resolved") + 142)} delta="+11 vs yesterday" icon={<CheckCircle2 />} tone="success" />
        <Stat label="High priority" value={String(requests.filter((r) => r.priority === "Critical" || r.priority === "High").length + 31)} delta="8 critical" icon={<AlertTriangle />} tone="destructive" />
        <Stat label="Avg response time" value="14.6m" delta="Target ≤ 20m" icon={<Clock />} tone="warning" />
        <Stat label="SLA compliance" value="96.1%" delta="Target 95%" icon={<ShieldCheck />} tone="success" />
        <Stat label="AI triage success" value="93.4%" delta="Accepted without edits" icon={<Bot />} tone="teal" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel title="Requests trend" subtitle="Created vs resolved, last 7 days" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={32} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="created" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gc)" />
                <Area type="monotone" dataKey="resolved" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#gr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Priority distribution" subtitle="Open requests">
          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={prio} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">
                  {prio.map((_, i) => <Cell key={i} fill={PRIO_COLORS[i]} />)}
                </Pie>
                <Tooltip {...chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {prio.map((p, i) => <div key={p.name} className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: PRIO_COLORS[i] }} />{p.name}<span className="ml-auto font-semibold">{p.value}</span></div>)}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Requests by department" subtitle="Currently open" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={deptStats.map((d) => ({ name: d.name.replace("Equipment Maintenance", "Equipment").replace("Patient Services", "Patient Svc"), open: d.open, high: d.high }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={28} />
                <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="open" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="high" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <section className="rounded-2xl bg-navy-hero p-5 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-2 text-sm font-semibold"><Bot className="size-4" />AI operations summary</div>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">Equipment Maintenance is at <b>88% load</b> with 3 requests at SLA risk. Recommend reallocating one Biomed technician from the day shift. HVAC incident in OR suite 3 remains the top critical item.</p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[["1,284", "Analyzed"], ["312", "Routed"], ["41", "Approvals"]].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-primary-foreground/10 p-3"><div className="text-lg font-bold">{v}</div><div className="text-[11px] text-primary-foreground/70">{l}</div></div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-primary-foreground/70"><Activity className="size-3.5" />Human approval required for all critical routing</div>
        </section>
      </div>

      <Panel title="Recent requests" className="mt-4" action={<Button variant="ghost" size="sm" asChild><Link to="/requests">View all</Link></Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-4 font-medium">ID</th><th className="pr-4 font-medium">Title</th><th className="pr-4 font-medium">Department</th><th className="pr-4 font-medium">Priority</th><th className="pr-4 font-medium">Status</th><th className="font-medium">Created</th></tr></thead>
            <tbody>
              {requests.slice(0, 6).map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-primary">{r.id}</td>
                  <td className="pr-4 font-medium">{r.title}</td>
                  <td className="pr-4 text-muted-foreground">{r.department}</td>
                  <td className="pr-4"><PriorityBadge priority={r.priority} /></td>
                  <td className="pr-4"><StatusBadge status={r.status} /></td>
                  <td className="whitespace-nowrap text-muted-foreground">{fmtTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
