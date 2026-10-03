import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArchTabs, PageHeader, Panel } from "@/components/pp";

export const Route = createFileRoute("/architecture/")({
  head: () => ({
    meta: [
      { title: "System Architecture — PlacePilot AI" },
      { name: "description", content: "Seven-layer interactive architecture diagram with trust boundaries and animated data flows." },
      { property: "og:title", content: "System Architecture — PlacePilot AI" },
      { property: "og:description", content: "Interactive 7-layer architecture of an agentic placement platform." },
    ],
  }),
  component: Arch,
});

type Comp = { name: string; desc: string; tech: string };
const LAYERS: { id: string; name: string; zone: "public" | "app" | "trusted" | "external"; comps: Comp[] }[] = [
  { id: "user", name: "1 · User Layer", zone: "public", comps: [
    { name: "Student", desc: "Pastes notifications, reviews extraction, follows study plan.", tech: "Browser / mobile web" },
    { name: "Placement Coordinator", desc: "Publishes verified drives, reviews aggregate outcomes.", tech: "Browser" },
    { name: "Auditor", desc: "Read-only access to audit chain and traces.", tech: "Browser" },
  ] },
  { id: "exp", name: "2 · Experience Layer", zone: "app", comps: [
    { name: "React 19 SSR UI", desc: "TanStack Start routes with server rendering and client hydration.", tech: "TanStack Start, Tailwind v4" },
    { name: "Live Agent Stepper", desc: "Streams agent states and the human review checkpoint.", tech: "React state machine" },
    { name: "Execution Badges", desc: "Every card shows Real AI Execution vs Deterministic Demo Engine.", tech: "UI contract" },
  ] },
  { id: "orch", name: "3 · AI Orchestration Layer", zone: "trusted", comps: [
    { name: "Pipeline Orchestrator", desc: "Sequences agents, owns handoffs, retries and circuit breaker.", tech: "Server functions" },
    { name: "Engine Router", desc: "Routes to Real AI or Deterministic Engine based on config, health and rate limits.", tech: "Fallback policy" },
    { name: "Guardrails", desc: "Prompt-injection screening and PII anonymization before LLM ingress.", tech: "Pattern + policy filters" },
  ] },
  { id: "agents", name: "4 · Agent Layer (6 workflow agents)", zone: "trusted", comps: [
    { name: "Notification Extraction", desc: "Raw text → typed opportunity.", tech: "LLM + schema validation" },
    { name: "Eligibility Analysis", desc: "Criteria vs credentials; unknown → Not specified.", tech: "Deterministic rules" },
    { name: "Recruitment Timeline", desc: "Ordered milestones; tentative preserved.", tech: "Rules" },
    { name: "Resume Matching", desc: "Skill overlap; % suppressed if specs insufficient.", tech: "LLM / keyword" },
    { name: "Preparation Planner", desc: "Day-wise DSA / Core CS / System Design plan.", tech: "LLM / templates" },
    { name: "Reminder & Alert", desc: "24h and 1h alerts.", tech: "Scheduler" },
  ] },
  { id: "svc", name: "5 · Application Services", zone: "trusted", comps: [
    { name: "Profile Service", desc: "Student academic credentials CRUD.", tech: "Server functions" },
    { name: "Audit Service", desc: "SHA-256 hash-chained append-only log.", tech: "Web Crypto" },
    { name: "Observability", desc: "Traces, spans, tokens, latency.", tech: "Span collector" },
  ] },
  { id: "data", name: "6 · Data Layer", zone: "trusted", comps: [
    { name: "PostgreSQL", desc: "students, opportunities, recruitment_events, eligibility_results, study_plans, agent_traces.", tech: "Lovable Cloud Postgres" },
    { name: "Row Level Security", desc: "auth.uid() = student_id on every student-owned table.", tech: "RLS policies" },
    { name: "Local demo cache", desc: "Offline classroom persistence for the demo engine.", tech: "localStorage" },
  ] },
  { id: "ext", name: "7 · External Integrations", zone: "external", comps: [
    { name: "Lovable AI Gateway", desc: "LLM inference, keys stay server-side.", tech: "HTTPS, bearer key" },
    { name: "Notification sources", desc: "WhatsApp broadcasts, email, departmental circulars (pasted).", tech: "Manual ingest" },
    { name: "College placement portal", desc: "Official registration remains there — PlacePilot only links out.", tech: "Out of scope" },
  ] },
];
const ZONE: Record<string, string> = {
  public: "border-muted-foreground/40",
  app: "border-info/50",
  trusted: "border-success/50",
  external: "border-destructive/50",
};

function Arch() {
  const [sel, setSel] = useState<Comp & { layer: string }>({ ...LAYERS[2]!.comps[1]!, layer: LAYERS[2]!.name });
  return (
    <div>
      <ArchTabs />
      <PageHeader kicker="Deliverable 1" title="Architecture diagram">Seven layers from the student's browser to external AI. Click any component to inspect it. Dashed outlines are trust boundaries; animated lines show request flow.</PageHeader>
      <div className="mb-4 flex flex-wrap gap-4 font-mono text-[10px] uppercase text-muted-foreground">
        <span><span className="mr-1 inline-block h-2 w-4 border border-dashed border-muted-foreground/60" />Untrusted client</span>
        <span><span className="mr-1 inline-block h-2 w-4 border border-dashed border-info" />App edge</span>
        <span><span className="mr-1 inline-block h-2 w-4 border border-dashed border-success" />Trusted server zone</span>
        <span><span className="mr-1 inline-block h-2 w-4 border border-dashed border-destructive" />Third-party</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="pp-grid relative space-y-0 rounded-md border border-border p-4">
          {LAYERS.map((l, i) => (
            <div key={l.id}>
              <div className={`rounded-sm border-2 border-dashed bg-background/90 p-3 ${ZONE[l.zone]}`}>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{l.name}</p>
                <div className="flex flex-wrap gap-2">
                  {l.comps.map((c) => (
                    <button key={c.name} onClick={() => setSel({ ...c, layer: l.name })} className={`rounded-sm border px-3 py-1.5 text-sm transition ${sel.name === c.name ? "border-primary bg-primary/15 text-primary" : "border-border bg-card hover:border-primary/60"}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              {i < LAYERS.length - 1 && (
                <svg className="mx-auto block h-6 w-10" viewBox="0 0 40 24">
                  <line x1="14" y1="0" x2="14" y2="24" stroke="var(--primary)" strokeWidth="2" className="pp-flow-line" />
                  <line x1="26" y1="24" x2="26" y2="0" stroke="var(--info)" strokeWidth="2" className="pp-flow-line" />
                </svg>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <Panel title="Component inspector">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">{sel.layer}</p>
            <p className="mt-1 text-lg font-semibold text-primary">{sel.name}</p>
            <p className="mt-2 text-sm">{sel.desc}</p>
            <p className="mt-3 font-mono text-xs text-muted-foreground">Tech: {sel.tech}</p>
          </Panel>
          <Panel title="Flow legend">
            <p className="text-sm"><span className="text-primary">▼ amber</span> request path (notification → agents → DB)</p>
            <p className="mt-1 text-sm"><span className="text-info">▲ blue</span> response path (results, traces, badges)</p>
            <p className="mt-3 text-xs text-muted-foreground">Secrets and AI keys never cross into layers 1–2. Resume PII is anonymized at layer 3 before leaving for layer 7.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
