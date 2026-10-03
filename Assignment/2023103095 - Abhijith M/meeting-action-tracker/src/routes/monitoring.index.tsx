import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, GitBranch, Gauge, ShieldAlert, Coins, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { fetchRuns, groupTraces, AGENT_LABEL } from "@/lib/monitoring";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/monitoring/")({
  head: () => pageMeta("Monitoring", "Health, trace, quality, safety, cost and business-outcome metrics from real agent executions."),
  component: () => <AppShell><Monitoring /></AppShell>,
});

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return <div><div className="eyebrow">{label}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>{sub && <div className="text-xs text-muted-foreground">{sub}</div>}</div>;
}

function Panel({ icon: Icon, title, children, empty }: { icon: any; title: string; children: React.ReactNode; empty: boolean }) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3"><Icon className="size-4 text-primary" /><h2 className="font-medium">{title}</h2></div>
      <div className="p-4">{empty ? <EmptyState /> : children}</div>
    </section>
  );
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

function Monitoring() {
  const q = useQuery({
    queryKey: ["monitoring"],
    queryFn: async () => {
      const [runs, items, tasks, sec] = await Promise.all([
        fetchRuns(),
        supabase.from("action_items").select("review_status"),
        supabase.from("tasks").select("status"),
        supabase.from("security_events").select("*").order("created_at", { ascending: false }),
      ]);
      return { runs, items: items.data ?? [], tasks: tasks.data ?? [], sec: sec.data ?? [] };
    },
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const { runs, items, tasks, sec } = q.data!;
  const traces = groupTraces(runs);
  const agentRuns = runs.filter((r) => r.success !== null);
  const agents = ["MeetingAnalysisAgent", "TaskManagementAgent", "ReminderAgent"];
  const llm = runs.filter((r) => r.step === "llm_extraction");
  const llmOk = llm.filter((r) => r.success);
  const val = runs.filter((r) => r.step === "validation");
  const dropped = val.reduce((s, r) => s + (r.details?.dropped?.length ?? 0), 0);
  const accepted = val.reduce((s, r) => s + (r.details?.accepted ?? 0), 0);
  const inTok = llm.reduce((s, r) => s + (r.input_tokens ?? 0), 0);
  const outTok = llm.reduce((s, r) => s + (r.output_tokens ?? 0), 0);
  const avgLat = llmOk.length ? Math.round(llmOk.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / llmOk.length) : 0;
  const reviewed = items.filter((i) => i.review_status !== "PENDING");
  const approved = items.filter((i) => i.review_status === "APPROVED").length;
  const pii = llm.reduce((s, r) => s + (r.details?.pii_masked ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Observability" title="Monitoring" desc="All figures are computed from recorded agent executions. Nothing is simulated."
        actions={<Link to="/monitoring/traces" className="text-sm text-primary hover:underline">All traces →</Link>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={HeartPulse} title="1 · Health" empty={agentRuns.length === 0}>
          <table className="w-full text-sm">
            <thead><tr className="text-left">{["Agent", "Runs", "Success", "Last run"].map((h) => <th key={h} className="eyebrow pb-2 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {agents.map((a) => {
                const rs = agentRuns.filter((r) => r.agent === a);
                const ok = rs.filter((r) => r.success).length;
                return <tr key={a}><td className="py-2">{AGENT_LABEL[a]}</td><td className="font-mono">{rs.length}</td><td className="font-mono">{pct(ok, rs.length)}</td><td className="font-mono text-xs text-muted-foreground">{rs[0] ? new Date(rs[0].created_at).toLocaleString() : "No data yet"}</td></tr>;
              })}
            </tbody>
          </table>
        </Panel>

        <Panel icon={GitBranch} title="2 · Trace" empty={traces.length === 0}>
          <ul className="divide-y text-sm">
            {traces.slice(0, 6).map((t) => (
              <li key={t.traceId} className="flex items-center gap-3 py-2">
                <Link to="/monitoring/traces/$traceId" params={{ traceId: t.traceId }} className="font-mono text-xs text-primary hover:underline">{t.traceId.slice(0, 8)}</Link>
                <span className="flex-1 text-muted-foreground">{t.kind}</span>
                <span className="font-mono text-xs">{t.duration} ms</span>
                <StatusBadge value={t.state} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel icon={Gauge} title="3 · Quality" empty={val.length === 0}>
          <div className="grid grid-cols-3 gap-4">
            <Metric label="Items accepted" value={accepted} sub="passed grounding validation" />
            <Metric label="Items dropped" value={dropped} sub="not grounded in transcript" />
            <Metric label="Human approval rate" value={pct(approved, reviewed.length)} sub={`${reviewed.length} reviewed`} />
          </div>
        </Panel>

        <Panel icon={ShieldAlert} title="4 · Safety" empty={llm.length === 0 && sec.length === 0}>
          <div className="mb-3 grid grid-cols-2 gap-4">
            <Metric label="Injection flags" value={sec.length} />
            <Metric label="PII values masked" value={pii} />
          </div>
          {sec.length > 0 && (
            <ul className="divide-y text-xs">
              {sec.slice(0, 5).map((s) => <li key={s.id} className="py-1.5"><span className="font-mono text-danger">{s.kind}</span> <span className="text-muted-foreground">“{s.snippet}”</span></li>)}
            </ul>
          )}
        </Panel>

        <Panel icon={Coins} title="5 · Cost / Usage" empty={llm.length === 0}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="LLM calls" value={llm.length} sub={`${llm.length - llmOk.length} failed`} />
            <Metric label="Input tokens" value={inTok.toLocaleString()} />
            <Metric label="Output tokens" value={outTok.toLocaleString()} />
            <Metric label="Avg LLM latency" value={avgLat ? `${(avgLat / 1000).toFixed(1)}s` : "—"} />
          </div>
        </Panel>

        <Panel icon={Target} title="6 · Business outcomes" empty={tasks.length === 0}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Tasks created" value={tasks.length} />
            <Metric label="Completed" value={tasks.filter((t) => t.status === "COMPLETED").length} />
            <Metric label="Overdue" value={tasks.filter((t) => t.status === "OVERDUE").length} />
            <Metric label="Completion rate" value={pct(tasks.filter((t) => t.status === "COMPLETED").length, tasks.length)} />
          </div>
        </Panel>
      </div>
    </>
  );
}
