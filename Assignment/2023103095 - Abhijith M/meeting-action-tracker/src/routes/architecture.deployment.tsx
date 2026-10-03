import { createFileRoute } from "@tanstack/react-router";
import { GitCommit, Box, KeyRound, Settings2, Layers, HeartPulse, ScrollText, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/StatusBadge";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/architecture/deployment")({
  head: () => pageMeta("Deployment Architecture", "Environments, CI/CD, scaling, health checks and zero-downtime deployment."),
  component: () => <AppShell><Deploy /></AppShell>,
});

const ENVS = [
  { name: "Development", desc: "Local / preview build, isolated test data", gate: "lint · typecheck" },
  { name: "Testing", desc: "Unit tests for validators, injection detector, agents", gate: "test suite" },
  { name: "Staging", desc: "Production-like, prompt regression set against real LLM", gate: "quality eval" },
  { name: "Production", desc: "Edge runtime, managed Postgres, monitored", gate: "manual approval" },
];

const TOPICS = [
  { icon: GitCommit, t: "CI/CD", d: "Each commit triggers build → typecheck → tests → artifact. Promotion between environments is gated; the same artifact moves forward." },
  { icon: Box, t: "Containerized services", d: "Stateless server functions run as isolated edge workers; each agent is a separate module behind the orchestrator and can be extracted into its own service." },
  { icon: Settings2, t: "Environment configuration", d: "Per-environment URLs and keys injected at runtime; no configuration baked into the client bundle beyond publishable keys." },
  { icon: KeyRound, t: "Secrets management", d: "The LLM API key lives in a server-side secret store and is read only inside server handlers — never shipped to the browser." },
  { icon: Layers, t: "Horizontal scaling", d: "Stateless agents scale per request; all state (meetings, runs, traces) lives in the database, so any instance can resume any trace." },
  { icon: HeartPulse, t: "Health checks", d: "Agent success rates and last-run timestamps are surfaced on the Monitoring page; failing agents are visible immediately." },
  { icon: ScrollText, t: "Logging", d: "Structured agent_runs spans with trace IDs, audit_logs for user actions, and security_events for injection attempts." },
  { icon: RefreshCw, t: "Zero-downtime deployment", d: "New versions are rolled out atomically at the edge; in-flight requests finish on the old version. Additive DB migrations keep both versions compatible." },
];

function Deploy() {
  return (
    <>
      <PageHeader eyebrow="Architecture" title="Deployment" desc="How the system moves from a commit to production, and how it stays healthy there." />
      <div className="grid gap-2 md:grid-cols-4">
        {ENVS.map((e, i) => (
          <div key={e.name} className="relative rounded-lg border bg-card p-4">
            <div className="font-mono text-[10px] text-muted-foreground">STAGE 0{i + 1}</div>
            <div className="font-semibold">{e.name}</div>
            <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
            <div className="mt-3 inline-block rounded bg-accent px-2 py-0.5 font-mono text-[10px] text-accent-foreground">gate: {e.gate}</div>
            {i < 3 && <span className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-muted-foreground md:block">→</span>}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {TOPICS.map((x) => (
          <section key={x.t} className="flex gap-4 rounded-lg border bg-card p-5">
            <x.icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <div><h3 className="font-medium">{x.t}</h3><p className="mt-1 text-sm text-muted-foreground">{x.d}</p></div>
          </section>
        ))}
      </div>
    </>
  );
}
