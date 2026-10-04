import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClinic } from "@/lib/store";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring & Telemetry — CareRoute" },
      { name: "description", content: "Agent performance, clinical safety, operations, cost telemetry and OpenTelemetry trace inspector." },
      { property: "og:title", content: "Live Monitoring & Telemetry — CareRoute" },
      { property: "og:description", content: "Agent performance, clinical safety, operations, cost telemetry and OpenTelemetry trace inspector." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Monitoring,
});

const jitter = (v: number, p = 0.06) => +(v * (1 + (Math.random() - 0.5) * p)).toFixed(v < 10 ? 2 : 0);
const initialSeries = () => Array.from({ length: 20 }, (_, i) => ({ t: i, triage: jitter(1400, 0.3), sched: jitter(820, 0.3), summary: jitter(2600, 0.3) }));

function Monitoring() {
  const { encounters, alerts } = useClinic();
  const [series, setSeries] = useState(initialSeries);
  const [m, setM] = useState({ tps: 4820, tool: 99.2, enc: 1284, conv: 71.4, intake: 3.8, redflag: 6.1, override: 4.3, safety: 37 });

  useEffect(() => {
    const id = setInterval(() => {
      setSeries((s) => [...s.slice(1), { t: s[s.length - 1]!.t + 1, triage: jitter(1400, 0.3), sched: jitter(820, 0.3), summary: jitter(2600, 0.3) }]);
      setM((x) => ({ ...x, tps: jitter(4820, 0.15), tool: Math.min(99.9, jitter(99.2, 0.006)), enc: x.enc + (Math.random() > 0.6 ? 1 : 0), safety: x.safety + (Math.random() > 0.85 ? 1 : 0) }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const p95 = (k: "triage" | "sched" | "summary") => Math.round([...series.map((s) => s[k])].sort((a, b) => a - b)[18] ?? 0);
  const cost = [
    { agent: "Triage", cost: 412 }, { agent: "Scheduling", cost: 96 }, { agent: "Doctor Summary", cost: 538 }, { agent: "Follow-Up", cost: 74 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Live Monitoring & Telemetry</h1>
          <p className="text-sm text-muted-foreground">Health, trace, quality, safety, cost and business outcomes · refreshes every 2s</p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-xs text-routine"><span className="h-2 w-2 animate-pulse rounded-full bg-routine" /> streaming</span>
      </div>

      <Group title="Agent performance">
        <Kpi l="P95 triage latency" v={`${p95("triage")} ms`} />
        <Kpi l="P95 summary latency" v={`${p95("summary")} ms`} />
        <Kpi l="Token throughput" v={`${m.tps.toLocaleString()}/s`} />
        <Kpi l="Tool call success" v={`${m.tool.toFixed(1)}%`} good />
      </Group>
      <Group title="Clinical safety">
        <Kpi l="Red-flag escalation rate" v={`${m.redflag}%`} tone="emergency" />
        <Kpi l="Clinician override rate" v={`${m.override}%`} tone="urgent" />
        <Kpi l="Safety filter triggers (24h)" v={String(m.safety)} />
        <Kpi l="Open staff escalations" v={String(alerts.length)} tone={alerts.length ? "emergency" : undefined} />
      </Group>
      <Group title="Operational">
        <Kpi l="Triaged encounters (30d)" v={(m.enc + encounters.length).toLocaleString()} />
        <Kpi l="Appointment conversion" v={`${m.conv}%`} good />
        <Kpi l="Avg intake duration" v={`${m.intake} min`} />
        <Kpi l="Awaiting clinician review" v={String(encounters.filter((e) => e.status === "Awaiting review").length)} />
      </Group>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Agent response latency (ms)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="t" hide />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Line dataKey="triage" name="Triage" stroke="var(--agent-1)" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line dataKey="sched" name="Scheduling" stroke="var(--agent-2)" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line dataKey="summary" name="Summary" stroke="var(--agent-3)" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Token cost per agent (USD, 30d)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cost}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="agent" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="cost" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Trace inspector · OpenTelemetry spans">
        <TraceTree />
      </Card>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div></section>;
}
function Kpi({ l, v, good, tone }: { l: string; v: string; good?: boolean; tone?: "emergency" | "urgent" | undefined }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{l}</div>
      <div className={cn("mt-1 font-mono text-2xl font-semibold tabular-nums", good && "text-routine", tone === "emergency" && "text-emergency", tone === "urgent" && "text-urgent")}>{v}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-4"><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</section>;
}

type Span = { name: string; ms: number; start: number; attrs?: string; err?: boolean; children?: Span[] };
const TRACE: Span = {
  name: "encounter.intake  trace_id=7f3a…c21", ms: 5240, start: 0, children: [
    { name: "orchestrator.route", ms: 12, start: 0 },
    { name: "triage_agent.turn ×4", ms: 3610, start: 14, children: [
      { name: "phi.deidentify", ms: 38, start: 14, attrs: "entities=3" },
      { name: "llm.chat  model=zdr-endpoint", ms: 1320, start: 54, attrs: "tokens_in=812 tokens_out=96" },
      { name: "guardrail.redflag_scan", ms: 22, start: 1376, attrs: "flags=0" },
      { name: "tool.esi_classify", ms: 41, start: 1400, attrs: "esi=3 conf=0.88" },
    ] },
    { name: "scheduling_agent.book", ms: 1180, start: 3630, children: [
      { name: "fhir.Slot.search", ms: 210, start: 3632, attrs: "specialty=Orthopedics results=6" },
      { name: "payer.eligibility (attempt 1)", ms: 3000, start: 3850, err: true, attrs: "timeout → circuit half-open" },
      { name: "payer.eligibility (attempt 2)", ms: 420, start: 3860, attrs: "status=active" },
      { name: "fhir.Appointment.create", ms: 160, start: 4300, attrs: "status=booked" },
    ] },
    { name: "summary_agent.draft_soap", ms: 380, start: 4820, attrs: "async · queued for HITL" },
  ],
};

function TraceTree() {
  return <div className="font-mono text-xs"><Node s={TRACE} depth={0} total={TRACE.ms} /></div>;
}
function Node({ s, depth, total }: { s: Span; depth: number; total: number }) {
  const [open, setOpen] = useState(depth < 2);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_60px] items-center gap-2 rounded px-1 py-1 text-left hover:bg-muted">
        <span className="flex items-center gap-1 truncate" style={{ paddingLeft: depth * 16 }}>
          {s.children ? <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-90")} /> : <span className="w-3" />}
          <span className={cn(s.err && "text-emergency")}>{s.name}</span>
          {s.attrs && <span className="hidden truncate text-muted-foreground xl:inline">· {s.attrs}</span>}
        </span>
        <span className="relative h-3 rounded bg-muted">
          <span className={cn("absolute h-3 rounded", s.err ? "bg-emergency" : "bg-primary")} style={{ left: `${(s.start / total) * 100}%`, width: `${Math.max((Math.min(s.ms, total - s.start) / total) * 100, 0.8)}%` }} />
        </span>
        <span className="text-right text-muted-foreground">{s.ms}ms</span>
      </button>
      {open && s.children?.map((c) => <Node key={c.name} s={c} depth={depth + 1} total={total} />)}
    </div>
  );
}
