import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BulletList, CardTitle, EmptyState, ErrorState, GlassCard, LoadingState, Meter, PageHeader, Pill, scoreTone } from "@/components/app/kit";
import { categoryAverages, fmtDate } from "@/lib/stats";

export const Route = createFileRoute("/_app/interviews/$id/report")({
  head: () => ({
    meta: [
      { title: "Interview report — Ardent Prep" },
      { name: "description", content: "Overall score, category breakdown, feedback and recommended study topics." },
      { property: "og:title", content: "Interview report — Ardent Prep" },
      { property: "og:description", content: "Overall score, category breakdown, feedback and recommended study topics." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const [iv, qs, ev, rec] = await Promise.all([
        supabase.from("interviews").select("*").eq("id", id).single(),
        supabase.from("interview_questions").select("*").eq("interview_id", id).order("position"),
        supabase.from("evaluations").select("*").eq("interview_id", id),
        supabase.from("recommendations").select("*").eq("interview_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (iv.error) throw iv.error;
      return { interview: iv.data, questions: qs.data ?? [], evals: ev.data ?? [], rec: rec.data };
    },
  });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message="Report not found." />;
  const { interview, questions, evals, rec } = q.data!;
  const rows = questions.map((qq) => ({ q: qq, e: evals.find((e) => e.question_id === qq.id) })).filter((r) => r.e);
  const cats = categoryAverages(rows.map((r) => ({ score: r.e!.score, category: r.q.category })));
  const strengths = [...new Set(evals.flatMap((e) => e.strengths))].slice(0, 6);
  const weaknesses = [...new Set(evals.flatMap((e) => e.weaknesses))].slice(0, 6);
  const overall = interview.overall_score != null ? Number(interview.overall_score) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={`Report · ${fmtDate(interview.completed_at ?? interview.created_at)}`}
        title={interview.target_role}
        sub={`${interview.interview_type} · ${interview.difficulty} · ${rows.length} of ${questions.length} questions answered`}
        action={<Button asChild><Link to="/interviews/new">New interview</Link></Button>}
      />
      {interview.status !== "completed" && (
        <GlassCard className="mt-4 text-sm">This interview isn't finished yet. <Link to="/interviews/$id/session" params={{ id }} className="font-medium text-primary">Continue</Link></GlassCard>
      )}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <p className="text-xs font-medium text-muted-foreground">Overall score</p>
          {overall == null ? <p className="mt-3 text-sm text-muted-foreground">No data yet</p> : (
            <>
              <p className="mt-2 font-display text-5xl font-semibold leading-none">{overall.toFixed(1)}<span className="text-lg text-muted-foreground">/10</span></p>
              <div className="mt-3"><Meter value={overall} tone={scoreTone(overall)} /></div>
            </>
          )}
        </GlassCard>
        <GlassCard className="lg:col-span-2">
          <CardTitle>Category scores</CardTitle>
          {cats.length === 0 ? <EmptyState /> : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {cats.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-[11px] text-muted-foreground"><span>{c.category} · {c.count}q</span><span>{c.avg.toFixed(1)}/10</span></div>
                  <div className="mt-1"><Meter value={c.avg} tone={scoreTone(c.avg)} /></div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <GlassCard><CardTitle>Strengths</CardTitle><div className="mt-3"><BulletList items={strengths} tone="success" empty="No data yet" /></div></GlassCard>
        <GlassCard><CardTitle>Weaknesses</CardTitle><div className="mt-3"><BulletList items={weaknesses} tone="warning" empty="No data yet" /></div></GlassCard>
        <GlassCard>
          <CardTitle>Recommended study topics</CardTitle>
          <div className="mt-3">
            {rec ? <BulletList items={rec.study_topics} /> : <p className="text-xs text-muted-foreground">No data yet — see the Progress page to generate coaching.</p>}
          </div>
        </GlassCard>
      </section>

      {rec?.summary && <GlassCard><CardTitle>Coach's summary</CardTitle><p className="mt-2 text-[13px] leading-relaxed">{rec.summary}</p></GlassCard>}

      <GlassCard>
        <CardTitle>Question feedback</CardTitle>
        {rows.length === 0 ? <EmptyState /> : (
          <div className="mt-3 divide-y divide-border">
            {rows.map(({ q: qq, e }, i) => (
              <div key={qq.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium">{i + 1}. {qq.question}</p>
                  <Pill tone={scoreTone(e!.score)}>{e!.score}/10</Pill>
                </div>
                <div className="mt-1 flex gap-2"><Pill tone="muted">{qq.category}</Pill><Pill tone="muted">{qq.difficulty}</Pill></div>
                <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{e!.feedback}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
