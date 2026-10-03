import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CardTitle, EmptyState, ErrorState, GlassCard, LoadingState, Meter, PageHeader, Pill, StatusPill, scoreTone } from "@/components/app/kit";
import { categoryAverages, fmtDate } from "@/lib/stats";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ardent Prep" },
      { name: "description", content: "Your interview practice at a glance: scores, progress and recent sessions." },
      { property: "og:title", content: "Dashboard — Ardent Prep" },
      { property: "og:description", content: "Your interview practice at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [iv, ev, pr] = await Promise.all([
        supabase.from("interviews").select("*").order("created_at", { ascending: false }),
        supabase.from("evaluations").select("score, interview_questions(category)"),
        supabase.from("profiles").select("full_name").maybeSingle(),
      ]);
      if (iv.error) throw iv.error;
      if (ev.error) throw ev.error;
      return { interviews: iv.data, evals: ev.data, name: pr.data?.full_name ?? "" };
    },
  });

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message="Could not load your dashboard." onRetry={() => q.refetch()} />;
  const { interviews, evals, name } = q.data!;
  const completed = interviews.filter((i) => i.status === "completed");
  const scored = completed.filter((i) => i.overall_score != null);
  const avg = scored.length ? scored.reduce((s, i) => s + Number(i.overall_score), 0) / scored.length : null;
  const trend = [...scored].reverse().slice(-8);
  const cats = categoryAverages(evals.map((e) => ({ score: e.score, category: (e.interview_questions as unknown as { category: string })?.category ?? "Other" })));
  const active = interviews.find((i) => i.status === "in_progress" || i.status === "awaiting_approval");
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={today}
        title={`${greet}${name ? `, ${name.split(" ")[0]}` : ""}.`}
        action={
          <Button asChild>
            <Link to="/interviews/new">Create interview</Link>
          </Button>
        }
      />

      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total interviews" value={interviews.length || null} />
        <Stat label="Completed" value={completed.length || null} />
        <GlassCard>
          <p className="text-xs font-medium text-muted-foreground">Average score</p>
          {avg == null ? (
            <p className="mt-3 text-sm text-muted-foreground">No data yet</p>
          ) : (
            <>
              <p className="mt-2 font-display text-4xl font-semibold leading-none tracking-tight">
                {avg.toFixed(1)}
                <span className="text-lg text-muted-foreground">/10</span>
              </p>
              <div className="mt-3">
                <Meter value={avg} tone="accent" />
              </div>
            </>
          )}
        </GlassCard>
        <Stat label="Questions answered" value={evals.length || null} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardTitle>Score trend</CardTitle>
          {trend.length === 0 ? (
            <EmptyState body="Complete an interview to see your score trend." />
          ) : (
            <div className="mt-5 flex h-[140px] items-end gap-2.5">
              {trend.map((t, i) => (
                <div key={t.id} className="group flex h-full flex-1 flex-col justify-end gap-1" title={`${t.target_role}: ${t.overall_score}/10`}>
                  <span className="text-center text-[10px] text-muted-foreground">{Number(t.overall_score).toFixed(1)}</span>
                  <div className="rounded-t-md bg-primary" style={{ height: `${(Number(t.overall_score) / 10) * 100}%`, opacity: 0.25 + (0.75 * (i + 1)) / trend.length }} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
        <GlassCard>
          <CardTitle>Category performance</CardTitle>
          {cats.length === 0 ? (
            <EmptyState body="Answer questions to see category scores." />
          ) : (
            <div className="mt-4 space-y-3">
              {cats.slice(0, 5).map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{c.category}</span>
                    <span>{c.avg.toFixed(1)}/10</span>
                  </div>
                  <div className="mt-1">
                    <Meter value={c.avg} tone={scoreTone(c.avg)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardTitle>Recent interviews</CardTitle>
          {interviews.length === 0 ? (
            <EmptyState body="Create your first mock interview to get started." />
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-border">
              {interviews.slice(0, 6).map((i) => (
                <Link key={i.id} to={linkFor(i.status)} params={{ id: i.id }} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-glass-strong">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.target_role}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {i.interview_type} · {i.difficulty} · {i.num_questions} questions · {fmtDate(i.created_at)}
                    </p>
                  </div>
                  <StatusPill status={i.status} />
                  {i.overall_score != null && <Pill tone={scoreTone(Number(i.overall_score))}>{Number(i.overall_score).toFixed(1)}</Pill>}
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
        <GlassCard>
          <CardTitle>Mock interview</CardTitle>
          {active ? (
            <>
              <div className="mt-2">
                <StatusPill status={active.status} />
              </div>
              <p className="mt-3 text-[13px] leading-snug">{active.target_role}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {active.interview_type} · {active.difficulty}
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to={linkFor(active.status)} params={{ id: active.id }}>
                  {active.status === "in_progress" ? "Continue" : "Review plan"}
                </Link>
              </Button>
            </>
          ) : (
            <EmptyState title="Nothing in progress" body="Start a new mock interview when you're ready." />
          )}
        </GlassCard>
      </section>
    </div>
  );
}

function linkFor(status: string) {
  if (status === "completed") return "/interviews/$id/report" as const;
  if (status === "in_progress") return "/interviews/$id/session" as const;
  return "/interviews/$id/plan" as const;
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <GlassCard>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {value == null ? (
        <p className="mt-3 text-sm text-muted-foreground">No data yet</p>
      ) : (
        <p className="mt-2 font-display text-4xl font-semibold leading-none tracking-tight">{value}</p>
      )}
    </GlassCard>
  );
}
