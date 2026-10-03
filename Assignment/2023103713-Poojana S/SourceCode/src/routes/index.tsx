import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Stat } from "@/components/AppShell";
import { pct, topicStats, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Dashboard", "Your placement prep at a glance: tests, scores, interviews and weak areas."),
  component: Dashboard,
});

function Dashboard() {
  const { results, interviews } = useStore();
  const avg = results.length ? Math.round(results.reduce((s, r) => s + pct(r.score, r.total), 0) / results.length) : 0;
  const stats = topicStats(results);
  const strong = stats.filter((s) => s.accuracy >= 70).slice(0, 3);
  const weak = stats.filter((s) => s.accuracy < 70).slice(-3).reverse();
  const recent = results.slice(-8);
  const days = new Set(results.map((r) => r.date.slice(0, 10))).size;

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
        title="Welcome back"
        sub={results.length ? "Keep the momentum — one mock interview today keeps your prep sharp." : "Take your first quiz to start tracking progress."}
        action={<Link to="/aptitude" className="btn-primary">Resume prep</Link>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total tests" value={results.length} note={`${results.filter((r) => Date.now() - +new Date(r.date) < 7 * 864e5).length} this week`} tone="good" />
        <Stat label="Avg score" value={avg} unit="%" note="across all quizzes" />
        <Stat label="Interviews" value={interviews.length} note="answers reviewed" />
        <Stat label="Active days" value={days} unit="d" note="keep it going" tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display font-semibold">Progress · last {recent.length || 8} tests</h2>
            <span className="font-mono text-[11px] text-muted-foreground">score %</span>
          </div>
          {recent.length ? (
            <div className="flex h-40 items-end gap-3">
              {recent.map((r, i) => (
                <div key={r.id} title={`${r.topic}: ${pct(r.score, r.total)}%`} className="bar-grow flex-1 rounded-t-md bg-primary"
                  style={{ height: `${Math.max(4, pct(r.score, r.total))}%`, opacity: 0.35 + (i / recent.length) * 0.65, animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : <p className="grid h-40 place-items-center text-sm text-muted-foreground">No tests yet.</p>}
        </div>

        <div className="glass p-5">
          <h2 className="mb-4 font-display font-semibold">Areas</h2>
          <p className="label-mono mb-2 !text-good">Strong</p>
          <div className="space-y-2 text-sm">
            {strong.length ? strong.map((s) => <Row key={s.topic} name={s.topic} v={s.accuracy} c="text-good" />) : <p className="text-muted-foreground">—</p>}
          </div>
          <p className="label-mono mb-2 mt-4 !text-weak">Weak</p>
          <div className="space-y-2 text-sm">
            {weak.length ? weak.map((s) => <Row key={s.topic} name={s.topic} v={s.accuracy} c={s.accuracy < 50 ? "text-weak" : "text-warn"} />) : <p className="text-muted-foreground">—</p>}
          </div>
        </div>

        <div className="glass overflow-hidden p-5 lg:col-span-2">
          <h2 className="mb-3 font-display font-semibold">Next: Mock interview</h2>
          <p className="max-w-[52ch] text-pretty text-sm text-muted-foreground">Get a random technical, HR or behavioral question, answer it, and receive instant scoring on clarity, structure and depth.</p>
          <Link to="/interview" className="relative mt-4 grid h-24 place-items-center overflow-hidden rounded-lg border border-border bg-secondary">
            <div className="sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <span className="label-mono !text-primary">Start session →</span>
          </Link>
        </div>

        <div className="glass p-5">
          <h2 className="mb-3 font-display font-semibold">Today's plan</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><span className="text-primary">▸</span> Aptitude: 1 timed quiz</li>
            <li className="flex gap-2"><span className="text-primary">▸</span> {weak[0]?.topic ?? "Data Structures"} drill</li>
            <li className="flex gap-2"><span className="text-muted-foreground">▸</span> Mock interview</li>
            <li className="flex gap-2"><span className="text-muted-foreground">▸</span> Review feedback</li>
          </ul>
        </div>
      </div>
    </>
  );
}

function Row({ name, v, c }: { name: string; v: number; c: string }) {
  return <div className="flex justify-between"><span>{name}</span><span className={c}>{v}%</span></div>;
}
