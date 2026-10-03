import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeInterview, submitAnswer } from "@/lib/interview.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BulletList, ErrorState, GlassCard, LoadingState, Meter, PageHeader, Pill, scoreTone } from "@/components/app/kit";

export const Route = createFileRoute("/_app/interviews/$id/session")({
  head: () => ({
    meta: [
      { title: "Mock interview — Ardent Prep" },
      { name: "description", content: "Answer one question at a time and get instant AI evaluation." },
      { property: "og:title", content: "Mock interview — Ardent Prep" },
      { property: "og:description", content: "Answer one question at a time and get instant AI evaluation." },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const submit = useServerFn(submitAnswer);
  const complete = useServerFn(completeInterview);
  const [idx, setIdx] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState<"submit" | "finish" | null>(null);

  const q = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const [iv, qs, ev, ans] = await Promise.all([
        supabase.from("interviews").select("*").eq("id", id).single(),
        supabase.from("interview_questions").select("*").eq("interview_id", id).order("position"),
        supabase.from("evaluations").select("*").eq("interview_id", id),
        supabase.from("answers").select("question_id, answer_text").eq("interview_id", id),
      ]);
      if (iv.error) throw iv.error;
      return { interview: iv.data, questions: qs.data ?? [], evals: ev.data ?? [], answers: ans.data ?? [] };
    },
  });

  useEffect(() => {
    if (q.data && idx === null) {
      const first = q.data.questions.findIndex((x) => !q.data!.evals.some((e) => e.question_id === x.id));
      setIdx(first === -1 ? Math.max(0, q.data.questions.length - 1) : first);
    }
  }, [q.data, idx]);

  if (q.isLoading || idx === null) return <LoadingState />;
  if (q.error) return <ErrorState message="Interview not found." />;
  const { interview, questions, evals, answers } = q.data!;

  if (interview.status !== "in_progress") {
    return (
      <GlassCard className="mx-auto mt-10 max-w-lg text-center">
        <p className="text-sm">{interview.status === "completed" ? "This interview is complete." : "Approve the interview plan before starting."}</p>
        <Button asChild className="mt-4">
          <Link to={interview.status === "completed" ? "/interviews/$id/report" : "/interviews/$id/plan"} params={{ id }}>
            {interview.status === "completed" ? "View report" : "Review plan"}
          </Link>
        </Button>
      </GlassCard>
    );
  }

  const cur = questions[idx];
  if (!cur) return <ErrorState message="This interview has no questions." />;
  const ev = evals.find((e) => e.question_id === cur.id);
  const prevAnswer = answers.find((a) => a.question_id === cur.id)?.answer_text;
  const answered = evals.length;
  const runningAvg = answered ? evals.reduce((s, e) => s + e.score, 0) / answered : null;
  const isLast = idx === questions.length - 1;

  const onSubmit = async () => {
    setBusy("submit");
    const r = await submit({ data: { questionId: cur.id, answer } });
    setBusy(null);
    if (!r.ok) { toast.error(r.error); return; }
    setAnswer("");
    q.refetch();
  };

  const finish = async () => {
    setBusy("finish");
    const r = await complete({ data: { interviewId: id } });
    setBusy(null);
    if (!r.ok) { toast.error(r.error); return; }
    if (r.data.coachingError) toast.warning("Report saved, but coaching recommendations failed. You can refresh them on the Progress page.");
    qc.invalidateQueries();
    navigate({ to: "/interviews/$id/report", params: { id } });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Step 3 · Mock interview"
        title={interview.target_role}
        action={
          <Button variant="outline" onClick={finish} disabled={!!busy || answered === 0}>
            {busy === "finish" ? <><Loader2 className="size-4 animate-spin" /> Generating report…</> : "Finish & get report"}
          </Button>
        }
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">Question {idx + 1} of {questions.length}</Pill>
            <Pill tone="muted">{cur.category}</Pill>
            <Pill tone="muted">{cur.difficulty}</Pill>
          </div>
          <p className="font-display text-xl leading-snug text-pretty">{cur.question}</p>
          {ev ? (
            <div className="rounded-xl bg-glass-strong p-4 text-[13px] text-muted-foreground ring-1 ring-border">
              <span className="font-medium text-foreground">Your answer: </span>
              {prevAnswer}
            </div>
          ) : (
            <>
              <Textarea rows={9} value={answer} maxLength={8000} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer as you would say it in the interview…" disabled={busy === "submit"} />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{answer.length}/8000</span>
                <Button onClick={onSubmit} disabled={!answer.trim() || !!busy}>
                  {busy === "submit" ? <><Loader2 className="size-4 animate-spin" /> Evaluating…</> : "Submit answer"}
                </Button>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-border pt-4">
            <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</Button>
            {isLast ? (
              <Button onClick={finish} disabled={!!busy || answered === 0}>Finish interview</Button>
            ) : (
              <Button onClick={() => setIdx(idx + 1)} disabled={!ev}>Next question</Button>
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <p className="text-sm font-medium">Progress</p>
            <div className="mt-3"><Meter value={answered} max={questions.length} /></div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {answered} of {questions.length} answered{runningAvg != null && ` · avg ${runningAvg.toFixed(1)}`}
            </p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-medium">Evaluation</p>
            {busy === "submit" ? (
              <LoadingState label="Evaluation Agent is reviewing…" />
            ) : ev ? (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="font-display text-5xl font-semibold leading-none">{ev.score}<span className="text-lg text-muted-foreground">/10</span></p>
                  <div className="mt-3"><Meter value={ev.score} tone={scoreTone(ev.score)} /></div>
                </div>
                <div><p className="mb-1.5 text-xs font-medium text-muted-foreground">Strengths</p><BulletList items={ev.strengths} tone="success" /></div>
                <div><p className="mb-1.5 text-xs font-medium text-muted-foreground">Weaknesses</p><BulletList items={ev.weaknesses} tone="warning" /></div>
                <div><p className="mb-1.5 text-xs font-medium text-muted-foreground">Feedback</p><p className="text-[13px] leading-snug">{ev.feedback}</p></div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Submit your answer to receive a score and feedback.</p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
