import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Cloud, Database, GitBranch, KeyRound, Lock, Monitor, Network, Rocket, Server, ShieldCheck, Workflow, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture & Security Blueprint — CareRoute" },
      { name: "description", content: "Capstone deliverables: architecture diagram, agent workflow, deployment strategy, security model and monitoring design." },
      { property: "og:title", content: "Architecture & Security Blueprint — CareRoute" },
      { property: "og:description", content: "Capstone deliverables: architecture diagram, agent workflow, deployment strategy, security model and monitoring design." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Architecture,
});

const DELIVERABLES = [
  { n: 1, id: "topology", title: "Architecture Diagram", desc: "Layers, components, trust boundaries and integrations", c: "bg-agent-1" },
  { n: 2, id: "workflow", title: "Agent Workflow Design", desc: "Roles, states, tools, handoffs, approvals and failure paths", c: "bg-agent-2" },
  { n: 3, id: "deployment", title: "Deployment Strategy", desc: "Runtime, scaling, resilience, environments and release", c: "bg-agent-3" },
  { n: 4, id: "security", title: "Security Model", desc: "Identity, authorization, secrets, privacy, guardrails and audit", c: "bg-agent-4" },
  { n: 5, id: "monitoring", title: "Monitoring Dashboard Design", desc: "Health, trace, quality, safety, cost and business outcomes", c: "bg-chart-2" },
];

function Architecture() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-nav p-6 text-nav-foreground">
        <h1 className="text-2xl font-bold uppercase tracking-wide">Capstone Deliverables</h1>
        <p className="mb-5 border-b border-nav-border pb-3 text-sm text-nav-muted">Five artifacts that demonstrate enterprise architecture completeness</p>
        <div className="space-y-3">
          {DELIVERABLES.map((d) => (
            d.id === "monitoring" ? (
              <Link key={d.n} to="/monitoring" className="grid items-center gap-4 rounded-lg border border-nav-border bg-nav-border/40 px-4 py-3 transition-colors hover:bg-nav-border sm:grid-cols-[40px_260px_1fr_20px]">
                <Row d={d} />
              </Link>
            ) : (
              <a key={d.n} href={`#${d.id}`} className="grid items-center gap-4 rounded-lg border border-nav-border bg-nav-border/40 px-4 py-3 transition-colors hover:bg-nav-border sm:grid-cols-[40px_260px_1fr_20px]">
                <Row d={d} />
              </a>
            )
          ))}
        </div>
      </section>
      <Topology />
      <WorkflowSection />
      <Deployment />
      <Security />
    </div>
  );
}

function Row({ d }: { d: (typeof DELIVERABLES)[number] }) {
  return (
    <>
      <span className={cn("grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-primary-foreground", d.c)}>{d.n}</span>
      <span className="text-lg font-bold">{d.title}</span>
      <span className="text-sm text-nav-muted">{d.desc}</span>
      <ArrowRight className="hidden h-4 w-4 text-nav-muted sm:block" />
    </>
  );
}

