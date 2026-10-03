import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AppShell, Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAnalysis, useLogs, useProfile, useProposals, useResults, useRoadmap } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Pathfinder" }, { name: "description", content: "Your career progress at a glance." }] }),
  component: Dashboard,
});

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 truncate text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Dashboard() {
  const profile = useProfile(), roadmap = useRoadmap(), analysis = useAnalysis(), results = useResults(), proposals = useProposals(), logs = useLogs();
  if (profile.isLoading || roadmap.isLoading) return <AppShell><Loading /></AppShell>;
  const rm = roadmap.data;
  if (!rm) return (
    <AppShell><PageHeader title={`Hi ${profile.data?.full_name?.split(" ")[0] ?? "there"}`} />
      <Empty title="Let's build your roadmap" text="Complete the career assessment and our agents will analyze your goal and plan your path."><Button asChild><Link to="/assessment">Start assessment</Link></Button></Empty>
    </AppShell>
  );
  const done = rm.tasks.filter((t) => t.completed).length;
  const pct = rm.tasks.length ? Math.round((done / rm.tasks.length) * 100) : 0;
  const current = rm.tasks.find((t) => !t.completed);
  const gaps = analysis.data?.gaps ?? [];
  const mastered = gaps.filter((g) => g.current >= g.required).length;
  const pending = proposals.data?.filter((p) => p.status === "pending") ?? [];

  return (
    <AppShell>
      <PageHeader title={`Hi ${profile.data?.full_name?.split(" ")[0] ?? "there"}`} subtitle={`Path to ${profile.data?.target_role} · roadmap v${rm.version}`} action={<Button asChild variant="outline"><Link to="/mentor">Ask your mentor</Link></Button>} />
      {pending.map((p) => (
        <Link key={p.id} to="/adaptive-changes" className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-warning bg-warning/10 p-5">
          <AlertTriangle className="h-6 w-6 shrink-0 text-warning" />
          <div className="flex-1"><p className="font-semibold">Adaptive change awaiting your approval</p><p className="text-sm text-muted-foreground">{p.issue}</p></div>
          <ArrowRight className="h-5 w-5" />
        </Link>
      ))}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Roadmap" value={`${pct}%`} sub={`${done} of ${rm.tasks.length} tasks`} />
        <Stat label="Current phase" value={current ? `${current.phase_index + 1}` : "Done"} sub={current?.phase_title ?? "All phases complete"} />
        <Stat label="Skills mastered" value={`${mastered}/${gaps.length}`} sub={`${gaps.length - mastered} gaps remaining`} />
        <Stat label="Last assessment" value={results.data?.[0] ? `${Math.round((results.data[0].score / results.data[0].total) * 100)}%` : "—"} sub={results.data?.[0]?.skill ?? "None taken yet"} />
      </div>
      <Progress value={pct} className="mt-6 h-3" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Upcoming tasks</h2><Link to="/roadmap" className="text-sm font-semibold text-primary">View roadmap</Link></div>
          <ul className="mt-4 divide-y">
            {rm.tasks.filter((t) => !t.completed).slice(0, 5).map((t) => (
              <li key={t.id} className="py-3"><p className="font-medium">{t.title}</p><p className="text-sm text-muted-foreground">{t.phase_title} · {t.estimated_hours}h · {t.priority}</p></li>
            ))}
            {done === rm.tasks.length && <li className="py-3 text-muted-foreground">Every task is complete. 🎉</li>}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Agent activity</h2><Link to="/progress" className="text-sm font-semibold text-primary">Analyze progress</Link></div>
          <ul className="mt-4 space-y-3 text-sm">
            {logs.data?.slice(0, 7).map((l) => (
              <li key={l.id} className="flex gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${l.status === "error" ? "bg-destructive" : l.status === "running" ? "bg-warning" : "bg-success"}`} />
                <div className="min-w-0"><p><span className="font-semibold">{l.agent}</span> — {l.action}</p><p className="truncate text-muted-foreground">{new Date(l.created_at!).toLocaleString()}{l.detail ? ` · ${l.detail}` : ""}</p></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
