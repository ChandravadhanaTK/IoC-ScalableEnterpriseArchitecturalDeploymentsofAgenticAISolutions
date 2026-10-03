import type { Priority, Progress, Task } from "@/types/task";

const rank: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

export function createTask(
  title: string,
  description: string,
  priority: Priority,
  estimatedMinutes: number,
): Task {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    priority,
    estimatedMinutes,
    day: 1,
    completed: false,
  };
}

/** Stable sort: High → Medium → Low, keeping logical order within a priority. */
export function prioritizeTasks(tasks: Task[]): Task[] {
  return tasks
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank[a.t.priority] - rank[b.t.priority] || a.i - b.i)
    .map(({ t }) => t);
}

/** Spread tasks across available days, preserving the planned sequence. */
export function generateSchedule(tasks: Task[], availableDays: number): Task[] {
  const days = Math.max(1, Math.min(availableDays, tasks.length));
  const perDay = Math.ceil(tasks.length / days);
  return tasks.map((t, i) => ({ ...t, day: Math.floor(i / perDay) + 1 }));
}

export function calculateProgress(tasks: Task[]): Progress {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  return {
    total,
    completed,
    pending: total - completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}
