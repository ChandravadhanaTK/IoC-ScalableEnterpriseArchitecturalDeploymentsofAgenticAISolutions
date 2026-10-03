import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Stat } from "@/components/AppShell";
import { pct, topicStats, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/analytics")({
  head: () => meta("Performance Analytics", "Subject-wise accuracy, test history and improvement trends over time."),
  component: Analytics,
});

const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" } };

function Analytics() {
  const { results } = useStore();
  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const correct = results.reduce((s, r) => s + r.score, 0);
  const trend = results.map((r, i) => ({ n: i + 1, score: pct(r.score, r.total) }));
  const subjects = topicStats(results);
  const first = trend.slice(0, 3), last = trend.slice(-3);
  const avg = (a: { score: number }[]) => (a.length ? a.reduce((s, x) => s + x.score, 0) / a.length : 0);
  const improvement = trend.length >= 4 ? Math.round(avg(last) - avg(first)) : 0;

  return (
    <>
      <PageHeader eyebrow="Track · Analytics" title="Performance analytics" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Accuracy" value={pct(correct, totalQ)} unit="%" />
        <Stat label="Questions" value={totalQ} />
        <Stat label="Subjects" value={subjects.length} />
        <Stat label="Improvement" value={`${improvement >= 0 ? "+" : ""}${improvement}`} unit="pts" tone={improvement >= 0 ? "good" : "muted"} note="first 3 vs last 3" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <h2 className="mb-4 font-display font-semibold">Progress over time</h2>
          <div className="h-64">
            <ResponsiveContainer><LineChart data={trend}>
              <CartesianGrid stroke="var(--border)" /><XAxis dataKey="n" stroke="var(--muted-foreground)" /><YAxis domain={[0, 100]} stroke="var(--muted-foreground)" />
              <Tooltip {...tip} /><Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart></ResponsiveContainer>
          </div>
        </div>
        <div className="glass p-5">
          <h2 className="mb-4 font-display font-semibold">Subject-wise accuracy</h2>
          <div className="h-64">
            <ResponsiveContainer><BarChart data={subjects}>
              <CartesianGrid stroke="var(--border)" /><XAxis dataKey="topic" stroke="var(--muted-foreground)" fontSize={11} /><YAxis domain={[0, 100]} stroke="var(--muted-foreground)" />
              <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="accuracy" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="glass mt-4 overflow-x-auto p-5">
        <h2 className="mb-3 font-display font-semibold">Test history</h2>
        <table className="w-full text-left text-sm">
          <thead className="label-mono"><tr><th className="py-2">Date</th><th>Module</th><th>Topic</th><th>Level</th><th>Score</th><th>Time</th></tr></thead>
          <tbody className="divide-y divide-border">
            {results.slice().reverse().map((r) => (
              <tr key={r.id}><td className="py-2">{new Date(r.date).toLocaleDateString()}</td><td>{r.module}</td><td>{r.topic}</td><td>{r.difficulty}</td>
                <td className={pct(r.score, r.total) >= 70 ? "text-good" : "text-warn"}>{r.score}/{r.total}</td><td className="font-mono">{r.seconds}s</td></tr>
            ))}
          </tbody>
        </table>
        {!results.length && <p className="py-4 text-sm text-muted-foreground">No tests yet.</p>}
      </div>
    </>
  );
}
