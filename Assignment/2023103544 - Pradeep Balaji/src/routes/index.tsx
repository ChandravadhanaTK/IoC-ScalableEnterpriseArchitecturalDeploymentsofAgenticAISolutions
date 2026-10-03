import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SAMPLE_LEASE } from "@/lib/sample-lease";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lease Guard — Multi-agent AI lease review" },
      { name: "description", content: "Paste your rental agreement and a team of AI agents flags risks, questions and a negotiation email." },
      { property: "og:title", content: "Lease Guard — Multi-agent AI lease review" },
      { property: "og:description", content: "A team of AI agents reviews your lease for legal, financial and tenant-rights risks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Status = "idle" | "running" | "done" | "error";
type AgentId = "orchestrator" | "legal" | "financial" | "tenant_rights" | "critic" | "synthesizer";
type AgentState = { status: Status; ms?: number; start?: number; raw?: string; output?: unknown };

const AGENTS: { id: AgentId; name: string; role: string }[] = [
  { id: "orchestrator", name: "Orchestrator", role: "Splits the lease & assigns clauses" },
  { id: "legal", name: "Legal", role: "Liability, termination, enforceability" },
  { id: "financial", name: "Financial", role: "Rent, deposits, fees, penalties" },
  { id: "tenant_rights", name: "Tenant Rights", role: "Privacy, repairs, protections" },
  { id: "critic", name: "Critic", role: "Checks contradictions & gaps" },
  { id: "synthesizer", name: "Synthesizer", role: "Writes the final report" },
];

type Report = {
  risk_score?: number;
  risk_label?: string;
  summary?: string;
  red_flags?: { title: string; severity: string; clause?: string; why_it_matters?: string }[];
  questions_for_landlord?: string[];
  negotiation_email?: { subject?: string; body?: string };
};

const initial = () => Object.fromEntries(AGENTS.map((a) => [a.id, { status: "idle" }])) as Record<AgentId, AgentState>;

function Index() {
  const [lease, setLease] = useState("");
  const [agents, setAgents] = useState(initial);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => tick((n) => n + 1), 100);
    return () => clearInterval(t);
  }, [busy]);

  async function analyze() {
    setBusy(true);
    setError(null);
    setReport(null);
    setAgents(initial());
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lease }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Couldn't start the analysis.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "status") {
            setAgents((p) => ({
              ...p,
              [ev.agent]: {
                ...p[ev.agent as AgentId],
                status: ev.status,
                ms: ev.ms,
                start: ev.status === "running" ? Date.now() : p[ev.agent as AgentId].start,
                raw: ev.raw,
                output: ev.output,
              },
            }));
          } else if (ev.type === "report") setReport(ev.report);
          else if (ev.type === "error") setError(ev.message);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">LG</div>
            <div>
              <h1 className="text-lg font-bold">Lease Guard</h1>
              <p className="text-xs text-muted-foreground">Multi-agent rental agreement review</p>
            </div>
          </div>
          <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">Not legal advice</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <FlowDiagram agents={agents} />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Your lease</h2>
              <button onClick={() => setLease(SAMPLE_LEASE)} disabled={busy} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50">
                Load sample lease
              </button>
            </div>
            <textarea
              value={lease}
              onChange={(e) => setLease(e.target.value)}
              placeholder="Paste the full text of your rental agreement here…"
              className="min-h-[460px] flex-1 resize-y rounded-lg border bg-background p-4 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{lease.length.toLocaleString()} characters</span>
              <button onClick={analyze} disabled={busy || lease.trim().length < 50} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40">
                {busy ? "Analyzing…" : "Analyze"}
              </button>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">Agent Pipeline</h2>
            <div className="space-y-2.5">
              {AGENTS.map((a) => (
                <AgentCard key={a.id} meta={a} s={agents[a.id]} />
              ))}
            </div>
          </section>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        )}

        {report && <ReportView r={report} />}

        <HowItWorks />

        <p className="pb-6 text-center text-xs text-muted-foreground">
          Lease Guard is an AI tool and may make mistakes. Not legal advice — consult a licensed attorney or local tenant union.
        </p>
      </main>
    </div>
  );
}

function elapsed(s: AgentState) {
  const ms = s.status === "running" && s.start ? Date.now() - s.start : s.ms;
  return ms != null ? `${(ms / 1000).toFixed(1)}s` : "—";
}

function Node({ a, s }: { a: (typeof AGENTS)[number]; s: AgentState }) {
  const cls =
    s.status === "running"
      ? "glow-active bg-accent text-accent-foreground animate-pulse"
      : s.status === "done"
        ? "bg-primary text-primary-foreground"
        : s.status === "error"
          ? "bg-destructive text-destructive-foreground"
          : "bg-muted text-muted-foreground";
  return <div className={`rounded-lg px-3 py-2 text-center text-xs font-semibold transition-all ${cls}`}>{a.name}</div>;
}

