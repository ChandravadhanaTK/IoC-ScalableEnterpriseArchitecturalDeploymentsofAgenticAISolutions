import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, MapPin, Printer, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AGENT_LABELS, planTrip, type AgentId, type AnyJson, type Phase, type TripInput, type TripState,
} from "@/lib/orchestrator";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan a trip — TripPilot AI" },
      { name: "description", content: "Enter your preferences and watch seven AI agents build a validated itinerary." },
      { property: "og:title", content: "Plan a trip — TripPilot AI" },
      { property: "og:description", content: "Watch seven AI agents build a validated, budget-aware itinerary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanPage,
});

const DEFAULT: TripInput = {
  origin: "", destination: "", startDate: "", days: 4, travelers: 2, budget: 2000, currency: "USD",
  interests: "", dietary: "", accommodation: "mid-range hotel", transport: "any", pace: "balanced",
};
const PHASES: Phase[] = ["RESEARCH", "BUILD_ITINERARY", "OPTIMIZE_BUDGET", "VALIDATE", "USER_REVIEW"];
const money = (n: number | undefined, c: string) =>
  typeof n === "number" ? new Intl.NumberFormat(undefined, { style: "currency", currency: c || "USD", maximumFractionDigits: 0 }).format(n) : "—";

function PlanPage() {
  const [input, setInput] = useState<TripInput>(DEFAULT);
  const [state, setState] = useState<TripState | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof TripInput>(k: K, v: TripInput[K]) => setInput((p) => ({ ...p, [k]: v }));

  async function start(replan = false) {
    setErr(null);
    if (!input.origin.trim() || !input.destination.trim() || !input.startDate) {
      setErr("Origin, destination and start date are required."); return;
    }
    if (input.days < 1 || input.days > 21 || input.travelers < 1 || input.travelers > 20 || input.budget <= 0) {
      setErr("Days must be 1–21, travellers 1–20 and budget above 0."); return;
    }
    setBusy(true);
    await planTrip(input, setState, replan && state ? state : undefined);
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav className="no-print mb-8 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold">TripPilot<span className="text-accent">.</span>AI</Link>
        {state?.phase === "USER_REVIEW" && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="size-4" /> Export PDF
          </Button>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="no-print space-y-6">
          <form className="ticket space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); start(false); }}>
            <p className="label-mono">Boarding details</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="From"><Input maxLength={80} value={input.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Mumbai" /></F>
              <F label="To"><Input maxLength={80} value={input.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Kyoto" /></F>
              <F label="Start date"><Input type="date" value={input.startDate} onChange={(e) => set("startDate", e.target.value)} /></F>
              <F label="Days"><Input type="number" min={1} max={21} value={input.days} onChange={(e) => set("days", +e.target.value)} /></F>
              <F label="Travellers"><Input type="number" min={1} max={20} value={input.travelers} onChange={(e) => set("travelers", +e.target.value)} /></F>
              <F label="Budget (total)">
                <div className="flex gap-1">
                  <Input type="number" min={1} value={input.budget} onChange={(e) => set("budget", +e.target.value)} />
                  <select className="rounded-md border border-input bg-card px-1 text-sm" value={input.currency} onChange={(e) => set("currency", e.target.value)}>
                    {["USD", "EUR", "GBP", "INR", "JPY", "AUD"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </F>
            </div>
            <F label="Interests"><Input maxLength={200} value={input.interests} onChange={(e) => set("interests", e.target.value)} placeholder="temples, food, hiking" /></F>
            <F label="Dietary needs"><Input maxLength={120} value={input.dietary} onChange={(e) => set("dietary", e.target.value)} placeholder="vegetarian" /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Stay">
                <Sel value={input.accommodation} onChange={(v) => set("accommodation", v)} opts={["hostel", "budget hotel", "mid-range hotel", "boutique", "luxury", "apartment"]} />
              </F>
              <F label="Transport">
                <Sel value={input.transport} onChange={(v) => set("transport", v)} opts={["any", "flight", "train", "bus", "car"]} />
              </F>
            </div>
            <F label="Pace">
              <div className="grid grid-cols-3 gap-1">
                {(["relaxed", "balanced", "packed"] as const).map((p) => (
                  <button type="button" key={p} onClick={() => set("pace", p)}
                    className={`rounded-md border px-2 py-1.5 text-sm capitalize ${input.pace === p ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </F>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Run agents"}
            </Button>
            {state?.phase === "USER_REVIEW" && (
              <Button type="button" variant="outline" disabled={busy} className="w-full gap-2" onClick={() => start(true)}>
                <RefreshCw className="size-4" /> Replan itinerary (keep research)
              </Button>
            )}
          </form>
          {state && <Trace state={state} />}
        </aside>

        <section className="min-w-0">
          {!state ? <Empty /> : <Results state={state} />}
        </section>
      </div>
    </main>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="label-mono">{label}</Label>{children}</div>;
}
function Sel({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <select className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm capitalize" value={value} onChange={(e) => onChange(e.target.value)}>
      {opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function Empty() {
  return (
    <div className="ticket flex h-full min-h-80 flex-col items-center justify-center p-10 text-center">
      <p className="label-mono">Awaiting flight plan</p>
      <h2 className="mt-3 text-3xl font-bold">Where to?</h2>
      <p className="mt-2 max-w-sm text-muted-foreground">Fill in your trip details and the crew will research, build, price and validate your plan.</p>
    </div>
  );
}

function Trace({ state }: { state: TripState }) {
  const idx = PHASES.indexOf(state.phase);
  const tokens = state.trace.reduce((a, t) => a + (t.tokensIn ?? 0) + (t.tokensOut ?? 0), 0);
  return (
    <div className="ticket p-5">
      <p className="label-mono">Workflow</p>
      <ol className="mt-3 space-y-1.5 font-mono text-xs">
        {PHASES.map((p, i) => (
          <li key={p} className={`flex items-center gap-2 ${i <= idx ? "text-foreground" : "text-muted-foreground"}`}>
            <span className={`size-2 rounded-full ${i < idx ? "bg-success" : i === idx ? (state.phase === "USER_REVIEW" ? "bg-success" : "pulse-dot bg-accent") : "bg-border"}`} />
            {p}
          </li>
        ))}
        {state.phase === "FAILED" && <li className="text-destructive">FAILED</li>}
      </ol>
      <p className="label-mono mt-5">Live agents</p>
      <ul className="mt-2 space-y-1 text-xs">
        {state.trace.slice(-10).map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate">
              <StatusIcon s={t.status} /> {AGENT_LABELS[t.agent]}{t.attempt > 1 ? ` · retry ${t.attempt - 1}` : ""}
            </span>
            <span className="font-mono text-muted-foreground">{t.ms ? `${(t.ms / 1000).toFixed(1)}s` : ""}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-[11px] text-muted-foreground">{tokens.toLocaleString()} tokens · {state.revisions} revision(s)</p>
    </div>
  );
}

function StatusIcon({ s }: { s: string }) {
  if (s === "running") return <Loader2 className="size-3 animate-spin text-accent" />;
  if (s === "ok") return <CheckCircle2 className="size-3 text-success" />;
  if (s === "fallback") return <AlertTriangle className="size-3 text-warning" />;
  return <XCircle className="size-3 text-destructive" />;
}

function Results({ state }: { state: TripState }) {
  const { input, research, itinerary, budget, validation } = state;
  const c = budget?.currency || input.currency;
  const done = state.phase === "USER_REVIEW";
  return (
    <div className="space-y-6">
      <header className="ticket p-6">
        <p className="label-mono">{input.origin} → {input.destination} · {input.days} days · {input.travelers} travellers · {input.pace}</p>
        <h1 className="mt-2 text-4xl font-bold">{input.destination}</h1>
        {research.destination?.summary && <p className="mt-3 text-muted-foreground">{research.destination.summary}</p>}
        {done && budget && (
          <div className="mt-5 flex flex-wrap gap-6 font-mono text-sm">
            <Stat k="Est. total" v={money(budget.total, c)} />
            <Stat k="Per person" v={money(budget.perPerson, c)} />
            <Stat k="Budget" v={budget.withinBudget ? "within" : "over"} tone={budget.withinBudget ? "text-success" : "text-destructive"} />
            {validation && <Stat k="Validator" v={`${validation.score ?? "—"}/100`} />}
          </div>
        )}
      </header>

      {(state.unresolved.length > 0 || state.phase === "FAILED") && (
        <div className="ticket border-warning p-5">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-warning" />
            {state.phase === "FAILED" ? "Planning could not complete" : "Unresolved issues — this plan does not fully meet your constraints"}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-muted-foreground">{state.unresolved.map((u, i) => <li key={i}>{u}</li>)}</ul>
        </div>
      )}

      {!done && state.phase !== "FAILED" && (
        <div className="ticket flex items-center gap-3 p-5 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Agents working… ({state.phase})</div>
      )}

      {(itinerary || research.destination) && (
        <Tabs key={itinerary ? "i" : "d"} defaultValue={itinerary ? "itinerary" : "discover"}>
          <TabsList className="no-print flex-wrap">
            {itinerary && <TabsTrigger value="itinerary">Itinerary</TabsTrigger>}
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="getting">Transport & stay</TabsTrigger>
            {budget && <TabsTrigger value="budget">Budget</TabsTrigger>}
            {validation && <TabsTrigger value="validation">Validation</TabsTrigger>}
            <TabsTrigger value="monitor">Monitoring</TabsTrigger>
          </TabsList>
          {itinerary && <TabsContent value="itinerary"><Itinerary it={itinerary} dest={input.destination} c={c} /></TabsContent>}
          <TabsContent value="discover"><Discover d={research.destination} w={research.weather} c={c} /></TabsContent>
          <TabsContent value="getting"><Getting t={research.transport} s={research.stay} c={c} /></TabsContent>
          {budget && <TabsContent value="budget"><Budget b={budget} c={c} /></TabsContent>}
          {validation && <TabsContent value="validation"><Validation v={validation} /></TabsContent>}
          <TabsContent value="monitor"><Monitor state={state} /></TabsContent>
        </Tabs>
      )}
      <p className="text-xs text-muted-foreground">All costs, durations and climate figures are AI estimates, not live prices, availability or forecasts. TripPilot never books or pays.</p>
    </div>
  );
}

function Stat({ k, v, tone = "" }: { k: string; v: string; tone?: string }) {
  return <div><div className="label-mono">{k}</div><div className={`text-lg font-semibold ${tone}`}>{v}</div></div>;
}
const mapLink = (q: string, dest: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${q}, ${dest}`)}`;

function Itinerary({ it, dest, c }: { it: AnyJson; dest: string; c: string }) {
  return (
    <div className="space-y-4">
      {(it.days ?? []).map((d: AnyJson) => (
        <article key={d.day} className="ticket overflow-hidden">
          <div className="flex items-baseline justify-between border-b border-dashed border-border bg-secondary px-5 py-3">
            <h3 className="text-xl font-bold">Day {d.day} · {d.theme}</h3>
            <span className="font-mono text-xs text-muted-foreground">{d.date}</span>
          </div>
          <ul className="divide-y divide-border">
            {(d.items ?? []).map((x: AnyJson, i: number) => (
              <li key={i} className="grid grid-cols-[64px_1fr_auto] gap-3 px-5 py-3">
                <span className="font-mono text-sm">{x.time}</span>
                <div>
                  <p className="font-medium">{x.title} <span className="label-mono ml-1">{x.type}</span></p>
                  <p className="text-sm text-muted-foreground">
                    {x.durationMins ? `${x.durationMins} min` : ""}{x.travelMinsFromPrev ? ` · ${x.travelMinsFromPrev} min travel` : ""}{x.note ? ` · ${x.note}` : ""}
                  </p>
                  {x.location && (
                    <a href={mapLink(x.location, dest)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      <MapPin className="size-3" />{x.location}
                    </a>
                  )}
                </div>
                <span className="font-mono text-sm text-muted-foreground">{x.estCostPerPerson ? `~${money(x.estCostPerPerson, c)}` : ""}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function Discover({ d, w, c }: { d: AnyJson; w: AnyJson; c: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="ticket p-5">
        <p className="label-mono">Highlights</p>
        <ul className="mt-3 space-y-3">
          {(d?.highlights ?? []).map((h: AnyJson, i: number) => (
            <li key={i}><p className="font-medium">{h.name} <span className="label-mono">{h.category}</span></p>
              <p className="text-sm text-muted-foreground">{h.why} · ~{h.estDurationHrs}h · ~{money(h.estCostPerPerson, c)}/pp</p></li>
          ))}
        </ul>
      </div>
      <div className="space-y-4">
        {w ? (
          <div className="ticket p-5">
            <p className="label-mono">Typical climate (not a forecast)</p>
            <p className="mt-2">{w.climateSummary}</p>
            <p className="mt-2 font-mono text-sm">{w.typicalLowC}°–{w.typicalHighC}°C · rain risk {w.rainRisk}</p>
            <p className="label-mono mt-4">Safety</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{(w.safetyNotes ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
            <p className="label-mono mt-4">Pack</p>
            <p className="text-sm text-muted-foreground">{(w.packing ?? []).join(" · ")}</p>
          </div>
        ) : <div className="ticket p-5 text-sm text-muted-foreground">Weather advisor unavailable.</div>}
        <div className="ticket p-5">
          <p className="label-mono">Local tips</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{(d?.localTips ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function Getting({ t, s, c }: { t: AnyJson; s: AnyJson; c: string }) {
  return (
    <div className="space-y-4">
      <div className="ticket overflow-x-auto p-5">
        <p className="label-mono">Getting there</p>
        {!t ? <p className="mt-2 text-sm text-muted-foreground">Transport planner unavailable.</p> : (
          <table className="mt-3 w-full text-sm">
            <thead className="label-mono text-left"><tr><th className="py-1">Mode</th><th>Duration</th><th>Est./pp</th><th>Pros / cons</th></tr></thead>
            <tbody>{(t.intercity ?? []).map((o: AnyJson, i: number) => (
              <tr key={i} className={`border-t border-border align-top ${i === t.recommendedIntercity ? "bg-secondary" : ""}`}>
                <td className="py-2 font-medium">{o.mode}{i === t.recommendedIntercity && <span className="label-mono ml-1 text-accent">pick</span>}</td>
                <td className="font-mono">{o.estDurationHrs}h</td><td className="font-mono">{money(o.estCostPerPerson, c)}</td>
                <td className="text-muted-foreground">+ {(o.pros ?? []).join(", ")}<br />− {(o.cons ?? []).join(", ")}</td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(s?.options ?? []).map((o: AnyJson, i: number) => (
          <div key={i} className={`ticket p-5 ${i === s.recommended ? "border-accent" : ""}`}>
            <p className="label-mono">{o.type}{i === s.recommended ? " · recommended" : ""}</p>
            <p className="mt-1 font-semibold">{o.name}</p>
            <p className="text-sm text-muted-foreground">{o.area}</p>
            <p className="mt-2 font-mono">~{money(o.estNightlyCostTotal, c)}/night</p>
            <p className="mt-2 text-xs text-muted-foreground">+ {(o.pros ?? []).join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Budget({ b, c }: { b: AnyJson; c: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="ticket p-5">
        <p className="label-mono">Itemised estimate</p>
        <ul className="mt-3 divide-y divide-dashed divide-border text-sm">
          {(b.lineItems ?? []).map((l: AnyJson, i: number) => (
            <li key={i} className="flex justify-between py-2"><span>{l.label} <span className="label-mono">{l.category}</span></span><span className="font-mono">{money(l.amount, c)}</span></li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t-2 border-foreground pt-2 font-semibold"><span>Total</span><span className="font-mono">{money(b.total, c)}</span></div>
        <div className="flex justify-between text-sm text-muted-foreground"><span>Budget</span><span className="font-mono">{money(b.budget, c)}</span></div>
      </div>
      <div className="ticket p-5">
        <p className="label-mono">Cheaper alternatives</p>
        <ul className="mt-3 space-y-2 text-sm">
          {(b.cheaperAlternatives ?? []).map((a: AnyJson, i: number) => (
            <li key={i} className="flex justify-between gap-3"><span>{a.suggestion}</span><span className="font-mono text-success">−{money(a.estSaving, c)}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Validation({ v }: { v: AnyJson }) {
  return (
    <div className="ticket p-5">
      <p className="label-mono">Critic report · {v.passed ? "passed" : "not passed"} · {v.score}/100</p>
      <ul className="mt-3 space-y-2 text-sm">
        {(v.checks ?? []).map((ch: AnyJson, i: number) => (
          <li key={i} className="flex gap-2">{ch.passed ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <XCircle className="size-4 shrink-0 text-destructive" />}
            <span><b>{ch.name}</b> — <span className="text-muted-foreground">{ch.detail}</span></span></li>
        ))}
      </ul>
      {(v.issues ?? []).length > 0 && <>
        <p className="label-mono mt-5">Issues</p>
        <ul className="mt-2 space-y-1 text-sm">{v.issues.map((x: AnyJson, i: number) => (
          <li key={i}><span className="label-mono">{x.severity} · {x.responsibleAgent}</span> {x.description}</li>))}</ul>
      </>}
    </div>
  );
}

function Monitor({ state }: { state: TripState }) {
  const t = state.trace.filter((x) => x.status !== "running");
  const ok = t.filter((x) => x.status === "ok").length;
  const fails = t.filter((x) => x.status === "error").length;
  const retries = t.filter((x) => x.attempt > 1).length;
  const tin = t.reduce((a, x) => a + (x.tokensIn ?? 0), 0);
  const tout = t.reduce((a, x) => a + (x.tokensOut ?? 0), 0);
  const first = state.trace[0]?.startedAt;
  const last = Math.max(...t.map((x) => x.endedAt ?? 0), 0);
  return (
    <div className="space-y-4">
      <div className="ticket grid grid-cols-2 gap-4 p-5 md:grid-cols-6">
        <Stat k="Agent calls" v={String(t.length)} /><Stat k="Succeeded" v={String(ok)} />
        <Stat k="Failures" v={String(fails)} tone={fails ? "text-destructive" : ""} /><Stat k="Retries" v={String(retries)} />
        <Stat k="Tokens in/out" v={`${tin}/${tout}`} /><Stat k="Wall time" v={first && last ? `${((last - first) / 1000).toFixed(1)}s` : "—"} />
      </div>
      <div className="ticket overflow-x-auto p-5">
        <p className="label-mono">Execution trace (this session only)</p>
        <table className="mt-3 w-full font-mono text-xs">
          <thead className="label-mono text-left"><tr><th>Time</th><th>Agent</th><th>Try</th><th>Status</th><th>ms</th><th>Tokens</th><th>Error</th></tr></thead>
          <tbody>{state.trace.map((x) => (
            <tr key={x.id} className="border-t border-border">
              <td className="py-1">{new Date(x.startedAt).toLocaleTimeString()}</td><td>{AGENT_LABELS[x.agent as AgentId]}</td><td>{x.attempt}</td>
              <td>{x.status}</td><td>{x.ms ?? ""}</td><td>{x.tokensIn != null ? `${x.tokensIn}/${x.tokensOut}` : ""}</td><td className="text-destructive">{x.error ?? ""}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
