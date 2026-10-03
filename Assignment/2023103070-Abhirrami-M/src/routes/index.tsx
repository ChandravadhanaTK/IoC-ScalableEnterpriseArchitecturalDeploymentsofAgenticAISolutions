import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Circle, Loader2, XCircle, ExternalLink } from "lucide-react";
import {
  plannerAgent,
  searchAgent,
  validationAgent,
  rankingAgent,
  fallbackAnalysis,
  fallbackSynthesis,
  type Plan,
  type RankedPaper,
  type PaperAnalysis,
  type Synthesis,
} from "@/lib/agents";
import { analyzePapers } from "@/lib/analysis.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResearchMate – Agentic AI Research Paper Assistant" },
      { name: "description", content: "Find, validate, rank and analyze real research papers with a multi-agent AI workflow." },
      { property: "og:title", content: "ResearchMate – Agentic AI Research Paper Assistant" },
      { property: "og:description", content: "Multi-agent research assistant powered by OpenAlex and AI analysis." },
    ],
  }),
  component: ResearchPage,
});

type Status = "idle" | "running" | "done" | "error";
const AGENTS = ["Planner Agent", "Search Agent", "Validation Agent", "Ranking Agent", "Analysis Agent", "Synthesis Agent"];

function ResearchPage() {
  const analyze = useServerFn(analyzePapers);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<{ status: Status; note: string }[]>(AGENTS.map(() => ({ status: "idle", note: "" })));
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [papers, setPapers] = useState<RankedPaper[]>([]);
  const [analysis, setAnalysis] = useState<Record<string, PaperAnalysis>>({});
  const [synthesis, setSynthesis] = useState<Synthesis | null>(null);
  const [aiUsed, setAiUsed] = useState(false);

  const set = (i: number, status: Status, note = "") =>
    setSteps((s) => s.map((x, j) => (j === i ? { status, note } : x)));

  async function run() {
    const q = query.trim();
    if (q.length < 3) return setError("Please enter a research question of at least 3 characters.");
    setBusy(true);
    setError(null);
    setPapers([]);
    setSynthesis(null);
    setAnalysis({});
    setPlan(null);
    setSteps(AGENTS.map(() => ({ status: "idle", note: "" })));
    let i = 0;
    try {
      set(0, "running");
      const p = plannerAgent(q);
      setPlan(p);
      set(0, "done", `Topic: ${p.topic}`);

      i = 1; set(1, "running");
      const raw = await searchAgent(p);
      set(1, "done", `${raw.length} scholarly papers found on OpenAlex`);
      if (!raw.length) throw new Error("No research papers were found for this query. Try using broader keywords.");

      i = 2; set(2, "running");
      const valid = validationAgent(raw);
      set(2, "done", `${valid.length} valid papers retained`);
      if (!valid.length) throw new Error("Papers were found but none had valid metadata. Try different keywords.");

      i = 3; set(3, "running");
      const ranked = rankingAgent(valid, p);
      setPapers(ranked);
      set(3, "done", `Top ${ranked.length} ranked by relevance`);

      i = 4; set(4, "running");
      set(5, "running");
      const res = await analyze({
        data: { query: q, papers: ranked.map(({ id, title, year, source, abstract }) => ({ id, title, year, source, abstract })) },
      }).catch(() => ({ ok: false as const, error: "network" }));
      const map: Record<string, PaperAnalysis> = {};
      ranked.forEach((r) => (map[r.id] = fallbackAnalysis(r, p)));
      let syn = fallbackSynthesis(ranked, p);
      if (res.ok && res.result?.papers) {
        for (const a of res.result.papers as PaperAnalysis[]) if (map[a.id]) map[a.id] = { ...map[a.id], ...a };
        if (res.result.synthesis) syn = { ...syn, ...res.result.synthesis };
        setAiUsed(true);
        set(4, "done", "Papers analyzed with AI");
        set(5, "done", "Final research report generated");
      } else {
        setAiUsed(false);
        set(4, "done", "AI unavailable – deterministic abstract analysis used");
        set(5, "done", "Metadata-based report generated");
      }
      setAnalysis(map);
      setSynthesis(syn);
    } catch (e) {
      set(i, "error", "Failed");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const started = steps.some((s) => s.status !== "idle");

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Agentic AI · IoC Capstone</p>
        <h1 className="mt-3 text-5xl font-semibold text-primary">ResearchMate</h1>
        <p className="mt-2 text-lg text-muted-foreground">Agentic AI Research Paper Assistant</p>
      </section>

      <section className="mx-auto mt-8 max-w-3xl rounded-lg border bg-card p-4 shadow-sm">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && run()}
          rows={3}
          maxLength={500}
          placeholder="Ask me to find and analyze research papers..."
          className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            onClick={() => setQuery("Find recent research papers about AI-based healthcare diagnosis")}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Try an example
          </button>
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Start Research
          </button>
        </div>
      </section>

      {error && (
        <div className="mx-auto mt-4 max-w-3xl rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {started && (
        <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-lg border bg-card p-5 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Agent Workflow</h2>
            <ol className="mt-4 space-y-4">
              {AGENTS.map((name, i) => {
                const s = steps[i]!;
                return (
                  <li key={name} className="flex gap-3">
                    {s.status === "done" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                      : s.status === "running" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent" />
                      : s.status === "error" ? <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                      : <Circle className="h-5 w-5 shrink-0 text-border" />}
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
            {plan && (
              <div className="mt-5 border-t pt-4 text-xs">
                <p className="font-mono uppercase text-muted-foreground">Research plan</p>
                <p className="mt-1"><b>Intent:</b> {plan.intent}</p>
                <p><b>Keywords:</b> {plan.keywords.join(", ")}</p>
                {plan.fromYear && <p><b>From year:</b> {plan.fromYear}</p>}
              </div>
            )}
          </aside>

          <div className="space-y-10">
            {synthesis && (
              <section className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Research Summary</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase">
                    {aiUsed ? "AI synthesis" : "Fallback synthesis"}
                  </span>
                </div>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  {([
                    ["Main themes", synthesis.themes],
                    ["Important findings", synthesis.findings],
                    ["Common approaches", synthesis.approaches],
                    ["Differences", synthesis.differences],
                    ["Research gaps", synthesis.gaps],
                    ["Read first", synthesis.readFirst],
                  ] as const).map(([t, items]) => (
                    <div key={t}>
                      <h3 className="text-sm font-semibold text-accent">{t}</h3>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                        {(items ?? []).map((x, k) => <li key={k}>{x}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {papers.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold">Ranked Papers</h2>
                <div className="mt-4 space-y-4">
                  {papers.map((p, idx) => {
                    const a = analysis[p.id];
                    return (
                      <article key={p.id} className="rounded-lg border bg-card p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="max-w-2xl text-lg font-semibold leading-snug">
                            <span className="mr-2 font-mono text-sm text-muted-foreground">#{idx + 1}</span>{p.title}
                          </h3>
                          <span className="rounded-md bg-primary px-2 py-1 font-mono text-xs text-primary-foreground" title={`Keyword ${p.breakdown.relevance} · Recency ${p.breakdown.recency} · Abstract ${p.breakdown.abstract} · Metadata ${p.breakdown.metadata}`}>
                            Relevance: {p.score}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {p.authors.length ? p.authors.slice(0, 4).join(", ") + (p.authors.length > 4 ? " et al." : "") : "Metadata unavailable"}
                          {" · "}{p.year ?? "Metadata unavailable"}{" · "}{p.source ?? "Source metadata unavailable"}
                          {p.citations != null && ` · ${p.citations} citations`}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified scholarly record
                          {p.issues.length > 0 && <span className="text-muted-foreground"> · missing: {p.issues.join(", ")}</span>}
                        </p>
                        {a ? (
                          <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                            <div className="md:col-span-2"><dt className="font-semibold">Summary</dt><dd>{a.summary}</dd></div>
                            <div><dt className="font-semibold">Main contribution</dt><dd className="text-muted-foreground">{a.contribution}</dd></div>
                            <div><dt className="font-semibold">Key finding</dt><dd className="text-muted-foreground">{a.finding}</dd></div>
                            <div><dt className="font-semibold">Topic</dt><dd className="text-muted-foreground">{a.topic}</dd></div>
                            <div><dt className="font-semibold">Limitations</dt><dd className="text-muted-foreground">{a.limitation}</dd></div>
                          </dl>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">Analysis in progress…</p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">DOI: {p.doi ?? "Metadata unavailable"}</span>
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-muted">
                              View Paper <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {papers.length > 0 && Object.keys(analysis).length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold">Comparison</h2>
                <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-xs uppercase">
                      <tr>{["Paper", "Year", "Source", "Relevance", "Main Topic", "Summary"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {papers.map((p) => (
                        <tr key={p.id} className="border-t align-top">
                          <td className="px-3 py-2 font-medium">{p.title}</td>
                          <td className="px-3 py-2">{p.year ?? "—"}</td>
                          <td className="px-3 py-2">{p.source ?? "—"}</td>
                          <td className="px-3 py-2 font-mono">{p.score}%</td>
                          <td className="px-3 py-2">{analysis[p.id]?.topic}</td>
                          <td className="px-3 py-2 text-muted-foreground">{analysis[p.id]?.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Relevance is ResearchMate's own explainable score (keywords, recency, abstract, metadata) — not an official academic metric.</p>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
