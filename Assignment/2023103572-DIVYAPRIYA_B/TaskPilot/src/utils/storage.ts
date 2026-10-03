import type { Task } from "@/types/task";
import { calculateProgress } from "@/agent/tools";

const KEY = "taskpilot:v1";

interface Stored {
  tasks: Task[];
  goal: string;
  progress: number;
}

export function saveTasks(tasks: Task[], goal: string): boolean {
  try {
    const data: Stored = { tasks, goal, progress: calculateProgress(tasks).percent };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadTasks(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { tasks: [], goal: "", progress: 0 };
    const d = JSON.parse(raw) as Stored;
    return { tasks: Array.isArray(d.tasks) ? d.tasks : [], goal: d.goal ?? "", progress: d.progress ?? 0 };
  } catch {
    return { tasks: [], goal: "", progress: 0 };
  }
}

export function clearTasks(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
