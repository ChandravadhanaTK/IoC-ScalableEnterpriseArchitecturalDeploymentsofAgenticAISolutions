import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell, Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { analyzeProgress, finishAssessment, startAssessment } from "@/lib/agents.functions";
import { errMsg, useAnalysis, useResults, useRoadmap } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress & assessments — Pathfinder" }, { name: "description", content: "Take skill assessments and let the Progress Analysis Agent review your pace." }] }),
  component: ProgressPage,
});

type Quiz = Awaited<ReturnType<typeof startAssessment>>;
type Result = Awaited<ReturnType<typeof finishAssessment>>;
type Report = Awaited<ReturnType<typeof analyzeProgress>>["report"];

function ProgressPage() {
  const roadmap = useRoadmap(), results = useResults(), analysis = useAnalysis();
  const [skill, setSkill] = useState("");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState<null | "start" | "submit" | "analyze">(null);
  const start = useServerFn(startAssessment), finish = useServerFn(finishAssessment), analyze = useServerFn(analyzeProgress);
  const qc = useQueryClient();
  const navigate = useNavigate();

  if (roadmap.isLoading) return <AppShell><Loading /></AppShell>;
  if (!roadmap.data) return <AppShell><PageHeader title="Progress" /><Empty title="No roadmap yet" text="You need a roadmap before tracking progress."><Button asChild><Link to="/assessment">Start assessment</Link></Button></Empty></AppShell>;

  const skills = [...new Set([...(analysis.data?.gaps.map((g) => g.skill) ?? []), ...roadmap.data.tasks.map((t) => t.skill ?? "").filter(Boolean)])];
  const chosen = skill || skills[0] || "";

  const begin = async () => {
    setBusy("start"); setResult(null);
    try { const q = await start({ data: { skill: chosen, difficulty } }); setQuiz(q); setAnswers(Array(q.questions.length).fill(-1)); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };
  const submit = async () => {
    if (!quiz) return;
    if (answers.some((a) => a < 0)) return void toast.error("Please answer every question.");
    setBusy("submit");
    try {
      const r = await finish({ data: { id: quiz.id, answers } });
      setResult(r); setQuiz(null);
      await qc.invalidateQueries();
      if (r.proposalId) toast.warning("The Adaptive Planning Agent proposed a roadmap change for your review.");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };
  const runAnalysis = async () => {
    setBusy("analyze");
    try {
      const r = await analyze(); setReport(r.report); await qc.invalidateQueries();
      if (r.proposalId) toast.warning("A roadmap change was proposed — review it in Adaptive changes.");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  const done = roadmap.data.tasks.filter((t) => t.completed);
  const hours = done.reduce((a, t) => a + (t.estimated_hours ?? 0), 0);

  return (
    <AppShell>
      <PageHeader title="Progress & assessments" subtitle={`${done.length} tasks done · ${hours} hours of learning logged`} action={<Button onClick={runAnalysis} disabled={!!busy}>{busy === "analyze" ? "Analyzing your progress…" : "Run progress analysis"}</Button>} />

      {report && (
        <section className="mb-8 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Progress Analysis Agent report</h2>
          <p className="mt-2 text-muted-foreground">{report.summary}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
            <div><p className="font-semibold text-success">Strong areas</p><ul className="ml-4 list-disc">{report.strong_areas.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div><p className="font-semibold text-destructive">Weak areas</p><ul className="ml-4 list-disc">{report.weak_areas.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div><p className="font-semibold">Delays</p><ul className="ml-4 list-disc">{report.delays.length ? report.delays.map((s) => <li key={s}>{s}</li>) : <li>None detected</li>}</ul></div>
          </div>
          <p className="mt-4 font-semibold">Recommendations</p>
          <ul className="ml-5 list-disc text-sm">{report.recommendations.map((s) => <li key={s}>{s}</li>)}</ul>
          {report.significant_issue && <Button className="mt-4" variant="outline" onClick={() => navigate({ to: "/adaptive-changes" })}>Review proposed change</Button>}
        </section>
      )}

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Skill assessment</h2>
        {!quiz && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm">Skill<select className="mt-1 block h-9 rounded-md border bg-card px-3" value={chosen} onChange={(e) => setSkill(e.target.value)}>{skills.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="text-sm">Difficulty<select className="mt-1 block h-9 rounded-md border bg-card px-3" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>{["Beginner", "Intermediate", "Advanced"].map((s) => <option key={s}>{s}</option>)}</select></label>
            <Button onClick={begin} disabled={!!busy || !chosen}>{busy === "start" ? "Preparing questions…" : "Start assessment"}</Button>
          </div>
        )}
        {quiz && (
          <div className="mt-4 space-y-6">
            <p className="text-sm text-muted-foreground">{quiz.skill} · {quiz.difficulty}</p>
            {quiz.questions.map((q, i) => (
              <fieldset key={i}>
                <legend className="font-medium">{i + 1}. {q.question}</legend>
                <div className="mt-2 grid gap-2">
                  {q.options.map((o, k) => (
                    <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${answers[i] === k ? "border-primary bg-primary/5" : ""}`}>
                      <input type="radio" name={`q${i}`} checked={answers[i] === k} onChange={() => setAnswers(answers.map((a, j) => (j === i ? k : a)))} /> {o}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <div className="flex gap-2"><Button onClick={submit} disabled={busy === "submit"}>{busy === "submit" ? "Scoring & analyzing…" : "Submit answers"}</Button><Button variant="ghost" onClick={() => setQuiz(null)} disabled={busy === "submit"}>Cancel</Button></div>
          </div>
        )}
        {result && (
          <div className="mt-6 rounded-xl bg-muted p-5">
            <p className="font-display text-3xl font-bold">{result.pct}%</p>
            <p className="text-sm text-muted-foreground">{result.score} of {result.total} correct{result.weak.length ? ` · Weak: ${result.weak.join(", ")}` : ""}</p>
            {result.proposalId && <Button className="mt-3" onClick={() => navigate({ to: "/adaptive-changes" })}>Review adaptive proposal</Button>}
            <ul className="mt-4 space-y-2 text-sm">
              {result.review.map((r, i) => <li key={i} className={r.chosen === r.correct ? "text-success" : "text-destructive"}>{r.chosen === r.correct ? "✓" : "✗"} {r.question} — correct: {r.options[r.correct]}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Assessment history</h2>
        {results.data?.length ? (
          <ul className="mt-4 divide-y text-sm">
            {results.data.map((r) => {
              const pct = Math.round((r.score / r.total) * 100);
              return <li key={r.id} className="flex flex-wrap items-center gap-3 py-3"><span className="font-medium">{r.skill}</span><span className="text-muted-foreground">{r.difficulty}</span><span className="text-muted-foreground">{new Date(r.created_at!).toLocaleDateString()}</span><span className={`ml-auto font-semibold ${pct < 60 ? "text-destructive" : "text-success"}`}>{pct}%</span></li>;
            })}
          </ul>
        ) : <p className="mt-2 text-muted-foreground">No assessments yet — take one above.</p>}
      </section>
    </AppShell>
  );
}
