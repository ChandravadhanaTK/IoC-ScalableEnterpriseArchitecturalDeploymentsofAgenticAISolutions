import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, Bot, CheckCircle2, Clock, Gauge, Lightbulb, RefreshCw, Server, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Stat, chartTooltip } from "@/components/ops/ui";
import { fmtTime, latency } from "@/lib/data";
import { AGENT_COMPONENTS } from "@/lib/agent";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitoring")({
  head: () => meta("Agent & Monitoring", "AI agent activity, latency, error rate, SLA and uptime monitoring."),
  component: Monitoring,
});

function Monitoring() {
  const { audit } = useStore();
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = (fail = false) => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setFailed(fail); fail ? toast.error("Metrics service unreachable") : toast.success("Metrics refreshed"); }, 600);
  };

  return (
    <>
      <PageHeader eyebrow="Observability" title="Agent & Monitoring" subtitle="Agent health and platform telemetry · 24h window"
        actions={<><Button variant="outline" onClick={() => refresh(true)}>Simulate outage</Button><Button onClick={() => refresh()} disabled={refreshing}><RefreshCw className={cn(refreshing && "animate-spin")} />Refresh</Button></>} />

      {failed && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <span className="flex items-center gap-2"><AlertTriangle className="size-4" />Unable to load live metrics. Showing last cached snapshot.</span>
          <Button size="sm" variant="outline" onClick={() => refresh()}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Agent status" value="Operational" delta="All 8 modules healthy" icon={<Bot />} tone="success" />
        <Stat label="Requests analyzed" value="1,284" delta="Today" icon={<Activity />} />
        <Stat label="Recommendations" value="1,197" delta="93.4% accepted" icon={<Lightbulb />} tone="teal" />
        <Stat label="Human approvals" value="41" delta="6 pending" icon={<UserCheck />} tone="warning" />
        <Stat label="AI response time" value="0.94s" delta="p95 1.6s" icon={<Clock />} />
        <Stat label="API latency" value="128ms" delta="p95 210ms" icon={<Gauge />} />
        <Stat label="Error rate" value="0.31%" delta="Budget 1.0%" icon={<AlertTriangle />} tone="destructive" />
        <Stat label="SLA compliance" value="96.1%" delta="Target 95%" icon={<CheckCircle2 />} tone="success" />
        <Stat label="System uptime" value="99.98%" delta="30-day" icon={<Server />} tone="teal" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="AI response time (ms)" subtitle="Model inference per request">
          <div className="h-56"><ResponsiveContainer><AreaChart data={latency}>
            <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="t" fontSize={11} tickLine={false} axisLine={false} interval={3} stroke="var(--muted-foreground)" />
            <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} stroke="var(--muted-foreground)" />
            <Tooltip {...chartTooltip} /><Area dataKey="ai" stroke="var(--chart-2)" strokeWidth={2} fill="url(#ga)" />
          </AreaChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="API latency & error rate" subtitle="Service layer">
          <div className="h-56"><ResponsiveContainer><LineChart data={latency}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="t" fontSize={11} tickLine={false} axisLine={false} interval={3} stroke="var(--muted-foreground)" />
            <YAxis yAxisId="l" fontSize={11} tickLine={false} axisLine={false} width={36} stroke="var(--muted-foreground)" />
            <YAxis yAxisId="r" orientation="right" fontSize={11} tickLine={false} axisLine={false} width={30} stroke="var(--muted-foreground)" />
            <Tooltip {...chartTooltip} />
            <Line yAxisId="l" dataKey="api" name="Latency ms" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            <Line yAxisId="r" dataKey="errors" name="Error %" stroke="var(--chart-5)" strokeWidth={2} dot={false} />
          </LineChart></ResponsiveContainer></div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Agent activity timeline" className="xl:col-span-2">
          <ol className="relative space-y-4 border-l pl-6">
            {audit.slice(0, 8).map((e) => (
              <li key={e.id} className="relative">
                <span className={cn("absolute -left-[29px] top-1 size-3 rounded-full ring-4 ring-card", e.level === "critical" ? "bg-destructive" : e.level === "warn" ? "bg-warning" : "bg-teal")} />
                <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="text-sm font-medium">{e.action} · <span className="font-mono text-xs text-primary">{e.target}</span></span><span className="text-xs text-muted-foreground">{fmtTime(e.at)}</span></div>
                <p className="text-xs text-muted-foreground">{e.actor}</p>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Module health">
          <ul className="space-y-2.5">
            {AGENT_COMPONENTS.map((c, i) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" />{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{[12, 48, 21, 9, 33, 64, 4, 3][i]}ms</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
