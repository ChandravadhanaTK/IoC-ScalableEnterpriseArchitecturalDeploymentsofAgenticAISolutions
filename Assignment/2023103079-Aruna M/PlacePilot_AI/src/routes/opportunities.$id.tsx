import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/placepilot/store";
import { OpportunityView } from "@/components/OpportunityView";

export const Route = createFileRoute("/opportunities/$id")({
  head: () => ({
    meta: [
      { title: "Opportunity details — PlacePilot AI" },
      { name: "description", content: "Eligibility, timeline, resume gaps, study plan and reminders for one drive." },
      { property: "og:title", content: "Opportunity details — PlacePilot AI" },
      { property: "og:description", content: "Placement opportunity intelligence." },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { opportunities } = useApp();
  const opp = opportunities.find((o) => o.id === id);
  return (
    <div>
      <Link to="/opportunities" className="font-mono text-xs text-muted-foreground hover:text-primary">← All opportunities</Link>
      <div className="mt-4">{opp ? <OpportunityView opp={opp} /> : <p className="text-muted-foreground">Loading or not found.</p>}</div>
    </div>
  );
}
