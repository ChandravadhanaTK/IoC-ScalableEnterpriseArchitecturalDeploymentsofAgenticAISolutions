import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ListChecks, RotateCcw } from "lucide-react";
import { Header } from "@/components/Header";
import { GoalInput } from "@/components/GoalInput";
import { AgentActivity } from "@/components/AgentActivity";
import { TaskCard } from "@/components/TaskCard";
import { ProgressCard } from "@/components/ProgressCard";
import { Architecture } from "@/components/Architecture";
import { agentController } from "@/agent/agentController";
import { calculateProgress } from "@/agent/tools";
import { clearTasks, loadTasks, saveTasks } from "@/utils/storage";
import type { ActivityEntry, Priority, Task } from "@/types/task";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TaskPilot – Agentic AI Task Planner" },
      { name: "description", content: "Turn any natural-language goal into a prioritized, scheduled action plan with a lightweight AI agent." },
      { property: "og:title", content: "TaskPilot – Agentic AI Task Planner" },
      { property: "og:description", content: "Turn any goal into a prioritized, scheduled action plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function Index() {
  const [goal, setGoal] = useState("");
  const [activeGoal, setActiveGoal] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = loadTasks();
    setTasks(d.tasks);
    setActiveGoal(d.goal);
  }, []);

  const progress = useMemo(() => calculateProgress(tasks), [tasks]);
  const days = useMemo(() => [...new Set(tasks.map((t) => t.day))].sort((a, b) => a - b), [tasks]);
  const today = days.find((d) => tasks.some((t) => t.day === d && !t.completed));

  const update = (next: Task[]) => {
    setTasks(next);
    if (!saveTasks(next, activeGoal)) setError("Couldn't save to browser storage — changes may be lost on refresh.");
  };

  const createPlan = async () => {
    setError("");
    setBusy(true);
    setActivity([]);
    try {
      const { tasks: t } = await agentController(goal, ({ message }) =>
        setActivity((a) => [
          ...a.map((e) => ({ ...e, status: "done" as const })),
          { id: crypto.randomUUID(), message, time: now(), status: "running" },
        ]),
      );
      setActivity((a) => [
        ...a.map((e) => ({ ...e, status: "done" as const })),
        { id: crypto.randomUUID(), message: "Plan completed", time: now(), status: "done" },
      ]);
      setTasks(t);
      setActiveGoal(goal.trim());
      setGoal("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      setActivity((a) => [...a.map((x) => ({ ...x, status: "done" as const })), { id: crypto.randomUUID(), message: msg, time: now(), status: "error" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header status={busy ? "Working" : "Ready"} />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <GoalInput value={goal} onChange={setGoal} onSubmit={createPlan} busy={busy} error={error} />

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <ListChecks className="h-4 w-4 text-primary" /> Action Plan
              </h2>
              {tasks.length > 0 && (
                <button
                  onClick={() => { clearTasks(); setTasks([]); setActiveGoal(""); setActivity([]); }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw className="h-3 w-3" /> Clear plan
                </button>
              )}
            </div>
            {activeGoal && <p className="mt-1 text-sm text-muted-foreground">Goal: <span className="font-medium text-foreground">{activeGoal}</span></p>}

            {tasks.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No plan yet. Enter a goal or pick a demo above, then click <b>Create Plan</b>.
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                {days.map((d) => (
                  <div key={d}>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" /> Day {d}
                      {d === today && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">Today</span>}
                    </h3>
                    <div className="space-y-2">
                      {tasks.filter((t) => t.day === d).map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          onToggle={() => update(tasks.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x)))}
                          onDelete={() => update(tasks.filter((x) => x.id !== t.id))}
                          onPriority={(p: Priority) => update(tasks.map((x) => (x.id === t.id ? { ...x, priority: p } : x)))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <ProgressCard progress={progress} tasks={tasks} />
          <AgentActivity entries={activity} busy={busy} />
        </aside>

        <div className="lg:col-span-2">
          <Architecture />
        </div>
      </main>
      <footer className="pb-8 text-center text-xs text-muted-foreground">TaskPilot · Agentic AI Task Planner</footer>
    </div>
  );
}
