import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, Cpu, Shield, Sparkles, Wrench, HeartHandshake, Briefcase } from "lucide-react";
import { PageHeader, Panel, Meter, chartTooltip } from "@/components/ops/ui";
import { deptStats } from "@/lib/data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/departments")({
  head: () => meta("Departments", "Department workload, SLA compliance and response times across hospital operations."),
  component: Departments,
});

const ICONS = { Facilities: Building2, IT: Cpu, Housekeeping: Sparkles, Security: Shield, "Equipment Maintenance": Wrench, "Patient Services": HeartHandshake, Administration: Briefcase };

function Departments() {
  return (
    <>
      <PageHeader eyebrow="Routing targets" title="Department Workload" subtitle="Live capacity used by the Department Router and SLA Analyzer" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {deptStats.map((d) => {
          const Icon = ICONS[d.name];
          const tone = d.load > 80 ? "destructive" : d.load > 60 ? "warning" : "teal";
          return (
            <div key={d.name} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                <div className="font-semibold leading-tight">{d.name}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Open</div><div className="text-lg font-bold">{d.open}</div></div>
                <div><div className="text-xs text-muted-foreground">High priority</div><div className="text-lg font-bold text-destructive">{d.high}</div></div>
                <div><div className="text-xs text-muted-foreground">Avg response</div><div className="font-semibold">{d.avgMin} min</div></div>
                <div><div className="text-xs text-muted-foreground">SLA</div><div className="font-semibold text-success">{d.sla}%</div></div>
              </div>
              <div className="mt-4"><div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Current workload</span><span className="font-semibold">{d.load}%</span></div><Meter value={d.load} tone={tone} /></div>
            </div>
          );
        })}
      </div>
      <Panel title="Workload vs SLA" subtitle="Capacity utilisation and compliance by department" className="mt-4">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={deptStats} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={130} stroke="var(--muted-foreground)" />
              <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="load" name="Workload %" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={12} />
              <Bar dataKey="sla" name="SLA %" fill="var(--chart-2)" radius={[0, 6, 6, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}
