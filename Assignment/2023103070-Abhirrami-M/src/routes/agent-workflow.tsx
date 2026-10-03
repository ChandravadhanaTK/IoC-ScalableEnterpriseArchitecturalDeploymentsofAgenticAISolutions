import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/agent-workflow")({
  head: () => ({
    meta: [
      { title: "Agent Workflow – ResearchMate" },
      { name: "description", content: "How ResearchMate's six agents plan, search, validate, rank, analyze and synthesize research." },
      { property: "og:title", content: "Agent Workflow – ResearchMate" },
      { property: "og:description", content: "Roles, inputs, outputs, tools, handoffs and failure paths of the ResearchMate agents." },
    ],
  }),
  component: WorkflowPage,
});

const agents = [
  ["Planner Agent", "User question", "Topic, keywords, intent, year filter", "Keyword extraction (deterministic)"],
  ["Search Agent", "Research plan", "Raw paper records", "OpenAlex Works API (timeout + 1 retry)"],
  ["Validation Agent", "Raw records", "De-duplicated, verified records", "Metadata & duplicate checks"],
  ["Ranking Agent", "Valid records + plan", "Top 8 scored papers", "Explainable scoring formula"],
  ["Analysis Agent", "Top papers + abstracts", "Summary, contribution, finding, limitation", "Lovable AI (server-side) / abstract fallback"],
  ["Synthesis Agent", "Analyzed papers", "Research Summary report", "Lovable AI / metadata fallback"],
];

const failures = [
  ["API unavailable", "Retry once, then: “The scholarly database (OpenAlex) is unavailable right now.”"],
  ["No papers found", "“No research papers were found for this query. Try using broader keywords.”"],
  ["Invalid metadata", "Records without year or link are filtered; missing fields show “Metadata unavailable”."],
  ["AI summarization unavailable", "Deterministic fallback summary built from the real abstract."],
  ["Network timeout", "15 s timeout, retry, then a friendly timeout message."],
];

function WorkflowPage() {
  const flow = ["User", ...agents.map((a) => a[0]), "Final Research Report"];
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold text-primary">Agent Workflow</h1>
      <p className="mt-2 text-muted-foreground">Six specialized agents hand off structured state in sequence.</p>

      <div className="mt-8 flex flex-col items-center gap-1">
        {flow.map((f, i) => (
          <div key={f} className="flex flex-col items-center">
            <div className={`w-64 rounded-md border px-4 py-2 text-center text-sm font-medium ${i === 0 || i === flow.length - 1 ? "bg-primary text-primary-foreground" : "bg-card"}`}>{f}</div>
            {i < flow.length - 1 && <span className="text-accent">↓</span>}
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-semibold">Roles, inputs, outputs & tools</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase"><tr>{["Agent", "Input", "Output", "Tool"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{agents.map((r) => <tr key={r[0]} className="border-t">{r.map((c, i) => <td key={i} className={`px-3 py-2 ${i === 0 ? "font-medium" : ""}`}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Handoffs</h2>
          <p className="mt-2 text-sm text-muted-foreground">Each agent passes a typed object to the next: Plan → Paper[] → ValidatedPaper[] → RankedPaper[] → PaperAnalysis[] → Synthesis. The orchestrator on the Research page updates the UI after every handoff.</p>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Human interaction</h2>
          <p className="mt-2 text-sm text-muted-foreground">The user writes the request, watches each agent's status live, reviews scores and summaries, and opens the real paper via DOI to verify before relying on it.</p>
        </section>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">Failure paths</h2>
      <ul className="mt-4 space-y-2">
        {failures.map(([k, v]) => (
          <li key={k} className="rounded-md border bg-card px-4 py-3 text-sm"><b className="text-accent">{k}:</b> {v}</li>
        ))}
      </ul>
    </div>
  );
}
