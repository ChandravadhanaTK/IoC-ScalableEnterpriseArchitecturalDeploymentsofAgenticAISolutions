import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/StatusBadge";
import { fetchRuns, AGENT_LABEL } from "@/lib/monitoring";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/monitoring/traces/")({
  head: () => pageMeta("Agent Traces", "Every recorded agent execution with trace ID, state, duration and token usage."),
  component: () => <AppShell><Traces /></AppShell>,
});

function Traces() {
  const { data, isLoading } = useQuery({ queryKey: ["runs"], queryFn: fetchRuns });
  return (
    <>
      <PageHeader eyebrow="Observability" title="Agent executions" desc="Raw execution log. Click a trace ID to see the full orchestrated flow." />
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !data?.length ? <EmptyState hint="Analyze a meeting to produce the first trace." /> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left"><tr>{["Timestamp", "Trace ID", "Agent", "Step", "State", "Result", "Time", "Tokens"].map((h) => <th key={h} className="eyebrow px-3 py-2.5 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2"><Link to="/monitoring/traces/$traceId" params={{ traceId: r.trace_id }} className="font-mono text-xs text-primary hover:underline">{r.trace_id.slice(0, 8)}</Link></td>
                  <td className="px-3 py-2">{AGENT_LABEL[r.agent] ?? r.agent}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.step}</td>
                  <td className="px-3 py-2"><StatusBadge value={r.state} /></td>
                  <td className="px-3 py-2 text-xs">{r.success === null ? "—" : r.success ? <span className="text-success">success</span> : <span className="text-danger">failure</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.duration_ms != null ? `${r.duration_ms} ms` : "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.input_tokens != null ? `${r.input_tokens} / ${r.output_tokens ?? 0}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
