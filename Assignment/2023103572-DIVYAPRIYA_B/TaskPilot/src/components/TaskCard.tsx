import { Clock, Trash2 } from "lucide-react";
import type { Priority, Task } from "@/types/task";

const badge: Record<Priority, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/15 text-warning-foreground",
  Low: "bg-success/15 text-success",
};

interface Props {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onPriority: (p: Priority) => void;
}

export function TaskCard({ task, onToggle, onDelete, onPriority }: Props) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition ${task.completed ? "opacity-60" : "hover:shadow-card"}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={onToggle}
        aria-label={`Mark ${task.title} complete`}
        className="mt-1 h-4 w-4 accent-[var(--primary)]"
      />
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${task.completed ? "line-through" : ""}`}>{task.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <select
            value={task.priority}
            onChange={(e) => onPriority(e.target.value as Priority)}
            aria-label="Change priority"
            className={`cursor-pointer rounded-md border-0 px-2 py-0.5 font-medium outline-none ${badge[task.priority]}`}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" /> {task.estimatedMinutes} min
          </span>
        </div>
      </div>
      <button onClick={onDelete} aria-label="Delete task" className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
