import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENT_LABELS } from "@/lib/orchestrator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TripPilot AI — Multi-agent trip planning" },
      { name: "description", content: "Seven specialised AI agents research, plan, budget and validate your trip — honestly." },
      { property: "og:title", content: "TripPilot AI — Multi-agent trip planning" },
      { property: "og:description", content: "Seven AI agents research, plan, budget and validate your trip." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = ["COLLECT_INPUT", "RESEARCH", "BUILD_ITINERARY", "OPTIMIZE_BUDGET", "VALIDATE", "USER_REVIEW"];

function Index() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="flex items-center justify-between">
        <span className="font-display text-xl font-bold">TripPilot<span className="text-accent">.</span>AI</span>
        <Link to="/plan"><Button variant="outline" size="sm">Open planner</Button></Link>
      </nav>

      <section className="grid gap-12 py-20 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <p className="label-mono">Flight plan · 7 agents · 1 validator</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.02] md:text-7xl">
            Your trip, cleared<br />for <em className="text-accent">departure</em>.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Specialised AI agents research, plan and price your trip, then a critic checks every constraint —
            and tells you plainly when something doesn't fit.
          </p>
          <Link to="/plan">
            <Button size="lg" className="mt-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              Plan a trip <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
        <div className="ticket p-6">
          <p className="label-mono">Crew manifest</p>
          <ol className="mt-4 divide-y divide-dashed divide-border">
            {Object.values(AGENT_LABELS).map((l, i) => (
              <li key={l} className="flex items-center justify-between py-2.5">
                <span className="font-medium">{l}</span>
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ticket p-6">
        <p className="label-mono">Workflow</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          {STEPS.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="rounded border border-border bg-secondary px-2 py-1">{s}</span>
              {i < STEPS.length - 1 && <span className="text-accent">→</span>}
            </span>
          ))}
        </div>
        <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
          All prices, travel times and climate are AI estimates — never live availability, confirmed prices or forecasts.
          TripPilot never books or pays for anything.
        </p>
      </section>
    </main>
  );
}
