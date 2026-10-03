import type { Task } from "@/types/task";
import { analyzeGoal, getTemplate, type GoalAnalysis } from "./planner";
import { createTask, generateSchedule, prioritizeTasks } from "./tools";
import { saveTasks } from "@/utils/storage";

export interface AgentStep {
  message: string;
}

export interface AgentResult {
  analysis: GoalAnalysis;
  tasks: Task[];
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Deterministic local agent. Each step selects a tool and observes the result.
 * An LLM could replace analyzeGoal/getTemplate later without changing the UI.
 */
export async function agentController(
  goal: string,
  onStep: (step: AgentStep) => void,
): Promise<AgentResult> {
  const clean = goal.trim();
  if (!clean) throw new Error("Please describe a goal first.");
  if (clean.length < 5) throw new Error("That goal is too short — add a little more detail.");

  onStep({ message: "Goal received" });
  await wait(400);

  const analysis = analyzeGoal(clean);
  onStep({ message: `Goal analyzed (${analysis.type}, ${analysis.days} days)` });
  await wait(450);

  let tasks = getTemplate(analysis).map(([t, d, p, m]) => createTask(t, d, p, m));
  if (!tasks.length) throw new Error("The agent couldn't generate tasks for this goal.");
  onStep({ message: `Tasks generated · tool: createTask ×${tasks.length}` });
  await wait(450);

  // Priorities are assigned in templates; sequence is kept for learning flow,
  // but prioritizeTasks is used to order tasks within each day.
  onStep({ message: "Priorities assigned · tool: prioritizeTasks" });
  await wait(400);

  tasks = generateSchedule(tasks, analysis.days);
  const byDay = new Map<number, Task[]>();
  tasks.forEach((t) => byDay.set(t.day, [...(byDay.get(t.day) ?? []), t]));
  tasks = [...byDay.keys()].sort((a, b) => a - b).flatMap((d) => prioritizeTasks(byDay.get(d)!));
  onStep({ message: "Schedule created · tool: generateSchedule" });
  await wait(400);

  saveTasks(tasks, clean);
  onStep({ message: "Plan saved" });

  return { analysis, tasks };
}
