import type { Opportunity } from "@/lib/placepilot/types";
import { fmtDate, ns, NS } from "@/lib/placepilot/engine";
import { setState } from "@/lib/placepilot/store";
import { EngineBadge, Panel, Pill } from "./pp";
import { Link } from "@tanstack/react-router";

export function OpportunityView({ opp }: { opp: Opportunity }) {
  const toggle = (id: string) =>
    setState((s) => ({
      ...s,
      opportunities: s.opportunities.map((o) => (o.id === opp.id ? { ...o, plan: o.plan.map((p) => (p.id === id ? { ...p, done: !p.done } : p)) } : o)),
    }));
  const done = opp.plan.filter((p) => p.done).length;
  const days = [...new Set(opp.plan.map((p) => p.day))];
  const now = Date.now();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{ns(opp.company)} <span className="text-muted-foreground">·</span> {ns(opp.role)}</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            CTC {opp.ctcLpa !== null ? `₹${opp.ctcLpa} LPA` : NS}{opp.ctcNote ? ` — ${opp.ctcNote}` : ""} · Batch {ns(opp.batch)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <EngineBadge engine={opp.engine} />
          {opp.fallbackReason && <span className="font-mono text-[10px] text-warning">Fallback: {opp.fallbackReason}</span>}
          <Link to="/monitoring/traces" search={{ trace: opp.traceId }} className="font-mono text-xs text-primary hover:underline">View execution trace →</Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Eligibility assessment" right={<Pill v={opp.eligibility.verdict} />}>
          <table className="w-full text-sm">
            <thead className="font-mono text-[10px] uppercase text-muted-foreground">
              <tr><th className="pb-2 text-left">Criterion</th><th className="text-left">Company</th><th className="text-left">You</th><th className="text-right">Status</th></tr>
            </thead>
            <tbody>
              {opp.eligibility.criteria.map((c) => (
                <tr key={c.label} className="border-t border-border">
                  <td className="py-2">{c.label}</td>
                  <td className={c.required === NS ? "italic text-muted-foreground" : ""}>{c.required}</td>
                  <td className="font-mono">{c.student}</td>
                  <td className="text-right"><Pill v={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Recruitment timeline">
          <ol className="relative space-y-4 border-l border-border pl-5">
            {opp.events.length === 0 && <li className="italic text-muted-foreground">No milestones specified</li>}
            {opp.events.map((e, i) => {
              const past = e.start && new Date(e.end ?? e.start).getTime() < now;
              return (
                <li key={i} className="relative">
                  <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 ${e.start ? (past ? "border-muted-foreground bg-muted" : "border-primary bg-primary/30") : "border-dashed border-muted-foreground bg-background"}`} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{e.label}</span>
                    {e.tentative && <Pill v="borderline" label="Tentative" />}
                    {past && <Pill v="x" label="Past" />}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {e.start ? `${fmtDate(e.start)}${e.end ? ` → ${fmtDate(e.end)}` : ""}` : `Date ${NS}${e.rawText ? ` — "${e.rawText}"` : ""}`}
                  </p>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Panel title="Resume gap analysis">
          {opp.match.score === null ? (
            <div className="rounded-sm border border-dashed border-warning/50 bg-warning/5 p-3 text-sm">
              <p className="font-mono text-xs uppercase text-warning">Match % suppressed</p>
              <p className="mt-1 text-muted-foreground">{opp.match.suppressedReason}</p>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <span className="font-mono text-5xl font-semibold text-primary">{opp.match.score}%</span>
              <span className="pb-2 text-sm text-muted-foreground">of listed role skills matched</span>
            </div>
          )}
          {opp.match.score === null && opp.match.inferredFocus.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Typical focus areas inferred from the role title (not from the notification):</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opp.match.matched.map((s) => <span key={s} className="rounded-sm bg-success/15 px-2 py-0.5 text-xs text-success">✓ {s}</span>)}
            {opp.match.gaps.map((s) => <span key={s} className="rounded-sm bg-destructive/15 px-2 py-0.5 text-xs text-destructive">gap: {s}</span>)}
          </div>
        </Panel>

        <Panel title="Reminders (24h & 1h)">
          <ul className="space-y-1.5 text-sm">
            {opp.reminders.length === 0 && <li className="italic text-muted-foreground">No dated milestones — nothing to schedule.</li>}
            {opp.reminders.map((r) => (
              <li key={r.id} className={`flex justify-between gap-2 ${new Date(r.at).getTime() < now ? "text-muted-foreground line-through" : ""}`}>
                <span><span className="font-mono text-xs text-primary">T-{r.offset}</span> {r.event}</span>
                <span className="font-mono text-xs">{fmtDate(r.at)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={`Company study planner · ${done}/${opp.plan.length} done`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((d) => {
            const items = opp.plan.filter((p) => p.day === d);
            return (
              <div key={d} className="rounded-sm border border-border p-3">
                <p className="font-mono text-xs text-muted-foreground">Day {d} · {items[0]?.date}</p>
                <ul className="mt-2 space-y-1.5">
                  {items.map((p) => (
                    <li key={p.id}>
                      <label className="flex cursor-pointer gap-2 text-sm">
                        <input type="checkbox" checked={p.done} onChange={() => toggle(p.id)} className="mt-1 accent-[var(--primary)]" />
                        <span className={p.done ? "text-muted-foreground line-through" : ""}>
                          <span className="font-mono text-[10px] uppercase text-primary">{p.category}</span> {p.title}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Other details">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {[
            ["Employment type", opp.employmentType], ["Stipend", opp.stipend], ["Degrees", opp.degrees], ["Branches", opp.branches],
            ["Bond", opp.bond], ["Probation", opp.probation], ["Locations", opp.locations], ["Listed skills", opp.skills],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="font-mono text-[10px] uppercase text-muted-foreground">{k as string}</dt>
              <dd className={ns(v) === NS ? "italic text-muted-foreground" : ""}>{ns(v)}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
