// Analysis history stored in this browser only (no personal data, no database).
import type { Analysis } from "./agent/types";

const KEY = "prooflab.history.v1";
const MAX = 20;

export function loadHistory(): Analysis[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Analysis[];
  } catch {
    return [];
  }
}

export function saveAnalysis(a: Analysis): Analysis[] {
  const next = [a, ...loadHistory().filter((h) => h.id !== a.id)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteAnalysis(id: string): Analysis[] {
  const next = loadHistory().filter((h) => h.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
