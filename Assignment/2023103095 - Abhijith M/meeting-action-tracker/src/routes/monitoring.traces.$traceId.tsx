import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { AGENT_LABEL, type Run } from "@/lib/monitoring";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/monitoring/traces/$traceId")({
  head: () => pageMeta("Trace Detail", "Step-by-step execution of one orchestrated agent trace."),
  component: () => <AppShell><TraceDetail /></AppShell>,
});

const ORDER = ["Orchestrator", "MeetingAnalysisAgent", "HumanApproval", "TaskManagementAgent", "ReminderAgent"];

function TraceDetail() {
  const { traceId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["trace", traceId],
    queryFn: async () => ((await supabase.from("agent_runs").select("*").eq("trace_id", traceId).order("created_at")).data ?? []) as Run[],
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <EmptyState title="Trace not found" />;
  const stagesSeen = new Set(data.map((r) => r.agent));
  const total = data.reduce((s, r) => s + (r.duration_ms ?? 0), 0);
  const tokens = data.reduce((s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0);
  const failed = data.some((r) => r.state === "FAILED");

  return (
    <>
      <PageHeader eyebrow="Trace" title={traceId} desc={`${data.length} spans · ${total} ms recorded · ${tokens} tokens`}
        actions={data[0]!.meeting_id ? <Link to="/meetings/$id" params={{ id: data[0]!.meeting_id }} className="text-sm text-primary hover:underline">Open meeting →</Link> : undefined} />
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-4">
        {ORDER.map((a, i) => {
          const rs = data.filter((r) => r.agent === a);
          const st = rs.some((r) => r.state === "FAILED") ? "FAILED" : rs.at(-1)?.state ?? "IDLE";
          return (
            <div key={a} className="flex items-center gap-2">
              <div className={`rounded-md border px-3 py-2 ${stagesSeen.has(a) ? "bg-background" : "opacity-40"}`}>
                <div className="text-xs font-medium">{AGENT_LABEL[a]}</div>
                <StatusBadge value={st} className="mt-1" />
              </div>
              {i < ORDER.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          );
        })}
        <div className="ml-auto"><StatusBadge value={failed ? "FAILED" : data.at(-1)!.state} /></div>
      </div>
      <ol className="relative space-y-3 border-l pl-6">
        {data.map((r) => (
          <li key={r.id} className="relative">
            <span className={`absolute -left-[29px] top-3 size-2.5 rounded-full ${r.state === "FAILED" ? "bg-danger" : r.success ? "bg-success" : "bg-info"}`} />
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{AGENT_LABEL[r.agent] ?? r.agent}</span>
                <span className="font-mono text-xs text-muted-foreground">{r.step}</span>
                <StatusBadge value={r.state} />
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleTimeString()}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted-foreground">
                {r.duration_ms != null && <span>duration {r.duration_ms} ms</span>}
                {r.model && <span>model {r.model}</span>}
                {r.input_tokens != null && <span>tokens in {r.input_tokens} / out {r.output_tokens ?? 0}</span>}
              </div>
              {r.error && <div className="mt-2 rounded bg-danger-soft p-2 text-sm text-danger">{r.error}</div>}
              {r.details && Object.keys(r.details).length > 0 && (
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 font-mono text-[11px]">{JSON.stringify(r.details, null, 2)}</pre>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
