import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReminderOnMount } from "@/hooks/useReminder";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => pageMeta("Dashboard", "Overview of meetings, action items, tasks and upcoming deadlines."),
  component: () => <AppShell><Dashboard /></AppShell>,
});

function Dashboard() {
  const { user } = useAuth();
  useReminderOnMount();
  const q = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const [m, a, t] = await Promise.all([
        supabase.from("meetings").select("id,title,agent_state,meeting_date").order("created_at", { ascending: false }),
        supabase.from("action_items").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id,title,owner,deadline,status,priority"),
      ]);
      return { meetings: m.data ?? [], actionCount: a.count ?? 0, tasks: t.data ?? [] };
    },
  });
  const d = q.data;
  const tasks = d?.tasks ?? [];
  const pending = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS").length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdue = tasks.filter((t) => t.status === "OVERDUE").length;
  const upcoming = tasks
    .filter((t) => t.deadline && t.status !== "COMPLETED")
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
    .slice(0, 6);
  const awaiting = (d?.meetings ?? []).filter((m) => m.agent_state === "AWAITING_APPROVAL");

  const stats = [
    { label: "Total meetings", value: d?.meetings.length },
    { label: "Action items", value: d?.actionCount },
    { label: "Pending tasks", value: pending },
    { label: "Completed tasks", value: completed },
    { label: "Overdue tasks", value: overdue, danger: overdue > 0 },
  ];

  return (
    <>
      <PageHeader eyebrow="Workspace" title="Dashboard" desc="Live state of your meetings, extracted actions and tracked tasks."
        actions={<Button asChild><Link to="/meetings/new">New meeting</Link></Button>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <div className="eyebrow">{s.label}</div>
            <div className={`mt-2 text-3xl font-semibold tabular-nums ${s.danger ? "text-danger" : ""}`}>{q.isLoading ? "—" : s.value ?? 0}</div>
          </div>
        ))}
      </div>

      {awaiting.length > 0 && (
        <div className="mt-6 rounded-lg border border-warning/30 bg-warning-soft p-4">
          <div className="text-sm font-medium text-warning">Human approval required</div>
          <ul className="mt-2 space-y-1 text-sm">
            {awaiting.map((m) => (
              <li key={m.id}><Link to="/meetings/$id" params={{ id: m.id }} className="underline underline-offset-2">{m.title}</Link></li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-medium">Upcoming deadlines</h2><Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground">All tasks →</Link></div>
          {upcoming.length === 0 ? <div className="p-4"><EmptyState hint="Tasks with dated deadlines will appear here." /></div> : (
            <ul className="divide-y">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-24 font-mono text-xs text-muted-foreground">{t.deadline}</span>
                  <span className="flex-1 truncate">{t.title}<span className="text-muted-foreground"> · {t.owner ?? "Unassigned"}</span></span>
                  <StatusBadge value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-medium">Recent meetings</h2><Link to="/meetings" className="text-xs text-muted-foreground hover:text-foreground">All meetings →</Link></div>
          {(d?.meetings.length ?? 0) === 0 ? <div className="p-4"><EmptyState hint="Create a meeting and analyze its transcript." /></div> : (
            <ul className="divide-y">
              {d!.meetings.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-24 font-mono text-xs text-muted-foreground">{m.meeting_date}</span>
                  <Link to="/meetings/$id" params={{ id: m.id }} className="flex-1 truncate hover:underline">{m.title}</Link>
                  <StatusBadge value={m.agent_state} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
