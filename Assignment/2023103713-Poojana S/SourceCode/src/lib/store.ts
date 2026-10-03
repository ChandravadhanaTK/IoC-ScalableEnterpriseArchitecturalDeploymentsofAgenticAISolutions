import { useEffect, useState } from "react";

export interface TestResult {
  id: string;
  module: "Aptitude" | "Technical";
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  seconds: number;
  date: string;
}
export interface InterviewEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  rating: number;
  date: string;
}
interface State { results: TestResult[]; interviews: InterviewEntry[] }

const KEY = "prep-portal-v1";
const listeners = new Set<() => void>();

function read(): State {
  if (typeof window === "undefined") return { results: [], interviews: [] };
  try {
    return { results: [], interviews: [], ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { results: [], interviews: [] };
  }
}
function write(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
  listeners.forEach((l) => l());
}

export function addResult(r: Omit<TestResult, "id" | "date">) {
  const s = read();
  s.results.push({ ...r, id: crypto.randomUUID(), date: new Date().toISOString() });
  write(s);
}
export function addInterview(e: Omit<InterviewEntry, "id" | "date">) {
  const s = read();
  s.interviews.push({ ...e, id: crypto.randomUUID(), date: new Date().toISOString() });
  write(s);
}
export function resetAll() { write({ results: [], interviews: [] }); }

export function useStore(): State {
  const [s, set] = useState<State>({ results: [], interviews: [] });
  useEffect(() => {
    const l = () => set(read());
    l();
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return s;
}

export function pct(score: number, total: number) {
  return total ? Math.round((score / total) * 100) : 0;
}

export function topicStats(results: TestResult[]) {
  const map = new Map<string, { score: number; total: number }>();
  for (const r of results) {
    const m = map.get(r.topic) ?? { score: 0, total: 0 };
    m.score += r.score; m.total += r.total;
    map.set(r.topic, m);
  }
  return [...map.entries()]
    .map(([topic, v]) => ({ topic, accuracy: pct(v.score, v.total), attempts: v.total }))
    .sort((a, b) => b.accuracy - a.accuracy);
}
