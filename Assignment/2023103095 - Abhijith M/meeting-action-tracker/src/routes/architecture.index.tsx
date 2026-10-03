import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/StatusBadge";
import { Node, Arrow, Layer, Card } from "@/components/Diagram";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/architecture/")({
  head: () => pageMeta("System Architecture", "Layered architecture, trust boundaries and data flows of the agentic AI system."),
  component: () => <AppShell><Arch /></AppShell>,
});

function Arch() {
  return (
    <>
      <PageHeader eyebrow="Architecture" title="System architecture" desc="Seven layers, three agents, one orchestrator. Red lines mark trust boundaries where data is authenticated, validated or treated as untrusted." />
      <div className="diagram-grid rounded-lg border bg-background p-5">
        <Layer name="Presentation" boundary="Browser ↔ Server (JWT)">
          <Node title="React Frontend" sub="TanStack Start · SSR" />
          <Node title="Notification Bell" sub="in-app only" tone="muted" />
        </Layer>
        <Layer name="Application / API">
          <Node title="API Backend" sub="typed server functions" tone="primary" />
          <Arrow label="auth middleware" />
          <Node title="Input validation" sub="zod schemas" tone="muted" />
        </Layer>
        <Layer name="Orchestration">
          <Node title="Orchestrator" sub="dispatch · trace · state machine" tone="primary" />
        </Layer>
        <Layer name="Agents" boundary="Agent ↔ External LLM">
          <Node title="Meeting Analysis Agent" sub="LLM extraction + validation" tone="accent" />
          <Arrow label="approval" />
          <Node title="Task Management Agent" sub="deterministic" tone="accent" />
          <Arrow />
          <Node title="Reminder Agent" sub="deadline scan" tone="accent" />
        </Layer>
        <Layer name="AI / LLM">
          <Node title="LLM API" sub="openai/gpt-6-astra via AI gateway" tone="warn" />
          <span className="text-xs text-muted-foreground">No tools · structured JSON output only · server-held key</span>
        </Layer>
        <Layer name="Data">
          <Node title="Database" sub="PostgreSQL + row-level security" />
          <Node title="Notification Service" sub="notifications table" tone="muted" />
          <Node title="Audit log" tone="muted" />
        </Layer>
        <Layer name="Observability">
          <Node title="Monitoring / Tracing" sub="agent_runs · security_events" />
        </Layer>
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Data flows</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="① Ingest & analyze">Browser submits a transcript → API validates & stores it → Orchestrator opens a trace → Meeting Analysis Agent screens for injection, masks PII, calls the LLM, validates the JSON against the transcript.</Card>
        <Card title="② Human approval">Extracted items are persisted as PENDING. The pipeline halts at AWAITING_APPROVAL until the authenticated owner approves or rejects each item.</Card>
        <Card title="③ Tasks & reminders">Task Management Agent converts approved items to tasks. Reminder Agent scans deadlines, marks overdue tasks, and writes de-duplicated notifications.</Card>
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Trust boundaries</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Browser → Server">Every server call carries a signed session token; the server re-verifies it and executes queries as that user so row-level policies apply.</Card>
        <Card title="Transcript → LLM">Transcript content is untrusted data. It is wrapped in delimiters, never concatenated into instructions, and the LLM has no tools to call.</Card>
        <Card title="LLM → Database">LLM output is never trusted directly: strict schema, zod parse, and grounding checks against the source transcript precede any write.</Card>
      </div>
    </>
  );
}
