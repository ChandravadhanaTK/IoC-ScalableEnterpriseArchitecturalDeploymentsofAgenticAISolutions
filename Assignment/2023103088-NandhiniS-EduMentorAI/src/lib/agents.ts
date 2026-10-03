export type Difficulty = "easy" | "medium" | "hard";
export type QType = "mcq" | "tf" | "short";
export interface Question { id: string; type: QType; topic: string; prompt: string; options?: string[]; answer: string; keywords?: string[] }
export type TopicStats = Record<string, { correct: number; total: number }>;

const STOP = new Set("about after again also because before being between could does during each from have having into more most other over same should such than that their them then there these they this those through under until very were what when where which while with would your will shall using used uses".split(" "));
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
export const sentences = (t: string) => t.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(s => s.length >= 40 && s.length <= 240);
export function keywords(t: string) {
  const m = new Map<string, number>();
  (t.toLowerCase().match(/[a-z]{5,}/g) ?? []).forEach(w => { if (!STOP.has(w)) m.set(w, (m.get(w) ?? 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
}

// Agent 1: Question Generation Agent (reads text, extracts concepts, builds questions)
export function questionAgent(text: string, difficulty: Difficulty, count: number): Question[] {
  const sents = sentences(text), global = keywords(text);
  const mix: QType[] = difficulty === "easy" ? ["mcq", "tf", "mcq", "tf", "short"] : difficulty === "medium" ? ["mcq", "short", "tf", "mcq", "short"] : ["short", "mcq", "short", "tf", "short"];
  const out: Question[] = [];
  for (let i = 0; i < Math.min(count, sents.length); i++) {
    const s = sents[i], sk = keywords(s).sort((a, b) => global.indexOf(a) - global.indexOf(b));
    const target = sk[0]; if (!target) continue;
    const blank = (w: string) => s.replace(new RegExp(w, "i"), "_____");
    const distract = shuffle(global.filter(w => w !== target)).slice(0, 3);
    let type = mix[i % mix.length];
    if (type === "mcq" && distract.length < 3) type = "short";
    const id = crypto.randomUUID();
    if (type === "mcq") out.push({ id, type, topic: target, prompt: blank(target), options: shuffle([target, ...distract]), answer: target });
    else if (type === "tf") {
      const isTrue = i % 2 === 0 || !distract.length;
      out.push({ id, type, topic: target, prompt: isTrue ? s : s.replace(new RegExp(target, "i"), distract[0]), options: ["True", "False"], answer: isTrue ? "True" : "False" });
    } else out.push({ id, type: "short", topic: target, prompt: `Briefly explain the role of "${target}" based on the material.`, answer: s, keywords: sk.slice(0, 5) });
  }
  return out;
}

// Agent 2: Evaluation Agent
export interface EvalResult { items: { id: string; correct: boolean; marks: number; explanation: string }[]; score: number; total: number; accuracy: number; topics: TopicStats; strengths: string[]; weaknesses: string[]; recommendation: string }
export function evaluationAgent(qs: Question[], answers: Record<string, string>): EvalResult {
  const topics: TopicStats = {};
  const items = qs.map(q => {
    const a = (answers[q.id] ?? "").trim();
    let marks = 0;
    if (q.type === "short") {
      const kws = q.keywords ?? [], hits = kws.filter(k => a.toLowerCase().includes(k)).length, r = kws.length ? hits / kws.length : 0;
      marks = r >= 0.6 ? 1 : r >= 0.3 ? 0.5 : 0;
    } else marks = a === q.answer ? 1 : 0;
    const t = (topics[q.topic] ??= { correct: 0, total: 0 }); t.total += 1; t.correct += marks;
    return { id: q.id, correct: marks === 1, marks, explanation: marks === 1 ? "Correct." : `Expected: ${q.answer}` };
  });
  const score = items.reduce((s, i) => s + i.marks, 0), total = qs.length;
  const accuracy = total ? Math.round((score / total) * 1000) / 10 : 0;
  const entries = Object.entries(topics);
  const strengths = entries.filter(([, v]) => v.correct / v.total >= 0.7).map(([k]) => k);
  const weaknesses = entries.filter(([, v]) => v.correct / v.total < 0.5).map(([k]) => k);
  return { items, score, total, accuracy, topics, strengths, weaknesses,
    recommendation: weaknesses.length ? `Review: ${weaknesses.join(", ")}.` : "Great work. Try a harder quiz." };
}

export function mergeTopics(list: TopicStats[]): TopicStats {
  const m: TopicStats = {};
  list.forEach(t => Object.entries(t ?? {}).forEach(([k, v]) => { const x = (m[k] ??= { correct: 0, total: 0 }); x.correct += v.correct; x.total += v.total; }));
  return m;
}

// Agent 3: Study Planner Agent
export interface PlanTask { day: number; title: string; done: boolean }
export function studyPlannerAgent(history: TopicStats, maxDays = 5): { weakTopics: string[]; tasks: PlanTask[] } {
  const weak = Object.entries(history).filter(([, v]) => v.total > 0 && v.correct / v.total < 0.6)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).map(([k]) => k);
  if (!weak.length) return { weakTopics: [], tasks: [{ day: 1, title: "No weak topics. Take a Hard quiz to keep improving.", done: false }] };
  return { weakTopics: weak, tasks: weak.slice(0, maxDays).map((t, i) => ({ day: i + 1, title: `Review "${t}": re-read the notes, then retake a quiz on it`, done: false })) };
}
