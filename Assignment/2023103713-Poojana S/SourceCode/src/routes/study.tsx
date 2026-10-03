import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { topicStats, useStore } from "@/lib/store";
import { APTITUDE } from "@/lib/questions";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/study")({
  head: () => meta("Study Plan", "Personalised topic recommendations, daily goals and a weekly preparation plan."),
  component: Study,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Study() {
  const { results } = useStore();
  const stats = topicStats(results);
  const weak = stats.filter((s) => s.accuracy < 70).reverse();
  const attempted = new Set(stats.map((s) => s.topic));
  const untried = [...Object.keys(APTITUDE), "Data Structures", "DBMS", "Operating Systems", "Algorithms"].filter((t) => !attempted.has(t));
  const focus = [...weak.map((w) => w.topic), ...untried].slice(0, 7);
  while (focus.length < 7) focus.push(["Data Structures", "Quantitative", "DBMS"][focus.length % 3]!);
  const today = results.filter((r) => r.date.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  return (
    <>
      <PageHeader eyebrow="Track · Study plan" title="Your study plan" sub="Built from your weakest and not-yet-attempted topics." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-5">
          <h2 className="font-display font-semibold">Daily goal</h2>
          <p className="mt-3 font-display text-4xl font-bold">{Math.min(today, 3)}<span className="text-xl text-muted-foreground">/3 quizzes</span></p>
          <div className="mt-3 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, (today / 3) * 100)}%` }} /></div>
          <p className="mt-2 text-sm text-muted-foreground">Plus one mock interview answer.</p>
        </div>
        <div className="glass p-5 lg:col-span-2">
          <h2 className="mb-3 font-display font-semibold">Recommended topics</h2>
          <div className="flex flex-wrap gap-2">
            {weak.map((w) => <span key={w.topic} className="rounded-md bg-weak/15 px-3 py-1.5 text-sm text-weak">{w.topic} · {w.accuracy}%</span>)}
            {untried.map((t) => <span key={t} className="rounded-md bg-secondary px-3 py-1.5 text-sm text-muted-foreground">{t} · not tried</span>)}
          </div>
          <div className="mt-4 flex gap-2"><Link to="/aptitude" className="btn-primary">Practice aptitude</Link><Link to="/technical" className="btn-ghost">Technical MCQs</Link></div>
        </div>
      </div>
      <div className="glass mt-4 p-5">
        <h2 className="mb-4 font-display font-semibold">Weekly preparation plan</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {DAYS.map((d, i) => (
            <div key={d} className="rounded-lg border border-border bg-secondary p-3">
              <p className="label-mono">{d}</p>
              <p className="mt-2 text-sm font-medium">{focus[i]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{i === 6 ? "Full mock test" : i % 2 ? "Quiz + mock answer" : "Timed quiz · 20 min"}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
