import type { Priority } from "@/types/task";

export type GoalType = "exam" | "learn" | "project" | "interview" | "generic";
type Template = [string, string, Priority, number][];

export interface GoalAnalysis {
  type: GoalType;
  topic: string;
  days: number;
}

/** Goal Analyzer: extract goal type, topic and time frame. */
export function analyzeGoal(goal: string): GoalAnalysis {
  const g = goal.toLowerCase();
  const dayMatch = g.match(/(\d+)\s*(day|days)/);
  const weekMatch = g.match(/(\d+)\s*(week|weeks)/);
  let days = dayMatch ? Number(dayMatch[1] ?? 0) : weekMatch ? Number(weekMatch[1] ?? 0) * 7 : 0;

  let type: GoalType = "generic";
  if (/exam|test|quiz|semester/.test(g)) type = "exam";
  else if (/interview|placement|job/.test(g)) type = "interview";
  else if (/learn|study|master|understand/.test(g)) type = "learn";
  else if (/project|build|complete|finish|develop/.test(g)) type = "project";

  if (!days) days = { exam: 5, interview: 5, learn: 7, project: 5, generic: 3 }[type];
  days = Math.min(Math.max(days, 1), 30);

  const topic =
    goal
      .replace(/\b(in|within|for)\s+\d+\s*(days?|weeks?)\b/gi, "")
      .replace(/\b(prepare|for|my|an?|the|learn|study|complete|finish|build|exam|interview|fundamentals|project)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim() || "your goal";

  return { type, topic, days };
}

/** Task Planner: predefined templates for common goal types. */
export function getTemplate({ type, topic }: GoalAnalysis): Template {
  const T = topic;
  switch (type) {
    case "exam":
      return [
        [`Review ${T} syllabus`, "List all units and mark weak areas.", "High", 45],
        [`Study ${T} fundamentals`, "Cover core concepts and definitions.", "High", 90],
        [`Deep-dive into key ${T} topics`, "Focus on high-weightage chapters.", "High", 120],
        [`Practice ${T} problems`, "Solve exercises and numericals.", "High", 120],
        [`Make revision notes`, "Write short notes and formula sheets.", "Medium", 60],
        [`Solve previous year papers`, "Attempt 2 papers under timed conditions.", "Medium", 120],
        [`Final revision`, "Revise notes and weak areas.", "Low", 60],
      ];
    case "learn":
      return [
        [`Set up ${T} environment`, "Install tools and create a starter project.", "High", 45],
        [`Learn ${T} basics`, "Understand core syntax and concepts.", "High", 90],
        [`Explore intermediate ${T} concepts`, "Study patterns and best practices.", "High", 90],
        [`Build small ${T} exercises`, "Reinforce concepts with practice.", "Medium", 90],
        [`Build a mini project`, "Apply what you learned end to end.", "Medium", 150],
        [`Review and document learnings`, "Write a summary and next steps.", "Low", 45],
      ];
    case "project":
      return [
        [`Define ${T} requirements`, "Clarify scope, features and deliverables.", "High", 60],
        [`Design architecture`, "Plan modules, data flow and UI.", "High", 90],
        [`Implement core features`, "Build the main functionality.", "High", 180],
        [`Test and fix bugs`, "Verify each feature works correctly.", "Medium", 90],
        [`Write documentation`, "Prepare README and report.", "Medium", 60],
        [`Prepare final demo`, "Rehearse the presentation.", "Low", 45],
      ];
    case "interview":
      return [
        [`Research the role and company`, "Understand expectations and tech stack.", "High", 45],
        [`Revise data structures & algorithms`, "Arrays, trees, graphs, DP.", "High", 120],
        [`Practice coding problems`, "Solve 5–10 problems daily.", "High", 120],
        [`Review CS fundamentals`, "OS, DBMS, networks, OOP.", "Medium", 90],
        [`Prepare project explanations`, "Be ready to explain your projects.", "Medium", 60],
        [`Practice HR & behavioral questions`, "Use the STAR method.", "Low", 45],
        [`Mock interview`, "Do a timed mock with a friend.", "Medium", 60],
      ];
    default:
      return [
        [`Clarify the goal`, `Define what success means for "${T}".`, "High", 30],
        [`Research and gather resources`, "Collect what you need to start.", "High", 60],
        [`Break work into milestones`, "Plan concrete checkpoints.", "Medium", 45],
        [`Execute main work`, "Complete the core effort.", "High", 120],
        [`Review and wrap up`, "Check results and reflect.", "Low", 30],
      ];
  }
}
