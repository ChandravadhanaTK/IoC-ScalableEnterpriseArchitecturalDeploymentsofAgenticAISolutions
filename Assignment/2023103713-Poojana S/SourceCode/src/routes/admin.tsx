import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Stat } from "@/components/AppShell";
import { APTITUDE, TECHNICAL } from "@/lib/questions";
import { pct, resetAll, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin")({
  head: () => meta("Admin Panel", "Monitor activity, question bank categories and platform performance."),
  component: Admin,
});

function Admin() {
  const { results, interviews } = useStore();
  const avg = results.length ? Math.round(results.reduce((s, r) => s + pct(r.score, r.total), 0) / results.length) : 0;
  const cats = [...Object.entries(APTITUDE).map(([k, v]) => ["Aptitude", k, v.length] as const), ...Object.entries(TECHNICAL).map(([k, v]) => ["Technical", k, v.length] as const)];

  return (
    <>
      <PageHeader eyebrow="Track · Admin" title="Monitoring dashboard" sub="Platform-wide activity. User management and adding questions unlock once accounts are enabled." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active users" value={1} note="this device" />
        <Stat label="Tests completed" value={results.length} />
        <Stat label="Interview sessions" value={interviews.length} />
        <Stat label="Avg performance" value={avg} unit="%" tone="primary" />
      </div>
      <div className="glass overflow-x-auto p-5">
        <h2 className="mb-3 font-display font-semibold">Question bank · {cats.reduce((s, c) => s + c[2], 0)} questions</h2>
        <table className="w-full text-left text-sm">
          <thead className="label-mono"><tr><th className="py-2">Module</th><th>Category</th><th>Questions</th></tr></thead>
          <tbody className="divide-y divide-border">{cats.map(([m, c, n]) => <tr key={c}><td className="py-2">{m}</td><td>{c}</td><td className="font-mono">{n}</td></tr>)}</tbody>
        </table>
      </div>
      <button className="btn-ghost mt-4 !text-weak" onClick={() => confirm("Clear all saved progress?") && resetAll()}>Reset progress data</button>
    </>
  );
}
