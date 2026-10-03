import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge } from "@/components/StatusBadge";
import { Node, Arrow } from "@/components/Diagram";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/architecture/agents")({
  head: () => pageMeta("Agent Workflow", "Roles, inputs, outputs, tools, states and failure paths of the three agents."),
  component: () => <AppShell><Agents /></AppShell>,
});

const AGENTS = [
  {
    name: "Meeting Analysis Agent", role: "Extract action items from an untrusted transcript.",
    input: "Transcript, meeting date", output: "Validated action items (title, owner, deadline, priority, context, source text)",
    tools: "LLM API (structured JSON, no tool calls) · injection detector · PII masker · grounding validator",
    states: ["IDLE", "PROCESSING", "VALIDATING", "AWAITING_APPROVAL", "FAILED"],
    failure: "LLM error, malformed JSON or schema mismatch → run marked FAILED, error shown on meeting, recorded in trace; user can retry. No fallback data is generated.",
  },
  {
    name: "Task Management Agent", role: "Convert human-approved action items into tracked tasks.",
    input: "Approved action-item IDs", output: "Task rows (status TODO) linked to meeting and item",
    tools: "Database write (as the signed-in user)",
    states: ["IDLE", "PROCESSING", "COMPLETED", "FAILED"],
    failure: "Insert failure → FAILED with error; meeting marked FAILED; approvals are preserved for re-run.",
  },
  {
    name: "Reminder Agent", role: "Monitor deadlines and raise in-app notifications.",
    input: "User's open tasks with deadlines", output: "OVERDUE status updates, UPCOMING/OVERDUE notifications",
    tools: "Database read/write · unique (task, kind) constraint for de-duplication",
    states: ["IDLE", "PROCESSING", "COMPLETED", "FAILED"],
    failure: "Idempotent: re-running is safe; duplicates are skipped by the database constraint.",
  },
];

function Agents() {
  return (
    <>
      <PageHeader eyebrow="Architecture" title="Agent workflow" desc="The Orchestrator moves a meeting through a state machine. Exactly three agents, separated by a human approval gate." />
      <div className="diagram-grid overflow-x-auto rounded-lg border bg-background p-5">
        <div className="flex min-w-max items-center">
          <Node title="Transcript" tone="muted" /><Arrow />
          <Node title="Meeting Analysis Agent" tone="accent" /><Arrow />
          <Node title="Validation" tone="muted" /><Arrow />
          <Node title="Human Approval" tone="warn" /><Arrow label="approved" />
          <Node title="Task Management Agent" tone="accent" /><Arrow />
          <Node title="Reminder Agent" tone="accent" /><Arrow />
          <Node title="Notification" tone="primary" />
        </div>
        <div className="mt-4 flex flex-wrap gap-6 font-mono text-[11px] text-muted-foreground">
          <span>↺ LLM failure → FAILED → user-triggered retry (new trace)</span>
          <span>✕ rejected items → archived, no task</span>
          <span>⚠ validation drop → logged in trace details</span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {AGENTS.map((a, i) => (
          <section key={a.name} className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-5 py-3"><span className="font-mono text-xs text-muted-foreground">AGENT 0{i + 1}</span><h2 className="font-semibold">{a.name}</h2></div>
            <dl className="grid gap-x-8 gap-y-3 p-5 text-sm md:grid-cols-2">
              {[["Role", a.role], ["Input", a.input], ["Output", a.output], ["Tools", a.tools]].map(([k, v]) => (
                <div key={k}><dt className="eyebrow">{k}</dt><dd className="mt-0.5">{v}</dd></div>
              ))}
              <div><dt className="eyebrow">States</dt><dd className="mt-1 flex flex-wrap gap-1.5">{a.states.map((s) => <StatusBadge key={s} value={s} />)}</dd></div>
              <div><dt className="eyebrow">Failure path</dt><dd className="mt-0.5 text-danger">{a.failure}</dd></div>
            </dl>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-lg border bg-card p-5 text-sm">
        <h2 className="mb-2 font-semibold">Retry & error handling</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Rate-limit (429) and credit (402) errors surface as explicit messages; no automatic silent retries.</li>
          <li>Each retry opens a fresh trace ID so failed and successful attempts remain auditable.</li>
          <li>Stale PENDING items are cleared before re-analysis; approved/rejected history is kept.</li>
          <li>Approval is only accepted while the meeting is in AWAITING_APPROVAL, preventing double task creation.</li>
        </ul>
      </section>
    </>
  );
}
