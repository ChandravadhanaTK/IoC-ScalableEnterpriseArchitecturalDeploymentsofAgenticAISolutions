// ResearchMate agent pipeline (browser-safe). Each agent is a pure, explainable step.

export type Plan = { topic: string; keywords: string[]; intent: string; fromYear: number | null };
export type Paper = {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string | null;
  doi: string | null;
  source: string | null;
  url: string | null;
  citations: number | null;
};
export type ValidatedPaper = Paper & { valid: boolean; issues: string[] };
export type RankedPaper = ValidatedPaper & { score: number; breakdown: { relevance: number; recency: number; abstract: number; metadata: number } };
export type PaperAnalysis = {
  id: string;
  summary: string;
  contribution: string;
  topic: string;
  finding: string;
  limitation: string;
};
export type Synthesis = {
  themes: string[];
  findings: string[];
  approaches: string[];
  differences: string[];
  gaps: string[];
  readFirst: string[];
};

const STOP = new Set(
  "a an and are as at be by find for from get give in into is it me of on or papers paper please recent research show some study studies that the to latest new with about based using what which how list search analyze analyse".split(
    " ",
  ),
);

// AGENT 1 — Planner
export function plannerAgent(query: string): Plan {
  const clean = query.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
  const keywords = Array.from(new Set(clean.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))).slice(0, 8);
  const recent = /\b(recent|latest|new|current|202\d)\b/i.test(query);
  const year = new Date().getFullYear();
  return {
    topic: keywords.slice(0, 4).join(" ") || query.trim(),
    keywords,
    intent: recent ? "Find recent peer-reviewed research papers" : "Find relevant research papers",
    fromYear: recent ? year - 5 : null,
  };
}

function rebuildAbstract(inv: Record<string, number[]> | null | undefined): string | null {
  if (!inv) return null;
  const words: string[] = [];
  for (const [w, pos] of Object.entries(inv)) for (const p of pos) words[p] = w;
  const text = words.filter(Boolean).join(" ").trim();
  return text || null;
}

// AGENT 2 — Search (OpenAlex, real data only)
export async function searchAgent(plan: Plan): Promise<Paper[]> {
  const params = new URLSearchParams({
    search: plan.keywords.join(" ") || plan.topic,
    "per-page": "15",
    select:
      "id,display_name,publication_year,doi,authorships,primary_location,abstract_inverted_index,cited_by_count",
  });
  if (plan.fromYear) params.set("filter", `from_publication_date:${plan.fromYear}-01-01`);
  const url = `https://api.openalex.org/works?${params}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`OpenAlex responded ${res.status}`);
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (json.results ?? []).map((w: any): Paper => {
        const doi = w.doi ? String(w.doi).replace(/^https?:\/\/doi\.org\//, "") : null;
        return {
          id: w.id,
          title: w.display_name ?? "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          authors: (w.authorships ?? []).map((a: any) => a.author?.display_name).filter(Boolean),
          year: w.publication_year ?? null,
          abstract: rebuildAbstract(w.abstract_inverted_index),
          doi,
          source: w.primary_location?.source?.display_name ?? null,
          url: doi ? `https://doi.org/${doi}` : (w.primary_location?.landing_page_url ?? null),
          citations: typeof w.cited_by_count === "number" ? w.cited_by_count : null,
        };
      });
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
  }
  const timeout = lastErr instanceof Error && lastErr.name === "AbortError";
  throw new Error(
    timeout
      ? "The scholarly search timed out. Please check your connection and try again."
      : "The scholarly database (OpenAlex) is unavailable right now. Please try again shortly.",
  );
}

// AGENT 3 — Validation
export function validationAgent(papers: Paper[]): ValidatedPaper[] {
  const seen = new Set<string>();
  const out: ValidatedPaper[] = [];
  for (const p of papers) {
    const key = (p.doi ?? p.title).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!p.title || seen.has(key)) continue;
    seen.add(key);
    const issues: string[] = [];
    if (!p.authors.length) issues.push("authors");
    if (!p.year) issues.push("year");
    if (!p.doi && !p.url) issues.push("link");
    if (!p.source) issues.push("source");
    out.push({ ...p, issues, valid: !!p.year && !!(p.doi || p.url) });
  }
  return out.filter((p) => p.valid);
}

// AGENT 4 — Ranking (explainable, not an official academic metric)
export function rankingAgent(papers: ValidatedPaper[], plan: Plan): RankedPaper[] {
  const now = new Date().getFullYear();
  const kws = plan.keywords.length ? plan.keywords : [plan.topic.toLowerCase()];
  return papers
    .map((p) => {
      const title = p.title.toLowerCase();
      const abs = (p.abstract ?? "").toLowerCase();
      const hits = kws.reduce((s, k) => s + (title.includes(k) ? 1 : abs.includes(k) ? 0.6 : 0), 0);
      const relevance = Math.round((hits / kws.length) * 50);
      const recency = p.year ? Math.max(0, 20 - Math.max(0, now - p.year) * 2) : 0;
      const abstract = p.abstract ? 15 : 0;
      const metadata = (p.doi ? 8 : 0) + (p.source ? 4 : 0) + (p.authors.length ? 3 : 0);
      const breakdown = { relevance, recency, abstract, metadata };
      return { ...p, breakdown, score: Math.min(100, relevance + recency + abstract + metadata) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function sentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [text];
}

// AGENT 5 fallback — deterministic analysis from abstract only
export function fallbackAnalysis(p: RankedPaper, plan: Plan): PaperAnalysis {
  const unavailable = "Not stated in available metadata";
  if (!p.abstract)
    return {
      id: p.id,
      summary: "Abstract unavailable — open the paper to read its content.",
      contribution: unavailable,
      topic: plan.topic,
      finding: unavailable,
      limitation: unavailable,
    };
  const s = sentences(p.abstract);
  const find = (re: RegExp) => s.find((x) => re.test(x)) ?? unavailable;
  return {
    id: p.id,
    summary: s.slice(0, 2).join(" "),
    contribution: find(/\b(propose|present|introduce|develop|we )/i),
    topic: plan.topic,
    finding: find(/\b(result|show|find|achiev|outperform|demonstrat|accuracy)/i),
    limitation: find(/\b(limitation|however|future work|challenge)/i),
  };
}

// AGENT 6 fallback — deterministic synthesis
export function fallbackSynthesis(papers: RankedPaper[], plan: Plan): Synthesis {
  const freq: Record<string, number> = {};
  for (const p of papers)
    for (const w of `${p.title} ${p.abstract ?? ""}`.toLowerCase().match(/[a-z]{6,}/g) ?? [])
      if (!STOP.has(w)) freq[w] = (freq[w] ?? 0) + 1;
  const themes = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);
  const years = papers.map((p) => p.year).filter(Boolean) as number[];
  return {
    themes,
    findings: papers.slice(0, 3).map((p) => `${p.title} (${p.year ?? "n.d."})`),
    approaches: [`Frequently mentioned terms: ${themes.slice(0, 4).join(", ")}`],
    differences: years.length
      ? [`Publication years range from ${Math.min(...years)} to ${Math.max(...years)}.`]
      : [],
    gaps: [`AI synthesis unavailable — gaps for "${plan.topic}" require reading the full papers.`],
    readFirst: papers.slice(0, 3).map((p) => p.title),
  };
}