function H({ id, n, icon: Icon, title, sub }: { id: string; n: number; icon: typeof Cloud; title: string; sub: string }) {
  return (
    <div id={id} className="mb-4 scroll-mt-28">
      <div className="font-mono text-xs text-primary">DELIVERABLE {n}</div>
      <h2 className="flex items-center gap-2 text-xl font-bold"><Icon className="h-5 w-5 text-primary" /> {title}</h2>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

const LAYERS = [
  { name: "Client DMZ", icon: Monitor, trust: "Untrusted · public internet", items: ["Patient web / mobile chat", "Clinician portal (SSO)", "SMS / email gateways", "WAF + CDN + rate limiting", "API gateway (OAuth 2.0 / OIDC)"] },
  { name: "Agent Orchestration Gateway", icon: Workflow, trust: "Trusted compute · no PHI at rest", items: ["Orchestrator (state machine)", "Symptom Triage Agent", "Scheduling Agent", "Doctor Summary Agent", "Follow-Up Reminder Agent", "Guardrail & safety filter service", "PII de-identification proxy → ZDR LLM endpoint"] },
  { name: "PHI-Isolated Data Tier", icon: Database, trust: "Restricted · private subnet · KMS", items: ["FHIR server (Patient, Schedule, Slot, Appointment)", "Encounter & transcript store (AES-256)", "EHR integration engine (HL7v2 / FHIR R4)", "Immutable audit log (WORM)", "Event bus + dead-letter queue"] },
];

function Topology() {
  return (
    <section>
      <H id="topology" n={1} icon={Network} title="Layered System Topology" sub="Three trust zones; every boundary crossing is authenticated, encrypted and logged." />
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {LAYERS.map((l, i) => (
          <>
            <div key={l.name} className="rounded-xl border-2 border-dashed bg-card p-4">
              <div className="flex items-center gap-2 font-bold"><l.icon className="h-5 w-5 text-primary" /> {l.name}</div>
              <div className="mb-3 font-mono text-[11px] text-muted-foreground">{l.trust}</div>
              <ul className="space-y-1.5">
                {l.items.map((it) => <li key={it} className="rounded-md border bg-muted/50 px-2.5 py-1.5 text-sm">{it}</li>)}
              </ul>
            </div>
            {i < 2 && (
              <div key={`b${i}`} className="flex items-center justify-center gap-1 py-1 text-muted-foreground lg:flex-col">
                <Lock className="h-4 w-4" /><span className="font-mono text-[10px]">TLS 1.3 · mTLS</span><ArrowRight className="h-4 w-4 rotate-90 lg:rotate-0" />
              </div>
            )}
          </>
        ))}
      </div>
    </section>
  );
}

const NODES = [
  { id: "intake", label: "Intake", agent: "Triage", tools: "chat.ask, nlu.extract", guard: "Medical disclaimer shown; PII redaction before LLM", fail: "LLM timeout → scripted question fallback" },
  { id: "triage", label: "Triage Assessment", agent: "Triage", tools: "esi.classify, redflag.scan", guard: "G-01 red-flag lockout → ED redirect; no Rx advice", fail: "Low confidence (<0.7) → nurse review queue" },
  { id: "match", label: "Specialty Match", agent: "Scheduling", tools: "specialty.map, provider.search", guard: "ESI 1–2 can never reach this state", fail: "No specialty → Family Medicine default" },
  { id: "slot", label: "Slot Selection", agent: "Scheduling", tools: "fhir.Slot.search, payer.eligibility", guard: "Patient must explicitly confirm; urgent window enforced", fail: "FHIR 5xx → circuit breaker, callback request" },
  { id: "confirm", label: "Confirmation", agent: "Scheduling", tools: "fhir.Appointment.create", guard: "Idempotency key prevents double-booking", fail: "Write fails → DLQ + retry with backoff" },
  { id: "summary", label: "Clinician Summary", agent: "Doctor Summary", tools: "soap.draft, sbar.draft", guard: "Human-in-the-loop sign-off required before EHR push", fail: "Draft rejected → physician edits inline" },
  { id: "follow", label: "Follow-Up", agent: "Follow-Up", tools: "sms.send, email.send, portal.notify", guard: "Opt-in consent; minimum-necessary content", fail: "Reply WORSE → re-enter Triage Assessment" },
];

function WorkflowSection() {
  const [sel, setSel] = useState(NODES[1]!.id);
  const n = NODES.find((x) => x.id === sel) ?? NODES[0]!;
  return (
    <section>
      <H id="workflow" n={2} icon={GitBranch} title="Agent State Machine & Handoffs" sub="Click a state to inspect tools, guardrails and failure fallbacks." />
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          {NODES.map((x, i) => (
            <div key={x.id} className="flex items-center gap-2">
              <button onClick={() => setSel(x.id)} className={cn("rounded-lg border-2 px-3 py-2 text-left text-sm transition-all", sel === x.id ? "border-primary bg-primary text-primary-foreground shadow-lg" : "hover:border-primary/50")}>
                <div className="font-semibold">{x.label}</div>
                <div className="text-[10px] opacity-75">{x.agent} agent</div>
              </button>
              {i < NODES.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="rounded border border-emergency/30 bg-emergency/10 px-2 py-1 text-emergency">Triage Assessment ──red flag──▶ ED Redirect (terminal)</span>
          <span className="rounded border border-urgent/30 bg-urgent/10 px-2 py-1 text-urgent">Follow-Up ──worsening──▶ Triage Assessment</span>
          <span className="rounded border bg-muted px-2 py-1">Any state ──unrecoverable──▶ Human nurse handoff</span>
        </div>
        <div key={n.id} className="mt-4 grid animate-in fade-in gap-3 sm:grid-cols-3">
          <Info t="Tools" v={n.tools} mono />
          <Info t="Guardrail / approval" v={n.guard} />
          <Info t="Failure path" v={n.fail} />
        </div>
      </div>
    </section>
  );
}

function Info({ t, v, mono }: { t: string; v: string; mono?: boolean }) {
  return <div className="rounded-lg bg-muted/60 p-3"><div className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">{t}</div><p className={cn("text-sm", mono && "font-mono text-xs")}>{v}</p></div>;
}

function Deployment() {
  const cards = [
    { t: "Runtime", d: "Containerized agents on managed Kubernetes; stateless pods, autoscaled on queue depth and P95 latency (HPA 2→40)." },
    { t: "Circuit breakers", d: "Per-dependency breakers on FHIR, payer and LLM calls (open after 5 failures / 30s, half-open probe)." },
    { t: "Dead-letter queues", d: "Failed bookings, EHR pushes and notifications land in DLQs with replay tooling and on-call alerts." },
    { t: "Zero-data-retention LLM", d: "Model endpoints contracted with ZDR + BAA; only de-identified context leaves the orchestration tier." },
    { t: "Multi-region failover", d: "Active-passive across two regions; RPO 5 min, RTO 15 min; FHIR store replicated, DNS health-checked." },
    { t: "Release", d: "Canary 5% → 25% → 100% with automated rollback on safety-metric regression; prompts versioned like code." },
  ];
  const envs = ["Dev (synthetic data)", "Clinical QA (golden triage set)", "Staging (de-identified replay)", "Prod (canary)"];
  return (
    <section>
      <H id="deployment" n={3} icon={Rocket} title="Deployment & Resilience Strategy" sub="Built to degrade safely: when anything fails, patients reach a human." />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {envs.map((e, i) => <div key={e} className="flex items-center gap-2"><span className="rounded-full border bg-card px-3 py-1 text-sm"><Server className="mr-1 inline h-3.5 w-3.5 text-primary" />{e}</span>{i < envs.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}</div>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <div key={c.t} className="rounded-xl border bg-card p-4"><div className="mb-1 font-semibold">{c.t}</div><p className="text-sm text-muted-foreground">{c.d}</p></div>)}
      </div>
    </section>
  );
}

const ROLES = ["Patient", "Triage Nurse", "Physician", "EHR Admin"];
const PERMS: [string, string[]][] = [
  ["Own intake chat & bookings", ["✓", "✓", "✓", "—"]],
  ["View triage queue", ["—", "✓", "✓", "—"]],
  ["Override ESI acuity", ["—", "✓", "✓", "—"]],
  ["Edit / sign SOAP note", ["—", "—", "✓", "—"]],
  ["Push to EHR", ["—", "—", "✓", "—"]],
  ["Manage integrations & keys", ["—", "—", "—", "✓"]],
  ["Read audit log", ["—", "Own", "Own", "✓"]],
];

function Security() {
  return (
    <section>
      <H id="security" n={4} icon={ShieldCheck} title="Security & Compliance Model" sub="HIPAA administrative, physical and technical safeguards mapped to the platform." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {[
            { i: Lock, t: "Encryption", d: "TLS 1.3 in transit, mTLS between services, AES-256 at rest with KMS-managed, rotated keys." },
            { i: KeyRound, t: "Identity & secrets", d: "OIDC SSO + MFA for staff, patient magic-link; secrets in a vault, never in prompts or logs." },
            { i: ShieldCheck, t: "Guardrails", d: "Red-flag lockout, no diagnosis / prescription output filter, jailbreak & prompt-injection detection." },
            { i: Activity, t: "Audit", d: "Every PHI access and agent tool call written to an immutable WORM log, retained 6 years." },
          ].map((x) => <div key={x.t} className="flex gap-3 rounded-xl border bg-card p-4"><x.i className="h-5 w-5 shrink-0 text-primary" /><div><div className="font-semibold">{x.t}</div><p className="text-sm text-muted-foreground">{x.d}</p></div></div>)}
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 font-semibold">De-identification pipeline</div>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {["Raw message", "NER PHI detect", "Tokenize → [NAME_1]", "LLM (ZDR)", "Re-identify in PHI tier"].map((s, i, a) => (
                <span key={s} className="flex items-center gap-1.5"><span className="rounded bg-muted px-2 py-1">{s}</span>{i < a.length - 1 && <ArrowRight className="h-3 w-3" />}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">Permission (RBAC)</th>{ROLES.map((r) => <th key={r} className="p-3 text-center">{r}</th>)}</tr></thead>
            <tbody>
              {PERMS.map(([p, v]) => (
                <tr key={p} className="border-b last:border-0">
                  <td className="p-3">{p}</td>
                  {v.map((x, i) => <td key={i} className={cn("p-3 text-center font-semibold", x === "✓" ? "text-routine" : x === "—" ? "text-muted-foreground" : "text-urgent")}>{x}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
