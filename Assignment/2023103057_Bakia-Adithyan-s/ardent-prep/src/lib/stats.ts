export function categoryAverages(rows: { score: number; category: string }[]) {
  const map = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const m = map.get(r.category) ?? { sum: 0, n: 0 };
    m.sum += r.score;
    m.n += 1;
    map.set(r.category, m);
  }
  return [...map.entries()]
    .map(([category, { sum, n }]) => ({ category, avg: sum / n, count: n }))
    .sort((a, b) => b.avg - a.avg);
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function friendlyError(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}
