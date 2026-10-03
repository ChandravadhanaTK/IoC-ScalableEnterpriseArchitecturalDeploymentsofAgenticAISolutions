import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, RotateCcw, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { analyzeMeeting, reviewActionItems } from "@/lib/agents.functions";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/meetings/$id")({
  head: () => pageMeta("Meeting Details", "Transcript, AI-extracted action items, agent status and approval controls."),
  component: () => <AppShell><MeetingDetail /></AppShell>,
});

const PIPELINE = [
  { key: "MeetingAnalysisAgent", label: "Meeting Analysis" },
  { key: "Validation", label: "Validation" },
  { key: "HumanApproval", label: "Human Approval" },
  { key: "TaskManagementAgent", label: "Task Management" },
  { key: "ReminderAgent", label: "Reminder" },
];

function MeetingDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeMeeting);
  const review = useServerFn(reviewActionItems);
  const [decisions, setDecisions] = useState<Record<string, "APPROVED" | "REJECTED">>({});
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["meeting", id],
    queryFn: async () => {
      const [m, a, t, r, s] = await Promise.all([
        supabase.from("meetings").select("*").eq("id", id).maybeSingle(),
        supabase.from("action_items").select("*").eq("meeting_id", id).order("created_at"),
        supabase.from("tasks").select("*").eq("meeting_id", id).order("created_at"),
        supabase.from("agent_runs").select("*").eq("meeting_id", id).order("created_at"),
        supabase.from("security_events").select("*").eq("meeting_id", id).order("created_at", { ascending: false }),
      ]);
      return { meeting: m.data, items: a.data ?? [], tasks: t.data ?? [], runs: r.data ?? [], security: s.data ?? [] };
    },
    refetchInterval: (query) => {
      const st = query.state.data?.meeting?.agent_state;
      return st === "PROCESSING" || st === "VALIDATING" ? 1200 : false;
    },
  });

  const m = q.data?.meeting;
  const items = q.data?.items ?? [];
  const pending = items.filter((i) => i.review_status === "PENDING");
  useEffect(() => {
    setDecisions((d) => {
      const n = { ...d };
      pending.forEach((i) => { if (!n[i.id]) n[i.id] = "APPROVED"; });
      return n;
    });
  }, [pending.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!m) return <EmptyState title="Meeting not found" hint="It may not exist or you are not authorized to view it." />;

  const latestTrace = q.data!.runs.at(-1)?.trace_id;
  const runsInTrace = q.data!.runs.filter((r) => r.trace_id === latestTrace);

  function stageState(key: string): string {
    if (key === "Validation") {
      const v = runsInTrace.find((r) => r.step === "validation");
      if (v) return "COMPLETED";
      if (m!.agent_state === "VALIDATING") return "VALIDATING";
      return "IDLE";
    }
    if (key === "MeetingAnalysisAgent") {
      const f = runsInTrace.find((r) => r.agent === key && r.state === "FAILED");
      if (f) return "FAILED";
      if (runsInTrace.find((r) => r.agent === key && r.success)) return "COMPLETED";
      return m!.agent_state === "PROCESSING" ? "PROCESSING" : "IDLE";
    }
    if (key === "HumanApproval") {
      if (runsInTrace.find((r) => r.agent === key && r.state === "COMPLETED")) return "COMPLETED";
      return m!.agent_state === "AWAITING_APPROVAL" ? "AWAITING_APPROVAL" : "IDLE";
    }
    const r = [...runsInTrace].reverse().find((x) => x.agent === key);
    return r?.state ?? "IDLE";
  }

  async function retry() {
    setBusy(true);
    qc.setQueryData(["meeting", id], (old: any) => old && { ...old, meeting: { ...old.meeting, agent_state: "PROCESSING" } });
    const p = analyze({ data: { meetingId: id } });
    setTimeout(() => q.refetch(), 400);
    try {
      const r = await p;
      r.ok ? toast.success(`Extracted ${r.count} action item(s)`) : toast.error(`Analysis failed: ${r.error}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    setBusy(false);
    qc.invalidateQueries();
  }

  async function submitReview(all?: "REJECTED") {
    setBusy(true);
    const dec = pending.map((i) => [i.id, all ?? decisions[i.id] ?? "APPROVED"] as const);
    try {
      const r = await review({ data: {
        meetingId: id,
        approvedIds: dec.filter(([, d]) => d === "APPROVED").map(([i]) => i),
        rejectedIds: dec.filter(([, d]) => d === "REJECTED").map(([i]) => i),
      } });
      r.ok ? toast.success(`${r.createdTasks} task(s) created · ${r.reminder.created} reminder(s) issued`) : toast.error(r.error);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    setBusy(false);
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader eyebrow={`Meeting · ${m.meeting_date}`} title={m.title} desc={m.participants ? `Participants: ${m.participants}` : undefined}
        actions={<>
          {latestTrace && <Button variant="outline" asChild><Link to="/monitoring/traces/$traceId" params={{ traceId: latestTrace }}>View trace</Link></Button>}
          {(m.agent_state === "FAILED" || m.agent_state === "IDLE") && <Button onClick={retry} disabled={busy}><RotateCcw className="size-4" /> {m.agent_state === "FAILED" ? "Retry analysis" : "Analyze"}</Button>}
        </>} />

      {/* Agent pipeline */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between"><div className="eyebrow">Agent pipeline</div><StatusBadge value={m.agent_state} /></div>
        <div className="grid gap-2 sm:grid-cols-5">
          {PIPELINE.map((p, i) => {
            const s = stageState(p.key);
            return (
              <div key={p.key} className="relative rounded-md border bg-background p-3">
                <div className="font-mono text-[10px] text-muted-foreground">0{i + 1}</div>
                <div className="text-sm font-medium">{p.label}</div>
                <StatusBadge value={s} className="mt-2" />
              </div>
            );
          })}
        </div>
        {m.agent_state === "FAILED" && m.last_error && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div><b>Agent execution failed.</b> {m.last_error} No data was fabricated — fix the cause or retry.</div>
          </div>
        )}
        {q.data!.security.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-warning-soft p-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div><b>{q.data!.security.length} prompt-injection pattern(s) detected</b> in the transcript and logged as security events. The transcript was processed strictly as data.</div>
          </div>
        )}
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Action items ({items.length})</TabsTrigger>
          <TabsTrigger value="tasks">Created tasks ({q.data!.tasks.length})</TabsTrigger>
          <TabsTrigger value="transcript">Original transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          {items.length === 0 ? (
            <EmptyState title={m.agent_state === "PROCESSING" || m.agent_state === "VALIDATING" ? "Agent is analyzing the transcript…" : "No action items"} hint={m.agent_state === "COMPLETED" ? "The agent found no grounded action items." : undefined} />
          ) : (
            <div className="space-y-3">
              {items.map((it) => {
                const dec = it.review_status === "PENDING" ? decisions[it.id] : it.review_status;
                return (
                  <div key={it.id} className={`rounded-lg border bg-card p-4 ${dec === "REJECTED" ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{it.title}</div>
                        <div className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                          <div><span className="eyebrow">Owner </span>{it.owner ?? <i className="text-muted-foreground">Not specified</i>}</div>
                          <div><span className="eyebrow">Deadline </span>{it.deadline_text ?? <i className="text-muted-foreground">Not specified</i>}{it.deadline_date && <span className="font-mono text-xs text-muted-foreground"> ({it.deadline_date})</span>}</div>
                          <div><span className="eyebrow">Priority </span><StatusBadge value={it.priority} /></div>
                        </div>
                        {it.context && <p className="mt-2 text-sm text-muted-foreground">{it.context}</p>}
                        {it.source_text && <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 font-mono text-xs text-muted-foreground">“{it.source_text}”</blockquote>}
                      </div>
                      {it.review_status === "PENDING" && m.agent_state === "AWAITING_APPROVAL" ? (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant={dec === "APPROVED" ? "default" : "outline"} onClick={() => setDecisions({ ...decisions, [it.id]: "APPROVED" })}><Check className="size-3.5" /> Approve</Button>
                          <Button size="sm" variant={dec === "REJECTED" ? "destructive" : "outline"} onClick={() => setDecisions({ ...decisions, [it.id]: "REJECTED" })}><X className="size-3.5" /> Reject</Button>
                        </div>
                      ) : <StatusBadge value={it.review_status} />}
                    </div>
                  </div>
                );
              })}
              {m.agent_state === "AWAITING_APPROVAL" && pending.length > 0 && (
                <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-lg">
                  <div className="text-sm"><b>Human-in-the-loop:</b> {Object.values(decisions).filter((d) => d === "APPROVED").length} approved · {Object.values(decisions).filter((d) => d === "REJECTED").length} rejected. Tasks are only created after you confirm.</div>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={busy} onClick={() => submitReview("REJECTED")}>Reject all</Button>
                    <Button disabled={busy} onClick={() => submitReview()}>{busy ? "Running agents…" : "Confirm & create tasks"}</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          {q.data!.tasks.length === 0 ? <EmptyState title="No tasks yet" hint="Tasks are created by the Task Management Agent after approval." /> : (
            <div className="divide-y rounded-lg border bg-card">
              {q.data!.tasks.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="flex-1 font-medium">{t.title}</span>
                  <span className="text-muted-foreground">{t.owner ?? "Unassigned"}</span>
                  <span className="font-mono text-xs text-muted-foreground">{t.deadline ?? t.deadline_text ?? "No deadline"}</span>
                  <StatusBadge value={t.priority} /><StatusBadge value={t.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transcript" className="mt-4">
          <pre className="whitespace-pre-wrap rounded-lg border bg-card p-5 font-mono text-sm leading-relaxed">{m.transcript}</pre>
        </TabsContent>
      </Tabs>
    </>
  );
}