function FlowDiagram({ agents }: { agents: Record<AgentId, AgentState> }) {
  const g = (id: AgentId) => AGENTS.find((a) => a.id === id)!;
  const Arrow = () => <div className="h-px w-6 shrink-0 bg-border sm:w-10" />;
  return (
    <section className="overflow-x-auto rounded-xl border bg-card p-5">
      <div className="flex min-w-[640px] items-center justify-center gap-1">
        <Node a={g("orchestrator")} s={agents.orchestrator} />
        <Arrow />
        <div className="flex flex-col gap-2 border-l border-r px-3 py-1">
          {(["legal", "financial", "tenant_rights"] as AgentId[]).map((id) => (
            <Node key={id} a={g(id)} s={agents[id]} />
          ))}
          <span className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">parallel</span>
        </div>
        <Arrow />
        <Node a={g("critic")} s={agents.critic} />
        <Arrow />
        <Node a={g("synthesizer")} s={agents.synthesizer} />
        <Arrow />
        <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">Report</div>
      </div>
    </section>
  );
}

function AgentCard({ meta, s }: { meta: (typeof AGENTS)[number]; s: AgentState }) {
  const [open, setOpen] = useState(false);
  const label = { idle: "Idle", running: "Running", done: "Done", error: "Error" }[s.status];
  const badge = {
    idle: "bg-muted text-muted-foreground",
    running: "bg-accent text-accent-foreground",
    done: "bg-success/15 text-success",
    error: "bg-destructive/15 text-destructive",
  }[s.status];
  return (
    <div className={`rounded-lg border p-3 transition-all ${s.status === "running" ? "glow-active" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-5 w-5 place-items-center">
          {s.status === "running" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <div className={`h-2.5 w-2.5 rounded-full ${s.status === "done" ? "bg-success" : s.status === "error" ? "bg-destructive" : "bg-border"}`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{meta.name}</div>
          <div className="truncate text-xs text-muted-foreground">{meta.role}</div>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{elapsed(s)}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge}`}>{label}</span>
        <button disabled={!s.raw} onClick={() => setOpen((o) => !o)} className="text-xs text-primary disabled:opacity-30">
          {open ? "Hide" : "Raw"}
        </button>
      </div>
      {open && s.output != null && (
        <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] leading-relaxed">
          {JSON.stringify(s.output, null, 2)}
        </pre>
      )}
    </div>
  );
}

const SEV: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning/20 text-warning",
  medium: "bg-caution/20 text-foreground",
  low: "bg-success/15 text-success",
};

function Gauge({ score }: { score: number }) {
  const v = Math.max(0, Math.min(100, score));
  const r = 80;
  const len = Math.PI * r;
  const color = v >= 70 ? "var(--destructive)" : v >= 40 ? "var(--warning)" : "var(--success)";
  return (
    <svg viewBox="0 0 200 120" className="w-56">
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--muted)" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - v / 100)} style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="100" y="92" textAnchor="middle" className="fill-foreground font-display" fontSize="36" fontWeight="700">{Math.round(v)}</text>
      <text x="100" y="114" textAnchor="middle" className="fill-muted-foreground" fontSize="10">RISK / 100</text>
    </svg>
  );
}

function ReportView({ r }: { r: Report }) {
  const [copied, setCopied] = useState(false);
  const email = `Subject: ${r.negotiation_email?.subject ?? ""}\n\n${r.negotiation_email?.body ?? ""}`;
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return (
    <section ref={ref} className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex flex-col items-center gap-6 md:flex-row">
        <Gauge score={Number(r.risk_score ?? 0)} />
        <div>
          <h2 className="text-2xl font-bold">{r.risk_label ?? "Risk report"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Top red flags</h3>
        <div className="space-y-2">
          {(r.red_flags ?? []).slice(0, 5).map((f, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${SEV[f.severity?.toLowerCase()] ?? SEV['medium']}`}>{f.severity}</span>
                <span className="text-sm font-semibold">{f.title}</span>
              </div>
              {f.clause && <p className="mt-1 text-xs text-muted-foreground">Clause: {f.clause}</p>}
              <p className="mt-1 text-sm">{f.why_it_matters}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Questions to ask the landlord</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {(r.questions_for_landlord ?? []).map((q, i) => <li key={i}>{q}</li>)}
          </ol>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Negotiation email</h3>
            <button onClick={() => { navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{email}</pre>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["1. Orchestrate", "The Orchestrator reads your lease, decides which specialists are needed and assigns each clause to them."],
    ["2. Specialists in parallel", "Legal, Financial and Tenant Rights agents run at the same time, each with its own instructions and output format."],
    ["3. Critique", "The Critic cross-checks all findings against the lease text, flags contradictions and unsupported claims, and adds missed issues."],
    ["4. Synthesize", "The Synthesizer applies the corrections and writes your report: risk score, red flags, questions and an email."],
  ];
  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="mb-4 text-xl font-bold">How it works</h2>
      <div className="grid gap-4 md:grid-cols-4">
        {steps.map(([t, d]) => (
          <div key={t} className="rounded-lg bg-muted p-4">
            <div className="text-sm font-semibold text-primary">{t}</div>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Each stage reports back live, so you can watch the pipeline progress and open any agent's raw output.</p>
    </section>
  );
}
