import { createFileRoute, Link } from "@tanstack/react-router";
import { resetDemo, useApp } from "@/lib/placepilot/store";
import { ns } from "@/lib/placepilot/engine";
import { btn, btnGhost, EngineBadge, PageHeader, Pill } from "@/components/pp";

export const Route = createFileRoute("/opportunities/")({
  head: () => ({
    meta: [
      { title: "Opportunities — PlacePilot AI" },
      { name: "description", content: "All placement opportunities you are tracking with eligibility verdicts." },
      { property: "og:title", content: "Opportunities — PlacePilot AI" },
      { property: "og:description", content: "Tracked campus placement opportunities." },
    ],
  }),
  component: List,
});

function List() {
  const { opportunities } = useApp();
  return (
    <div>
      <PageHeader kicker="Opportunities" title="Tracked drives" />
      <div className="mb-4 flex gap-2">
        <Link to="/opportunities/new" className={btn}>+ Ingest notification</Link>
        <button className={btnGhost} onClick={() => confirm("Reset all demo data?") && resetDemo()}>Reset demo data</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {opportunities.map((o) => (
          <Link key={o.id} to="/opportunities/$id" params={{ id: o.id }} className="rounded-md border border-border bg-card p-4 hover:border-primary">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold">{ns(o.company)}</p>
                <p className="text-sm text-muted-foreground">{ns(o.role)}</p>
              </div>
              <Pill v={o.eligibility.verdict} />
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">{o.ctcLpa !== null ? `₹${o.ctcLpa} LPA` : "CTC Not specified"} · {o.events.length} milestones</p>
            <EngineBadge engine={o.engine} className="mt-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}
