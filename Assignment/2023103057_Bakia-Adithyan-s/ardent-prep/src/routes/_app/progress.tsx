import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { refreshCoaching } from "@/lib/interview.functions";
import { Button } from "@/components/ui/button";
import { BulletList, CardTitle, EmptyState, ErrorState, GlassCard, LoadingState, Meter, PageHeader, Pill, scoreTone } from "@/components/app/kit";
import { categoryAverages, fmtDate } from "@/lib/stats";

export const Route = createFileRoute("/_app/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Ardent Prep" },
      { name: "description", content: "Score history, category performance, weak areas and personalized coaching." },
      { property: "og:title", content: "Progress — Ardent Prep" },
      { property: "og:description", content: "Score history, category performance, weak areas and personalized coaching." },
    ],
  }),
  component: ProgressPage,
});

const agentLabel: Record<string, string> = {
  interview_planning: "Interview Planning",
  interview_evaluation: "Interview Evaluation",
  coaching_progress: "Coaching & Progress",
};

function ProgressPage() {
  const refresh = useServerFn(refreshCoaching);
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const [iv, ev, rec, runs] = await Promise.all([
        supabase.from("interviews").select("id, target_role, overall_score, completed_at").eq("status", "completed").order("completed_at", { ascending: true }),
        supabase.from("evaluations").select("score, interview_questions(category)"),
        supabase.from("recommendations").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("agent_runs").select("*").order("created_at", { ascending: false }).limit(12),
      ]);
      if (iv.error) throw iv.error;
      return { interviews: iv.data, evals: ev.data ?? [], rec: rec.data, runs: runs.data ?? [] };
    },
  });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message="Could not load progress." onRetry={() => q.refetch()} />;
  const { interviews, evals, rec, runs } = q.data!;
  const cats = categoryAverages(evals.map((e) => ({ score: e.score, category: (e.interview_questions as unknown as { category: string })?.category ?? "Other" })));

  const doRefresh = async () => {
    setBusy(true);
    const r = await refresh();
    setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
    if (!r.data) { toast.info("No data yet — answer some interview questions first."); return; }
    toast.success("Coaching updated");
    q.refetch();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coaching"
        title="Your progress"
        action={
          <Button onClick={doRefresh} disabled={busy || evals.length === 0}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Refresh coaching
          </Button>
        }
      />
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardTitle>Previous interview scores</CardTitle>
          {interviews.length === 0 ? <EmptyState body="Completed interviews will appear here." action={<Button asChild size="sm"><Link to="/interviews/new">Start one</Link></Button>} /> : (
            <div className="mt-4 space-y-3">
              {interviews.map((i) => (
                <Link key={i.id} to="/interviews/$id/report" params={{ id: i.id }} className="block">
                  <div className="flex justify-between text-[12px]">
                    <span className="truncate">{i.target_role} <span className="text-muted-foreground">· {fmtDate(i.completed_at)}</span></span>
                    <span className="font-medium">{Number(i.overall_score ?? 0).toFixed(1)}</span>
                  </div>
                  <div className="mt-1"><Meter value={Number(i.overall_score ?? 0)} tone={scoreTone(Number(i.overall_score))} /></div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
        <GlassCard>
          <CardTitle>Category performance</CardTitle>
          {cats.length === 0 ? <EmptyState /> : (
            <div className="mt-4 space-y-3">
              {cats.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-[11px] text-muted-foreground"><span>{c.category} · {c.count}q</span><span>{c.avg.toFixed(1)}</span></div>
                  <div className="mt-1"><Meter value={c.avg} tone={scoreTone(c.avg)} /></div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>

      {!rec ? (
        <GlassCard><EmptyState body="The Coaching & Progress Agent needs at least one evaluated answer." /></GlassCard>
      ) : (
        <>
          <GlassCard>
            <CardTitle action={<span className="text-[11px] text-muted-foreground">Updated {fmtDate(rec.created_at)}</span>}>Coach's summary</CardTitle>
            <p className="mt-2 text-[13px] leading-relaxed">{rec.summary}</p>
          </GlassCard>
          <section className="grid gap-4 lg:grid-cols-4">
            <GlassCard><CardTitle>Strong areas</CardTitle><div className="mt-3"><BulletList items={rec.strong_areas} tone="success" /></div></GlassCard>
            <GlassCard><CardTitle>Weak areas</CardTitle><div className="mt-3"><BulletList items={rec.weak_areas} tone="warning" /></div></GlassCard>
            <GlassCard><CardTitle>Study topics</CardTitle><div className="mt-3"><BulletList items={rec.study_topics} /></div></GlassCard>
            <GlassCard><CardTitle>Practice</CardTitle><div className="mt-3"><BulletList items={rec.practice} tone="accent" /></div></GlassCard>
          </section>
        </>
      )}

      <GlassCard>
        <CardTitle>Agent activity</CardTitle>
        {runs.length === 0 ? <EmptyState /> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="text-muted-foreground">
                <tr><th className="py-2 font-medium">Agent</th><th className="font-medium">State</th><th className="font-medium">Result</th><th className="font-medium">Duration</th><th className="font-medium">Trace</th><th className="font-medium">Time</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2">{agentLabel[r.agent] ?? r.agent}</td>
                    <td>{r.state}</td>
                    <td><Pill tone={r.success ? "success" : "destructive"}>{r.success ? "Success" : "Failed"}</Pill></td>
                    <td>{(r.duration_ms / 1000).toFixed(1)}s</td>
                    <td className="font-mono text-[11px] text-muted-foreground">{r.trace_id.slice(0, 8)}</td>
                    <td className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
