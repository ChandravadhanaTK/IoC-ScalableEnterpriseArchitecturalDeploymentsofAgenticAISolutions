import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Activity, Gauge, ShieldCheck, DollarSign, Heart, Waypoints } from "lucide-react";
import { Panel, Stat, PageHead } from "./shared";

const latency = [
  { agent: "Scout", p50: 420, p95: 910 },
  { agent: "Compliance", p50: 680, p95: 1350 },
  { agent: "Architect", p50: 2100, p95: 3900 },
  { agent: "Auditor", p50: 240, p95: 480 },
];
const trace = [
  { name: "Input Guardrails", start: 0, dur: 38 },
  { name: "PII Redaction", start: 38, dur: 52 },
  { name: "Vector Search", start: 90, dur: 184 },
  { name: "Scout LLM", start: 274, dur: 410 },
  { name: "Compliance LLM", start: 684, dur: 640 },
  { name: "RAG Retrieval", start: 1324, dur: 412 },
  { name: "Architect LLM", start: 1736, dur: 2104 },
  { name: "Citation Verify", start: 3840, dur: 288 },
  { name: "Python Sandbox", start: 4128, dur: 212 },
  { name: "Output Guardrail", start: 4340, dur: 61 },
];
const traceTotal = 4401;
const tokens = [
  { name: "Scout", value: 412 + 380 },
  { name: "Compliance", value: 1830 },
  { name: "Architect", value: 6200 },
  { name: "Auditor", value: 140 },
];
const burn = Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, spend: Math.round(18 + i * 1.6 + (i % 4) * 4), budget: 50 }));
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const tt = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };

export function MonitoringTab() {
  return (
    <div>
      <PageHead kicker="Deliverable 5" title="Executive & SRE Observability" desc="Health, traces, quality, safety, cost and social impact — one pane." />

      <Panel title="1 · System Health" icon={<Activity className="size-4" />}>
        <div className="grid gap-3 md:grid-cols-4">
          <Stat label="Uptime" value="99.98%" sub="30-day SLO 99.9%" />
          <Stat label="Active Worker Pods" value="7" sub="KEDA · 2–25" tone="info" />
          <Stat label="Error Rate" value="0.12%" sub="budget 0.5%" tone="warning" />
          <Stat label="Req / min" value="184" tone="muted" />
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer><BarChart data={latency}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="agent" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} unit="ms" /><Tooltip {...tt} /><Legend /><Bar dataKey="p50" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /><Bar dataKey="p95" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="2 · Distributed Trace Explorer · run 7f3a…c21" icon={<Waypoints className="size-4" />} className="mt-5">
        <div className="space-y-1.5">
          {trace.map((s, i) => (
            <div key={s.name} className="group grid grid-cols-[140px_1fr_60px] items-center gap-3 text-xs">
              <span className="truncate text-muted-foreground">{s.name}</span>
              <div className="relative h-5 rounded bg-muted/40">
                <div className="absolute h-5 rounded transition-all group-hover:brightness-125" style={{ left: `${(s.start / traceTotal) * 100}%`, width: `${Math.max(0.8, (s.dur / traceTotal) * 100)}%`, background: COLORS[i % 4] }} />
              </div>
              <span className="text-right font-mono">{s.dur}ms</span>
            </div>
          ))}
          <div className="pt-2 text-right font-mono text-xs text-muted-foreground">total {traceTotal}ms</div>
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="3 · Quality Metrics" icon={<Gauge className="size-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="RAG Faithfulness" value="96.2%" />
            <Stat label="Answer Relevance" value="94.8%" />
            <Stat label="Citation Accuracy" value="97.5%" tone="info" />
            <Stat label="Budget Math Pass" value="100%" />
          </div>
        </Panel>
        <Panel title="4 · Safety & Guardrails" icon={<ShieldCheck className="size-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Prompt Injections Blocked" value="37" tone="danger" />
            <Stat label="PII Tokens Redacted" value="1,420" tone="warning" />
            <Stat label="Compliance Halts" value="11" tone="danger" />
            <Stat label="Hallucination Retries" value="23" tone="info" />
          </div>
        </Panel>
      </div>

      <Panel title="5 · Cost Telemetry" icon={<DollarSign className="size-4" />} className="mt-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr_200px]">
          <div className="h-56"><ResponsiveContainer><PieChart><Pie data={tokens} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>{tokens.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip {...tt} /><Legend /></PieChart></ResponsiveContainer></div>
          <div className="h-56"><ResponsiveContainer><LineChart data={burn}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} unit="$" /><Tooltip {...tt} /><Line dataKey="spend" stroke="var(--chart-1)" strokeWidth={2} dot={false} /><Line dataKey="budget" stroke="var(--chart-5)" strokeDasharray="4 4" dot={false} /></LineChart></ResponsiveContainer></div>
          <div className="space-y-3"><Stat label="Avg cost / proposal" value="$0.38" /><Stat label="Tokens / proposal" value="8.6K" tone="info" /></div>
        </div>
      </Panel>

      <Panel title="6 · Business Outcomes · Social Impact" icon={<Heart className="size-4" />} className="mt-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Stat label="Grants Audited" value="342" />
          <Stat label="Avg Time Saved" value="18.4 hrs" sub="per proposal" tone="info" />
          <Stat label="Compliance Pass Rate" value="98.5%" />
          <Stat label="CSR Funding Unlocked" value="$4.2M" tone="warning" />
        </div>
      </Panel>
    </div>
  );
}
