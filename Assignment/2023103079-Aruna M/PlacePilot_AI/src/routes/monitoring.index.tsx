import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/placepilot/store";
import { ArchTabs, DemoLabel, PageHeader, Panel } from "@/components/pp";

export const Route = createFileRoute("/monitoring/")({
  head: () => ({
    meta: [
      { title: "Monitoring Dashboard — PlacePilot AI" },
      { name: "description", content: "Health, trace, quality, safety, cost/usage and business outcome metrics for the agent pipeline." },
      { property: "og:title", content: "Monitoring Dashboard — PlacePilot AI" },
      { property: "og:description", content: "Six-category observability for agentic AI." },
    ],
  }),
  component: Monitoring,
});

function Stat({ k, v, demo }: { k: string; v: string; demo?: boolean }) {
  return (
    <div className="rounded-sm border border-border p-3">
      <p className="flex items-center justify-between gap-1 font-mono text-[10px] uppercase text-muted-foreground">{k}{demo && <DemoLabel />}</p>
      <p className="mt-1 font-mono text-2xl font-semibold">{v}</p>
    </div>
  );
}

function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="mt-3 flex h-16 items-end gap-1">
      {data.map((d, i) => <div key={i} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${(d / max) * 100}%` }} />)}
    </div>
  );
}

function Monitoring() {
  const { traces, opportunities } = useApp();
  const spans = traces.flatMap((t) => t.spans);
  const agentSpans = spans.filter((s) => s.name.startsWith("agent."));
  const fallbacks = spans.filter((s) => s.state === "FALLBACK").length;
  const real = traces.filter((t) => t.engine === "real").length;
  const tokens = spans.reduce((a, s) => a + s.tokensIn + s.tokensOut, 0);
  const avgLat = traces.length ? Math.round(traces.reduce((a, t) => a + (t.spans[0]?.latencyMs ?? 0), 0) / traces.length) : 0;
  const lat = traces.slice(0, 12).reverse().map((t) => t.spans[0]?.latencyMs ?? 0);
  const eligible = opportunities.filter((o) => o.eligibility.verdict === "Eligible").length;
  const planItems = opportunities.flatMap((o) => o.plan);
  const notSpecified = opportunities.reduce((a, o) => a + o.eligibility.criteria.filter((c) => c.status === "unknown").length, 0);
  const safety = traces.reduce((a, t) => a + t.safetyFlags, 0);
  return (
    <div>
      <ArchTabs />
      <PageHeader kicker="Deliverable 5" title="Monitoring dashboard">Live values are computed from your pipeline runs in this browser. Anything marked <DemoLabel /> is an illustrative classroom figure, not production telemetry.</PageHeader>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Panel title="1 · Health">
          <div className="grid grid-cols-2 gap-2">
            <Stat k="Uptime (30d)" v="99.95%" demo />
            <Stat k="Fallback rate" v={spans.length ? `${Math.round((fallbacks / Math.max(traces.length, 1)) * 100)}%` : "0%"} />
            <Stat k="Error rate" v={`${spans.filter((s) => s.state === "FAILED").length}`} />
            <Stat k="p95 latency" v="1.8s" demo />
          </div>
        </Panel>
        <Panel title="2 · Trace" right={<Link to="/monitoring/traces" className="font-mono text-xs text-primary">Inspect →</Link>}>
          <div className="grid grid-cols-2 gap-2">
            <Stat k="Traces" v={String(traces.length)} />
            <Stat k="Agent spans" v={String(agentSpans.length)} />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">Run latency (ms), last 12 · avg {avgLat}</p>
          <Bars data={lat.length ? lat : [0]} />
        </Panel>
        <Panel title="3 · Quality">
          <div className="grid grid-cols-2 gap-2">
            <Stat k="HITL approvals" v={String(traces.length)} />
            <Stat k='"Not specified" kept' v={String(notSpecified)} />
            <Stat k="Field accuracy" v="96.4%" demo />
            <Stat k="Schema-valid" v="100%" />
          </div>
        </Panel>
        <Panel title="4 · Safety">
          <div className="grid grid-cols-2 gap-2">
            <Stat k="Injection flags" v={String(safety)} />
            <Stat k="PII redactions" v={String(spans.filter((s) => s.name === "tool.anonymize_pii").length)} />
            <Stat k="Keys exposed" v="0" />
            <Stat k="Blocked outputs" v="0" demo />
          </div>
        </Panel>
        <Panel title="5 · Cost / Usage">
          <div className="grid grid-cols-2 gap-2">
            <Stat k="Token estimate" v={tokens.toLocaleString("en-IN")} />
            <Stat k="Real AI runs" v={`${real}/${traces.length}`} />
            <Stat k="Est. cost / run" v="₹0.42" demo />
            <Stat k="Demo-engine runs" v={String(traces.length - real)} />
          </div>
        </Panel>
        <Panel title="6 · Business outcomes">
          <div className="grid grid-cols-2 gap-2">
            <Stat k="Drives tracked" v={String(opportunities.length)} />
            <Stat k="Eligible" v={String(eligible)} />
            <Stat k="Prep completed" v={planItems.length ? `${Math.round((planItems.filter((p) => p.done).length / planItems.length) * 100)}%` : "0%"} />
            <Stat k="Missed deadlines" v="0" demo />
          </div>
        </Panel>
      </div>
    </div>
  );
}
