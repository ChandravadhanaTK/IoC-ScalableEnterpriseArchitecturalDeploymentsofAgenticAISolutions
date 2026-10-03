import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/placepilot/store";
import { fmtDate, ns } from "@/lib/placepilot/engine";
import { btn, EngineBadge, PageHeader, Panel, Pill } from "@/components/pp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flight Deck — PlacePilot AI" },
      { name: "description", content: "Your placement flight deck: eligibility, upcoming rounds, reminders and prep progress." },
      { property: "og:title", content: "Flight Deck — PlacePilot AI" },
      { property: "og:description", content: "Agentic placement intelligence for Indian engineering students." },
    ],
  }),
  component: Home,
});

function Home() {
  const { student, opportunities } = useApp();
  const now = Date.now();
  const upcoming = opportunities
    .flatMap((o) => o.events.filter((e) => e.start && new Date(e.start).getTime() > now).map((e) => ({ o, e })))
    .sort((a, b) => a.e.start!.localeCompare(b.e.start!))
    .slice(0, 5);
  const reminders = opportunities.flatMap((o) => o.reminders.map((r) => ({ o, r }))).filter((x) => new Date(x.r.at).getTime() > now).sort((a, b) => a.r.at.localeCompare(b.r.at)).slice(0, 5);
  return (
    <div>
      <PageHeader kicker="Flight Deck" title={`Good to see you, ${student.name.split(" ")[0] ?? ""}.`}>
        {student.degree} {student.branch} · {student.batch} batch · CGPA {student.cgpa}/10. PlacePilot turns noisy placement broadcasts into eligibility, timelines and a prep plan — it does not replace your college placement portal.
      </PageHeader>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link to="/opportunities/new" className={btn}>+ Ingest a notification</Link>
        <Link to="/architecture" className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm hover:bg-accent">View course deliverables</Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Tracked opportunities" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {opportunities.map((o) => (
              <li key={o.id}>
                <Link to="/opportunities/$id" params={{ id: o.id }} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-primary">
                  <span>
                    <span className="font-medium">{ns(o.company)}</span> <span className="text-muted-foreground">— {ns(o.role)}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{o.ctcLpa ? `₹${o.ctcLpa} LPA` : ""}</span>
                  </span>
                  <span className="flex gap-2"><Pill v={o.eligibility.verdict} /><EngineBadge engine={o.engine} /></span>
                </Link>
              </li>
            ))}
            {opportunities.length === 0 && <li className="py-3 text-muted-foreground">Nothing tracked yet.</li>}
          </ul>
        </Panel>
        <Panel title="Next milestones">
          <ul className="space-y-3 text-sm">
            {upcoming.map(({ o, e }, i) => (
              <li key={i}>
                <p className="font-medium">{e.label} {e.tentative && <Pill v="borderline" label="Tentative" />}</p>
                <p className="font-mono text-xs text-muted-foreground">{ns(o.company)} · {fmtDate(e.start)}</p>
              </li>
            ))}
            {upcoming.length === 0 && <li className="text-muted-foreground">No upcoming dated milestones.</li>}
          </ul>
        </Panel>
        <Panel title="Upcoming alerts" className="lg:col-span-3">
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {reminders.map(({ o, r }) => (
              <li key={o.id + r.id} className="flex justify-between rounded-sm border border-border px-3 py-2">
                <span><span className="font-mono text-xs text-primary">T-{r.offset}</span> {ns(o.company)} · {r.event}</span>
                <span className="font-mono text-xs text-muted-foreground">{fmtDate(r.at)}</span>
              </li>
            ))}
            {reminders.length === 0 && <li className="text-muted-foreground">No pending alerts.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
