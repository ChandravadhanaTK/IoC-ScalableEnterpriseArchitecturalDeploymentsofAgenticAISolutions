import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AGENTS } from "@/lib/placepilot/samples";
import { ArchTabs, PageHeader, Panel, Pill } from "@/components/pp";

export const Route = createFileRoute("/architecture/agents")({
  head: () => ({
    meta: [
      { title: "Agent Workflow Design — PlacePilot AI" },
      { name: "description", content: "Six workflow agents, state machine, tool JSON schemas, handoffs, human-in-the-loop and failure circuits." },
      { property: "og:title", content: "Agent Workflow Design — PlacePilot AI" },
      { property: "og:description", content: "Agent states, schemas, retries and fallbacks." },
    ],
  }),
  component: Agents,
});

const STATES = [
  ["IDLE", "Waiting for upstream handoff"],
  ["PROCESSING", "Calling model or rules"],
  ["VALIDATING", "JSON schema + business-rule checks"],
  ["AWAITING_APPROVAL", "Human-in-the-loop review (extraction only)"],
  ["COMPLETED", "Output handed to next agent"],
  ["FAILED", "Retries exhausted / invalid output"],
  ["FALLBACK", "Deterministic engine took over"],
] as const;

function Agents() {
  const [sel, setSel] = useState(0);
  const a = AGENTS[sel]!;
  return (
    <div>
      <ArchTabs />
      <PageHeader kicker="Deliverable 2" title="Agent workflow design">Six specialised agents run in sequence under an orchestrator, with a cross-cutting Monitoring & Observability layer recording every span.</PageHeader>

      <Panel title="Pipeline & handoffs" className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {AGENTS.map((ag, i) => (
            <div key={ag.id} className="flex items-center gap-2">
              <button onClick={() => setSel(i)} className={`rounded-sm border px-3 py-2 text-left text-sm ${sel === i ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                <span className="block font-mono text-[10px] text-muted-foreground">0{i + 1}</span>{ag.short}
              </button>
              {i === 0 && <span className="rounded-sm border border-dashed border-primary px-2 py-1 font-mono text-[10px] text-primary">HITL ✋</span>}
              {i < AGENTS.length - 1 && <span className="text-primary">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-sm border border-dashed border-info/50 bg-info/5 p-2 text-center font-mono text-xs text-info">
          Monitoring & Observability — trace_id · span_id · parent_span_id · state · latency · token estimates · engine · safety flags
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={a.name}>
          <p className="text-sm">{a.purpose}</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="font-mono text-[10px] uppercase text-muted-foreground">Hands off to</dt><dd>{a.handoff ? AGENTS.find((x) => x.id === a.handoff)?.name : "— end of pipeline (Monitoring)"}</dd></div>
            <div><dt className="font-mono text-[10px] uppercase text-muted-foreground">Retry / failure circuit</dt><dd>{a.retries}</dd></div>
          </dl>
          <p className="mt-4 font-mono text-[10px] uppercase text-muted-foreground">Tool input schema</p>
          <pre className="mt-1 max-h-48 overflow-auto rounded-sm bg-muted p-3 font-mono text-[11px]">{JSON.stringify(a.input, null, 2)}</pre>
          <p className="mt-3 font-mono text-[10px] uppercase text-muted-foreground">Tool output schema</p>
          <pre className="mt-1 max-h-48 overflow-auto rounded-sm bg-muted p-3 font-mono text-[11px]">{JSON.stringify(a.output, null, 2)}</pre>
        </Panel>
        <div className="space-y-5">
          <Panel title="Agent state machine">
            <ul className="space-y-2">
              {STATES.map(([s, d]) => (
                <li key={s} className="flex items-center gap-3 text-sm"><span className="w-40"><Pill v={s} /></span><span className="text-muted-foreground">{d}</span></li>
              ))}
            </ul>
            <pre className="mt-4 overflow-auto rounded-sm bg-muted p-3 font-mono text-[11px] leading-5 text-muted-foreground">{`IDLE → PROCESSING → VALIDATING ─┬→ COMPLETED → (next agent)
                     │          └→ AWAITING_APPROVAL → COMPLETED | IDLE (rejected)
                     ├─ error ×≤2 → PROCESSING (backoff 400ms, 1.6s)
                     └─ error ×3 / timeout / 429 → FALLBACK → VALIDATING
FALLBACK fails validation → FAILED (circuit opens 60s)`}</pre>
          </Panel>
          <Panel title="Human-in-the-loop review">
            <p className="text-sm">After extraction, the pipeline pauses in <b>AWAITING_APPROVAL</b>. The student edits any field; blank fields stay “Not specified”. Approval is written to the tamper-evident audit log before downstream agents run. Rejection returns the pipeline to IDLE with nothing persisted.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
