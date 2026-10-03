import { ArrowRight } from "lucide-react";

const steps = ["User Goal", "Agent Controller", "Task Analyzer", "Tool Selection", "Task Planner", "Local Storage", "Dashboard"];
const tools = [
  ["createTask", "Builds a task with title, priority and time."],
  ["prioritizeTasks", "Orders tasks High → Medium → Low."],
  ["generateSchedule", "Spreads tasks across available days."],
  ["calculateProgress", "Computes completion statistics."],
];

export function Architecture() {
  return (
    <section id="how-it-works" className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="text-lg font-semibold">How It Works</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        The agent controller analyzes your goal, decides which tools to call, observes each result and updates the plan
        until a final action plan is saved. It runs fully in your browser — no API key needed.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium">{s}</span>
            {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map(([n, d]) => (
          <div key={n} className="rounded-xl bg-muted p-3">
            <code className="text-sm font-semibold text-primary">{n}()</code>
            <p className="mt-1 text-xs text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
