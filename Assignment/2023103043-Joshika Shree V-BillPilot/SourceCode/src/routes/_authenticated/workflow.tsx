import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, Empty, StatusBadge } from "@/components/bits";
import { useAgentRuns, useAudit, useBills, useWorkflows } from "@/lib/data";
import { AGENT_ORDER } from "@/lib/agents";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/workflow")({
  head: () => ({ meta: [{ title: "Agent workflow — BillPilot" }, { name: "description", content: "Monitor orchestrator runs and agent outputs." }, { property: "og:title", content: "Agent workflow — BillPilot" }, { property: "og:description", content: "Workflow monitoring." }] }),
  component: WorkflowPage,
});

function WorkflowPage() {
  const wfs = useWorkflows().data ?? [];
  const runs = useAgentRuns().data ?? [];
  const bills = useBills().data ?? [];
  const audit = useAudit().data ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const billMap = Object.fromEntries(bills.map((b) => [b.id, b]));
  const stats = AGENT_ORDER.map((a) => {
    const r = runs.filter((x) => x.agent_name === a);
    const ok = r.filter((x) => x.status === "completed");
    return { a, n: r.length, avgMs: ok.length ? Math.round(ok.reduce((s, x) => s + (x.execution_time ?? 0), 0) / ok.length) : 0,
      avgC: ok.filter((x) => x.confidence != null).length ? Math.round(ok.reduce((s, x) => s + Number(x.confidence ?? 0), 0) / ok.filter((x) => x.confidence != null).length * 100) : null };
  });
  return (
    <div>
      <PageHeader title="Agent Workflow" sub="Orchestrator → 6 specialized agents, with human review when confidence < 80%." />
      <Card className="mb-4 overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          {["Upload", ...AGENT_ORDER, "Save", "Dashboard"].map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`rounded-lg px-3 py-2 text-xs font-semibold ${i === 0 || i >= arr.length - 2 ? "bg-muted" : "bg-primary text-primary-foreground"}`}>{s}</div>
              {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      </Card>
      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => <Card key={s.a} className="p-4"><p className="text-xs text-muted-foreground">{s.a}</p><p className="mt-1 text-lg font-bold">{s.n} runs</p><p className="text-xs text-muted-foreground">{s.avgMs} ms avg · {s.avgC ?? "—"}% conf</p></Card>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-0">
          <h2 className="p-5 pb-2 font-semibold">Workflow runs</h2>
          {wfs.map((w) => {
            const wr = runs.filter((r) => r.workflow_id === w.id);
            const isOpen = open === w.id;
            return (
              <div key={w.id} className="border-t">
                <button onClick={() => setOpen(isOpen ? null : w.id)} className="flex w-full items-center justify-between px-5 py-3 text-left text-sm hover:bg-muted">
                  <span className="flex items-center gap-2">{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<span className="font-medium">{billMap[w.bill_id]?.merchant ?? "Bill"}</span><span className="text-xs text-muted-foreground">{new Date(w.started_at).toLocaleString()}</span></span>
                  <span className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{w.ai_mode} mode · {wr.length}/6</span><StatusBadge status={w.status} /></span>
                </button>
                {isOpen && (
                  <div className="space-y-2 bg-muted/40 px-5 py-3">
                    {wr.map((r) => (
                      <details key={r.id} className="rounded-lg border bg-card p-3 text-sm">
                        <summary className="flex cursor-pointer items-center justify-between"><span className="font-medium">{r.agent_name}</span><span className="flex items-center gap-2 text-xs text-muted-foreground">{r.execution_time} ms · {r.confidence != null ? `${Math.round(r.confidence * 100)}%` : "—"} <StatusBadge status={r.status} /></span></summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">{r.error ?? JSON.stringify(r.output, null, 2)}</pre>
                      </details>
                    ))}
                    {w.status === "awaiting_review" && <Link to="/bills/$id" params={{ id: w.bill_id }} className="text-sm font-semibold text-primary hover:underline">Open human review →</Link>}
                  </div>
                )}
              </div>
            );
          })}
          {!wfs.length && <Empty>No workflow runs yet.</Empty>}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Audit log</h2>
          <div className="max-h-[520px] overflow-y-auto">
            {audit.slice(0, 50).map((a) => <div key={a.id} className="border-b py-2 text-xs last:border-0"><p className="font-medium">{a.action.replaceAll("_", " ")}</p><p className="text-muted-foreground">{a.entity} · {new Date(a.created_at).toLocaleString()}</p></div>)}
            {!audit.length && <Empty>No activity yet.</Empty>}
          </div>
        </Card>
      </div>
    </div>
  );
}
