import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/capstone-deliverables")({
  head: () => ({
    meta: [
      { title: "Capstone Deliverables – ResearchMate" },
      { name: "description", content: "The five IoC capstone deliverables for ResearchMate: architecture, workflow, deployment, security, monitoring." },
      { property: "og:title", content: "Capstone Deliverables – ResearchMate" },
      { property: "og:description", content: "Architecture, agent workflow, deployment, security model and monitoring design." },
    ],
  }),
  component: DeliverablesPage,
});

const items = [
  ["Architecture Diagram", "Layers, components, trust boundaries and integrations",
    "Presentation layer (React UI) → Application layer (orchestrator) → Agent layer (6 agents) → Research API layer (OpenAlex) and AI layer (Lovable AI via a server function). The browser is untrusted; the AI key lives only on the server."],
  ["Agent Workflow Design", "Roles, states, tools, handoffs, approvals and failure paths",
    "Each agent moves through idle → running → done/error. Typed handoffs connect agents. The user approves results by reviewing and opening real DOIs. Failures retry, filter, or fall back deterministically."],
  ["Deployment Strategy", "Runtime, scaling, resilience, environments and release",
    "Built with Vite, deployed by Lovable to an edge runtime. Preview = test environment, Published = production. Rollback via Lovable version history. Stateless design scales with the hosting platform."],
  ["Security Model", "Identity, authorization, secrets, privacy, guardrails and audit",
    "No login and no stored personal data. The AI key is a server-side secret. Input is validated (length, schema). Paper text is treated as data to reduce prompt injection. Output is grounded in returned metadata."],
  ["Monitoring Dashboard Design", "Health, trace, quality, safety, cost and business outcomes",
    "A design spec for tracking API availability, latency, agent step failures, AI fallback rate, no-result rate, AI request count and successful sessions. Not a live monitoring system."],
];

function DeliverablesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-4xl font-semibold text-primary">Capstone Deliverables</h1>
      <p className="mt-2 text-muted-foreground">Full documents live in the project's <code className="font-mono text-sm">capstone-deliverables/</code> folder, with a combined <code className="font-mono text-sm">CAPSTONE-DELIVERABLES.md</code>.</p>
      <ol className="mt-8 space-y-4">
        {items.map(([t, s, d], i) => (
          <li key={t} className="rounded-lg border bg-card p-5">
            <p className="font-mono text-xs text-accent">0{i + 1}</p>
            <h2 className="text-xl font-semibold">{t}</h2>
            <p className="text-sm italic text-muted-foreground">{s}</p>
            <p className="mt-2 text-sm">{d}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
