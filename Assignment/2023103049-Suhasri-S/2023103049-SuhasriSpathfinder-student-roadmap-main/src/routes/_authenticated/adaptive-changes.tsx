import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell, Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { decideChange } from "@/lib/agents.functions";
import { errMsg, useProposals } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/adaptive-changes")({
  head: () => ({ meta: [{ title: "Adaptive changes — Pathfinder" }, { name: "description", content: "Review and approve AI-proposed roadmap changes." }] }),
  component: Adaptive,
});

const FLOW = ["AI detected an issue", "AI proposed a change", "You review", "You accept / reject", "System applies decision"];

function Adaptive() {
  const { data, isLoading } = useProposals();
  const [busy, setBusy] = useState<string | null>(null);
  const decide = useServerFn(decideChange);
  const qc = useQueryClient();

  const act = async (id: string, accept: boolean) => {
    setBusy(id + accept);
    try {
      await decide({ data: { id, accept } });
      await qc.invalidateQueries();
      toast.success(accept ? "Changes applied — your roadmap is updated." : "Proposal rejected — your roadmap is unchanged.");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  return (
    <AppShell>
      <PageHeader title="Adaptive changes" subtitle="The Adaptive Planning Agent never changes your roadmap without your approval." />
      <ol className="mb-8 flex flex-wrap items-center gap-2 text-sm">
        {FLOW.map((f, i) => <li key={f} className="flex items-center gap-2"><span className="rounded-full bg-secondary px-3 py-1 font-medium">{f}</span>{i < FLOW.length - 1 && <span className="text-muted-foreground">→</span>}</li>)}
      </ol>
      {isLoading ? <Loading /> : !data?.length ? (
        <Empty title="No proposals yet" text="When an assessment score is low or you fall behind, the agent will propose changes here.">
          <Button asChild variant="outline"><Link to="/progress">Take an assessment</Link></Button>
        </Empty>
      ) : (
        <div className="space-y-5">
          {data.map((p) => (
            <article key={p.id} className={`rounded-2xl border bg-card p-6 ${p.status === "pending" ? "border-2 border-warning" : ""}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${p.status === "pending" ? "bg-warning/25" : p.status === "accepted" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                <span className="text-sm text-muted-foreground">{new Date(p.created_at!).toLocaleString()}</span>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Detected issue</p>
              <h2 className="text-xl font-semibold">{p.issue}</h2>
              <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Recommended adaptation</p>
              <ul className="mt-1 space-y-1 font-mono text-sm">
                {p.changes.map((c, i) => <li key={i} className={c.type === "add" ? "text-success" : c.type === "delay" ? "text-destructive" : ""}>{c.type === "add" ? "+" : c.type === "delay" ? "–" : "→"} {c.text}</li>)}
              </ul>
              {p.new_tasks.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Tasks to be added</p>
                  <ul className="ml-5 list-disc text-sm">{p.new_tasks.map((t, i) => <li key={i}>{t.title} <span className="text-muted-foreground">({t.phase_title}, {t.estimated_hours}h)</span></li>)}</ul>
                </>
              )}
              <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Reason</p>
              <p className="text-sm">{p.reason}</p>
              {p.status === "pending" && (
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => act(p.id, true)} disabled={!!busy}>{busy === p.id + "true" ? "Updating your roadmap…" : "Accept changes"}</Button>
                  <Button variant="outline" onClick={() => act(p.id, false)} disabled={!!busy}>{busy === p.id + "false" ? "Recording…" : "Reject changes"}</Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
