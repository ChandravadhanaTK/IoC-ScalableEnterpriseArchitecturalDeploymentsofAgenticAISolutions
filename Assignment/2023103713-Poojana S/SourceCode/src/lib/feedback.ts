export interface Feedback {
  rating: number;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  topics: string[];
}

const FILLERS = ["um", "uh", "like", "basically", "actually", "you know"];

/** Instant rule-based answer review (structure, length, clarity). */
export function analyzeAnswer(answer: string, category: string): Feedback {
  const text = answer.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;
  const fillerCount = FILLERS.reduce((n, f) => n + (lower.match(new RegExp(`\\b${f}\\b`, "g"))?.length ?? 0), 0);
  const star = ["situation", "task", "action", "result"].filter((k) => lower.includes(k)).length;
  const hasExample = /for example|for instance|in my project|when i|once/.test(lower);
  const hasNumbers = /\d/.test(text);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const tips: string[] = [];
  let rating = 5;

  if (words.length >= 80) { strengths.push("Detailed, well-developed answer."); rating += 1.5; }
  else if (words.length < 30) { weaknesses.push("Answer is too short to show depth."); tips.push("Aim for 60–150 words: point, explanation, example."); rating -= 2; }
  if (hasExample) { strengths.push("Backs claims with a concrete example."); rating += 1; }
  else { weaknesses.push("No concrete example given."); tips.push("Add a specific project or situation to prove your point."); }
  if (hasNumbers) { strengths.push("Uses measurable details."); rating += 0.5; }
  else tips.push("Quantify impact (e.g. 'cut load time by 30%').");
  if (fillerCount > 2) { weaknesses.push(`Uses filler words ${fillerCount} times.`); tips.push("Pause instead of using fillers."); rating -= 1; }
  if (sentences >= 3) strengths.push("Clear sentence structure.");
  if (category === "Behavioral") {
    if (star >= 3) { strengths.push("Follows the STAR structure."); rating += 1; }
    else { weaknesses.push("Not clearly structured as Situation–Task–Action–Result."); tips.push("Use STAR: set context, your task, your action, the result."); }
  }
  if (category === "Technical" && !/because|trade-?off|complexity|example/.test(lower)) {
    weaknesses.push("Lacks reasoning or trade-offs."); tips.push("Explain *why*, and mention trade-offs or complexity.");
  }

  const topics =
    category === "Technical" ? ["Operating Systems", "Data Structures", "System design basics"]
    : category === "HR" ? ["Self-introduction pitch", "Company research"]
    : ["STAR method", "Conflict resolution stories"];

  return {
    rating: Math.max(1, Math.min(10, Math.round(rating * 10) / 10)),
    strengths: strengths.length ? strengths : ["You attempted the question — good start."],
    weaknesses,
    tips: tips.slice(0, 4),
    topics,
  };
}
