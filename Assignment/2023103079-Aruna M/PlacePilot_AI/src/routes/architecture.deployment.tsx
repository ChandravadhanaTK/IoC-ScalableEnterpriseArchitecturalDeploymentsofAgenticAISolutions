import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArchTabs, btnGhost, PageHeader, Panel } from "@/components/pp";

export const Route = createFileRoute("/architecture/deployment")({
  head: () => ({
    meta: [
      { title: "Deployment Strategy — PlacePilot AI" },
      { name: "description", content: "Four-stage pipeline, CI/CD, zero-downtime releases, edge caching and live health probes." },
      { property: "og:title", content: "Deployment Strategy — PlacePilot AI" },
      { property: "og:description", content: "From development to production with health checks." },
    ],
  }),
  component: Deploy,
});

const STAGES = [
  { n: "Development", env: "dev", items: ["Local sandbox + hot reload", "Deterministic engine default", "Seeded demo student"] },
  { n: "Testing / Staging", env: "staging", items: ["Typecheck + lint + unit tests", "Extraction golden-set tests (PTUM sample)", "Security scan & dependency audit"] },
  { n: "Preview Deployment", env: "preview", items: ["Immutable preview URL per change", "Isolated preview secrets", "Faculty / reviewer sign-off"] },
  { n: "Production", env: "prod", items: ["Atomic publish, instant rollback", "Edge-cached static assets", "Serverless functions scale to zero"] },
];

function Deploy() {
  const [probe, setProbe] = useState<Record<string, string>>({});
  const hit = async (p: string) => {
    const t = performance.now();
    try {
      const r = await fetch(p);
      const body = JSON.stringify(await r.json());
      setProbe((s) => ({ ...s, [p]: `${r.status} · ${Math.round(performance.now() - t)}ms · ${body}` }));
    } catch (e) {
      setProbe((s) => ({ ...s, [p]: `error: ${String(e)}` }));
    }
  };
  return (
    <div>
      <ArchTabs />
      <PageHeader kicker="Deliverable 3" title="Deployment strategy">Every change flows through four stages. Environments are fully separated, and AI keys never leave the server.</PageHeader>
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {STAGES.map((s, i) => (
          <div key={s.n} className="relative rounded-md border border-border bg-card p-4">
            <p className="font-mono text-[10px] uppercase text-primary">Stage {i + 1} · {s.env}</p>
            <p className="mt-1 font-semibold">{s.n}</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{s.items.map((x) => <li key={x}>· {x}</li>)}</ul>
            {i < 3 && <span className="absolute -right-3 top-1/2 hidden text-primary md:block">▶</span>}
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Live health probes">
          {["/api/public/healthz", "/api/public/readyz"].map((p) => (
            <div key={p} className="mb-3">
              <div className="flex items-center justify-between"><code className="font-mono text-sm">{p}</code><button className={btnGhost + " text-xs"} onClick={() => hit(p)}>Probe</button></div>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{probe[p] ?? "not probed yet"}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground"><b>healthz</b> = process is alive (liveness). <b>readyz</b> = dependencies such as the AI key are configured (readiness). If readyz reports AI not ready, the app keeps serving using the deterministic engine.</p>
        </Panel>
        <Panel title="Release practices">
          <ul className="space-y-2 text-sm">
            <li><b>CI/CD:</b> each commit builds, typechecks and produces a preview; publish promotes the same artifact to production.</li>
            <li><b>Zero-downtime:</b> new versions deploy alongside the old; traffic switches atomically; rollback = re-publish previous version.</li>
            <li><b>Edge caching:</b> hashed JS/CSS cached immutably at the edge; HTML rendered per request.</li>
            <li><b>Serverless elasticity:</b> server functions run on edge workers that scale with exam-week spikes.</li>
            <li><b>Environment separation:</b> dev / preview / prod each have their own database and secrets.</li>
            <li><b>Secrets management:</b> keys stored in the encrypted secret store, read only inside server handlers, never prefixed for the browser.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
