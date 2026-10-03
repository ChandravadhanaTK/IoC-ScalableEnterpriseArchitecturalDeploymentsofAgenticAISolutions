import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, BadgeCheck, Gauge, IndianRupee, ShieldAlert, Timer, UserCheck } from "lucide-react";
import { monitoringSeries } from "@/data/mockData";
import { Meter, PageHeader, Panel, RequirePermission, StatCard } from "@/components/common";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring — CampusFlow AI" },
      { name: "description", content: "System health, AI agent performance, latency, guardrail events, cost and business outcomes." },
      { property: "og:title", content: "Monitoring — CampusFlow AI" },
      { property: "og:description", content: "Operational monitoring for the CampusFlow AI platform." },
    ],
  }),
  component: () => <RequirePermission perm="monitoring.view"><Monitoring /></RequirePermission>,
});

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const tip = { borderRadius: 12, border: "1px solid var(--border)" };
const SERVICES = [
  { name: "API Gateway", up: 99.98, tone: "success" as const },
  { name: "Triage Agent", up: 99.2, tone: "success" as const },
  { name: "Notification Service", up: 97.4, tone: "warning" as const },
  { name: "Incident Database", up: 99.99, tone: "success" as const },
  { name: "SSO / Identity", up: 99.95, tone: "success" as const },
];
const GUARDRAILS = [
  { t: "Prompt injection attempt blocked", src: "INC-02408 description", at: "08:42" },
  { t: "PII redacted before model call", src: "Phone number in report", at: "07:15" },
  { t: "Low-confidence auto-route prevented", src: "INC-02422 (64%)", at: "06:03" },
  { t: "Rate limit applied", src: "Reporter submitted 6 in 1 min", at: "02:27" },
];

function Monitoring() {
  return (
    <>
      <PageHeader title="Monitoring" description="Real-time health and performance of the platform and AI agent · last 24h" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="System health" value="Operational" hint="4 of 5 services nominal" icon={Activity} tone="success" />
        <StatCard label="Agent success rate" value="96.8%" hint="+1.2% vs last week" icon={BadgeCheck} />
        <StatCard label="Avg AI response" value="1.04s" hint="p95 1.9s" icon={Timer} tone="info" />
        <StatCard label="API latency" value="212ms" hint="p95 340ms" icon={Gauge} tone="info" />
        <StatCard label="Error rate" value="0.42%" hint="Budget 1.0%" icon={AlertTriangle} tone="warning" />
        <StatCard label="Human approval rate" value="31%" hint="Of AI decisions" icon={UserCheck} />
        <StatCard label="Guardrail events" value="17" hint="4 in the last 12h" icon={ShieldAlert} tone="critical" />
        <StatCard label="Est. operating cost" value={<span className="inline-flex items-center"><IndianRupee className="size-6" />4,820</span>} hint="Month to date · ₹2.1 / incident" icon={IndianRupee} tone="success" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Latency" description="API vs AI response time (ms)">
          <div className="h-60"><ResponsiveContainer><LineChart data={monitoringSeries}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="hour" tick={axis} interval={3} axisLine={false} tickLine={false} /><YAxis tick={axis} width={40} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} /><Line dataKey="latency" stroke="var(--chart-2)" strokeWidth={2} dot={false} /><Line dataKey="aiMs" stroke="var(--chart-1)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Incident processing volume" description="Incidents triaged per hour">
          <div className="h-60"><ResponsiveContainer><BarChart data={monitoringSeries}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="hour" tick={axis} interval={3} axisLine={false} tickLine={false} /><YAxis tick={axis} width={30} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} /><Bar dataKey="volume" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Error rate" description="% of failed requests">
          <div className="h-52"><ResponsiveContainer><AreaChart data={monitoringSeries}><XAxis dataKey="hour" tick={axis} interval={3} axisLine={false} tickLine={false} /><YAxis tick={axis} width={30} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} /><Area dataKey="errors" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Service health">
          <div className="space-y-4">{SERVICES.map((s) => <div key={s.name}><div className="mb-1 flex justify-between text-sm"><span className="flex items-center gap-2"><span className={s.tone === "success" ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} />{s.name}</span><span className="font-mono text-xs">{s.up}%</span></div><Meter value={s.up} tone={s.tone} /></div>)}</div>
        </Panel>
        <Panel title="Safety & guardrail events">
          <div className="divide-y">{GUARDRAILS.map((g) => <div key={g.t} className="flex items-center gap-3 py-2.5 text-sm"><ShieldAlert className="size-4 text-critical" /><div className="flex-1"><p className="font-medium">{g.t}</p><p className="text-xs text-muted-foreground">{g.src}</p></div><span className="font-mono text-xs text-muted-foreground">{g.at}</span></div>)}</div>
        </Panel>
        <Panel title="Business outcomes" description="Impact since AI triage launch">
          <div className="grid grid-cols-2 gap-3">
            {[["−62%", "Mean time to route"], ["−38%", "Mean time to resolve"], ["412", "Staff hours saved / month"], ["4.6 / 5", "Reporter satisfaction"]].map(([v, l]) => <div key={l} className="rounded-xl bg-muted/60 p-4"><p className="text-2xl font-bold text-primary">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>)}
          </div>
        </Panel>
      </div>
    </>
  );
}
