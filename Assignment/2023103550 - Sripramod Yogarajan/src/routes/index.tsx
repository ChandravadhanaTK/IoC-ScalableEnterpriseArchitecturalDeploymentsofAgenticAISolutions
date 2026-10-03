import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SAMPLES, SAMPLE_POLICY } from "@/lib/samples";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ticket Rescue — Multi-agent complaint resolution" },
      { name: "description", content: "Watch five AI agents triage, diagnose, check policy, write and QA a reply to any customer complaint." },
      { property: "og:title", content: "Ticket Rescue — Multi-agent complaint resolution" },
      { property: "og:description", content: "Triage → Specialist → Policy → Writer → QA, live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Status = "idle" | "running" | "done" | "error" | "skipped";
type Run = { attempt?: number; status: Status; output?: unknown; ms?: number; error?: string; startedAt: number };
type Final = { reply: string; summary: Record<string, unknown>; scores: number[]; escalate: boolean; escalateReasons: string[] };
type Log = { t: number; line: string };

const SPECIALISTS = ["billing", "technical", "logistics"] as const;
const AGENT_LABEL: Record<string, string> = {
  triage: "Triage", billing: "Billing", technical: "Technical", logistics: "Logistics",
  policy: "Policy", writer: "Writer", qa: "QA",
};

function Index() {
  const [complaint, setComplaint] = useState("");
  const [policy, setPolicy] = useState(SAMPLE_POLICY);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [runs, setRuns] = useState<Record<string, Run[]>>({});
  const [route, setRoute] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [final, setFinal] = useState<Final | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const t0 = useRef(0);

  const log = (line: string) => setLogs((l) => [...l, { t: Date.now() - t0.current, line }]);

  async function resolve() {
    if (complaint.trim().length < 10) { setError("Please describe the complaint (at least 10 characters)."); return; }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setRuns({}); setRoute(null); setActive(null); setAttempt(0); setFinal(null); setError(null); setLogs([]);
    setBusy(true); t0.current = Date.now();
    log("POST /api/resolve");
    try {
      const res = await fetch("/api/resolve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint, policy }), signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const ln of lines) if (ln.trim()) handle(JSON.parse(ln));
      }
    } catch (e: any) {
      if (e.name !== "AbortError") { setError(e.message); log(`ERROR ${e.message}`); }
    } finally {
      setBusy(false); setActive(null);
    }
  }

  function handle(ev: any) {
    if (ev.type === "stage") {
      log(`${ev.agent}${ev.attempt ? `#${ev.attempt}` : ""} ${ev.status}${ev.ms ? ` (${ev.ms}ms)` : ""}${ev.error ? ` — ${ev.error}` : ""}`);
      if (ev.status === "running") {
        setActive(ev.agent);
        if (ev.agent === "writer") setAttempt(ev.attempt);
        setRuns((r) => ({ ...r, [ev.agent]: [...(r[ev.agent] ?? []), { attempt: ev.attempt, status: "running", startedAt: Date.now() }] }));
      } else {
        setRuns((r) => {
          const list = [...(r[ev.agent] ?? [])];
          const prev = list[list.length - 1];
          if (!prev) return r;
          list[list.length - 1] = { ...prev, status: ev.status, output: ev.output, ms: ev.ms, error: ev.error };
          return { ...r, [ev.agent]: list };
        });
      }
    } else if (ev.type === "route") { setRoute(ev.route); log(`routed → ${ev.route}`); }
    else if (ev.type === "final") { setFinal(ev); log(`final — scores ${ev.scores.join(", ")}`); }
    else if (ev.type === "error") { setError(ev.message); log(`ERROR ${ev.status ?? ""} ${ev.message}`); }
  }

  useEffect(() => () => abortRef.current?.abort(), []);

  const statusOf = (a: string): Status => {
    if (SPECIALISTS.includes(a as any) && route && route !== a) return "skipped";
    const l = runs[a]; return l?.at(-1)?.status ?? "idle";
  };
  const looped = (runs["qa"]?.length ?? 0) > 1 || attempt > 1;

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Multi-agent support desk</p>
          <h1 className="text-4xl font-bold tracking-tight">Ticket Rescue</h1>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
          <a href="#how" className="hover:text-primary">How it works ↓</a>
          <button onClick={() => setShowLogs((s) => !s)} className="rounded border border-border px-3 py-1.5 hover:border-primary hover:text-primary">
            {showLogs ? "Hide" : "View"} agent logs
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(280px,1fr)_minmax(320px,1.2fr)_minmax(300px,1.1fr)]">
        {/* LEFT */}
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <PanelTitle n="01" title="Complaint" />
          <select
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            value=""
            onChange={(e) => { const s = SAMPLES[e.target.value]; if (s) setComplaint(s.text); }}
          >
            <option value="">Load sample complaint…</option>
            {Object.entries(SAMPLES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          <textarea
            value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={8}
            placeholder="Paste the customer's complaint here…"
            className="w-full resize-y rounded border border-input bg-background p-3 text-sm outline-none focus:border-primary"
          />
          <div className="rounded border border-border">
            <button onClick={() => setPolicyOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium">
              Company policy <span className="font-mono text-muted-foreground">{policyOpen ? "−" : "+"}</span>
            </button>
            {policyOpen && (
              <textarea value={policy} onChange={(e) => setPolicy(e.target.value)} rows={10}
                className="w-full resize-y border-t border-border bg-background p-3 font-mono text-xs outline-none" />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={resolve} disabled={busy}
              className="flex-1 rounded bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
              {busy ? "Resolving…" : "Resolve"}
            </button>
            {busy && <button onClick={() => abortRef.current?.abort()} className="rounded border border-border px-3 text-sm">Stop</button>}
          </div>
          {error && <div className="rounded border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </section>

        {/* CENTER */}
        <section className="rounded-lg border border-border bg-card p-4">
          <PanelTitle n="02" title="Live flow" />
          <FlowDiagram statusOf={statusOf} active={active} attempt={attempt} looped={looped} />
        </section>

        {/* RIGHT */}
        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <PanelTitle n="03" title="Agents" />
          {["triage", ...SPECIALISTS, "policy", "writer", "qa"].map((a) => (
            <AgentCard key={a} name={a} status={statusOf(a)} runs={runs[a] ?? []} />
          ))}
        </section>
      </div>

      {showLogs && (
        <section className="mt-5 rounded-lg border border-border bg-background p-4 font-mono text-xs">
          <PanelTitle n="LOG" title="Agent logs" />
          {logs.length === 0 ? <p className="text-muted-foreground">No activity yet.</p> :
            logs.map((l, i) => (
              <div key={i} className={l.line.includes("ERROR") ? "text-destructive" : ""}>
                <span className="text-muted-foreground">+{(l.t / 1000).toFixed(2)}s</span> {l.line}
              </div>
            ))}
        </section>
      )}

      {/* BOTTOM */}
      {final && <Results final={final} />}

      <section id="how" className="mt-10 rounded-lg border border-border bg-card p-6">
        <PanelTitle n="?" title="How it works" />
        <ol className="grid gap-4 md:grid-cols-5">
          {[
            ["Triage", "Classifies category, urgency, sentiment and intent, then picks a route."],
            ["Specialist", "Only the matching expert (billing, technical or logistics) diagnoses and proposes a fix."],
            ["Policy", "Checks the fix against your policy text and adjusts it if it breaks a rule."],
            ["Writer", "Drafts the customer reply in a tone matched to their sentiment."],
            ["QA", "Scores the draft 0–10. Below 8, it goes back to the writer with feedback — up to 2 retries."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded border border-border p-4">
              <p className="font-mono text-xs text-primary">0{i + 1}</p>
              <p className="mt-1 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          Every step is a real AI call. Cases are flagged for a human when urgency is high or QA never reaches 8.
        </p>
      </section>
    </main>
  );
}

function PanelTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
      <span className="text-primary">{n}</span> {title}
    </div>
  );
}

const nodeCls: Record<Status, string> = {
  idle: "border-border bg-background text-muted-foreground",
  running: "border-primary bg-primary/10 text-foreground node-active",
  done: "border-success bg-success/10 text-foreground",
  error: "border-destructive bg-destructive/10 text-destructive",
  skipped: "border-border/40 bg-muted/30 text-muted-foreground/40 line-through",
};

function Node({ id, status, w = 140 }: { id: string; status: Status; w?: number }) {
  return (
    <div style={{ width: w }} className={`rounded-md border px-3 py-2 text-center text-sm font-medium transition-all ${nodeCls[status]}`}>
      <div>{AGENT_LABEL[id]}</div>
      <div className="font-mono text-[10px] uppercase opacity-70">{status}</div>
    </div>
  );
}

function Arrow({ live }: { live: boolean }) {
  return (
    <svg width="2" height="28" className="mx-auto block overflow-visible">
      <line x1="1" y1="0" x2="1" y2="28" className={live ? "stroke-primary flow-dash" : "stroke-border"} strokeWidth="2" />
    </svg>
  );
}

function FlowDiagram({ statusOf, active, attempt, looped }: { statusOf: (a: string) => Status; active: string | null; attempt: number; looped: boolean }) {
  const s = statusOf;
  return (
    <div className="flex flex-col items-center py-2">
      <Node id="triage" status={s("triage")} />
      <Arrow live={!!active && active !== "triage"} />
      <div className="flex gap-2">
        {SPECIALISTS.map((a) => <Node key={a} id={a} status={s(a)} w={100} />)}
      </div>
      <Arrow live={["policy", "writer", "qa"].includes(active ?? "") || s("policy") === "done"} />
      <Node id="policy" status={s("policy")} />
      <Arrow live={["writer", "qa"].includes(active ?? "") || s("writer") === "done"} />
      <div className="relative flex flex-col items-center">
        <Node id="writer" status={s("writer")} />
        <Arrow live={active === "qa" || s("qa") === "done"} />
        <Node id="qa" status={s("qa")} />
        {looped && (
          <div className="absolute -right-24 top-4 flex h-[calc(100%-2rem)] items-center">
            <svg width="40" height="100%" viewBox="0 0 40 100" preserveAspectRatio="none" className="h-full">
              <path d="M2 95 C 38 95, 38 5, 2 5" fill="none" strokeWidth="2" className="stroke-primary flow-dash" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="ml-1 rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary-foreground">
              {Math.min(attempt, 3)}/3
            </span>
          </div>
        )}
      </div>
      {attempt > 0 && !looped && <p className="mt-3 font-mono text-[10px] text-muted-foreground">attempt {attempt}/3</p>}
    </div>
  );
}

function Elapsed({ run }: { run: Run }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (run.status !== "running") return;
    const i = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(i);
  }, [run.status]);
  const ms = run.ms ?? now - run.startedAt;
  return <span>{(ms / 1000).toFixed(1)}s</span>;
}

function AgentCard({ name, status, runs }: { name: string; status: Status; runs: Run[] }) {
  const [open, setOpen] = useState(false);
  if (status === "skipped") {
    return <div className="rounded border border-border/40 px-3 py-2 text-sm text-muted-foreground/50">{AGENT_LABEL[name]} — not routed</div>;
  }
  const last = runs[runs.length - 1];
  const dot = { idle: "bg-border", running: "bg-primary animate-pulse", done: "bg-success", error: "bg-destructive", skipped: "bg-border" }[status];
  return (
    <div className={`rounded border ${status === "running" ? "border-primary" : "border-border"}`}>
      <button onClick={() => setOpen((o) => !o)} disabled={!runs.length} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="font-medium">{AGENT_LABEL[name]}</span>
        {runs.length > 1 && <span className="font-mono text-[10px] text-muted-foreground">×{runs.length}</span>}
        <span className="ml-auto font-mono text-xs text-muted-foreground">{last ? <Elapsed run={last} /> : "—"}</span>
        {runs.length > 0 && <span className="font-mono text-muted-foreground">{open ? "−" : "+"}</span>}
      </button>
      {open && runs.map((r, i) => (
        <div key={i} className="border-t border-border p-2">
          {r.attempt && <p className="mb-1 font-mono text-[10px] text-primary">attempt {r.attempt}</p>}
          {r.error ? <p className="text-xs text-destructive">{r.error}</p> :
            r.output ? <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px] text-accent">{JSON.stringify(r.output, null, 2)}</pre> :
            <p className="text-xs text-muted-foreground">Working…</p>}
        </div>
      ))}
    </div>
  );
}

function Results({ final }: { final: Final }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <PanelTitle n="04" title="Customer reply" />
          <div className="flex items-center gap-2">
            {final.escalate && (
              <span className="rounded bg-destructive px-2 py-1 font-mono text-[10px] font-bold uppercase text-destructive-foreground" title={final.escalateReasons.join(", ")}>
                Escalate to human · {final.escalateReasons.join(" · ")}
              </span>
            )}
            <button
              onClick={() => { navigator.clipboard.writeText(final.reply); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="rounded border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{final.reply}</p>
      </div>
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <PanelTitle n="05" title="QA score history" />
          <div className="flex items-end gap-3">
            {final.scores.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-sm font-bold">{s}</span>
                <div className="flex h-24 w-full items-end rounded bg-muted">
                  <div style={{ height: `${s * 10}%` }} className={`w-full rounded ${s >= 8 ? "bg-success" : "bg-primary"}`} />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">Pass threshold: 8</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <PanelTitle n="06" title="Internal case summary" />
          <dl className="space-y-1.5 text-sm">
            {Object.entries(final.summary).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[130px_1fr] gap-2">
                <dt className="font-mono text-xs text-muted-foreground">{k}</dt>
                <dd>{Array.isArray(v) ? (v.length ? v.join("; ") : "none") : String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
