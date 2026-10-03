import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell, Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { buildCareerPlan, reanalyzeCareer } from "@/lib/agents.functions";
import { errMsg, useAnalysis } from "@/lib/queries";
import { levelName } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/skill-gap")({
  head: () => ({ meta: [{ title: "Skill gap — Pathfinder" }, { name: "description", content: "Where you are versus where your target role needs you." }] }),
  component: SkillGap,
});

const tone = { High: "bg-destructive/10 text-destructive", Medium: "bg-warning/20 text-accent-foreground", Low: "bg-success/15 text-success", None: "bg-success/15 text-success" } as const;

function SkillGap() {
  const { data, isLoading } = useAnalysis();
  const [busy, setBusy] = useState<null | "analysis" | "roadmap">(null);
  const reanalyze = useServerFn(reanalyzeCareer), rebuild = useServerFn(buildCareerPlan);
  const qc = useQueryClient();

  const go = async (kind: "analysis" | "roadmap") => {
    setBusy(kind);
    try { await (kind === "analysis" ? reanalyze() : rebuild()); await qc.invalidateQueries(); toast.success(kind === "analysis" ? "Skill gaps updated." : "New roadmap generated."); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  if (isLoading) return <AppShell><Loading /></AppShell>;
  if (!data) return <AppShell><PageHeader title="Skill gap" /><Empty title="No analysis yet" text="Complete the assessment to see your skill gaps."><Button asChild><Link to="/assessment">Start assessment</Link></Button></Empty></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Skill gap analysis" subtitle="From the Career Analysis Agent"
        action={<div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!!busy} onClick={() => go("analysis")}>{busy === "analysis" ? "Calculating your skill gaps…" : "Re-analyze"}</Button>
          <Button disabled={!!busy} onClick={() => go("roadmap")}>{busy === "roadmap" ? "Rebuilding roadmap…" : "Rebuild roadmap"}</Button>
        </div>} />
      <p className="mb-6 rounded-2xl bg-secondary p-5 text-secondary-foreground">{data.summary}</p>
      <p className="mb-4 text-sm text-muted-foreground">Changed your skills? Update them on your <Link to="/profile" className="font-semibold text-primary">profile</Link>, then re-analyze.</p>
      <div className="space-y-3">
        {data.gaps.map((g) => {
          const pct = Math.round((Math.min(g.current, g.required) / g.required) * 100);
          return (
            <div key={g.skill} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold">{g.skill}</h3>
                <span className="text-xs text-muted-foreground">{g.category}</span>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[g.priority]}`}>{g.priority} priority</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[g.gap]}`}>Gap: {g.gap}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                <span className="w-10 text-right text-sm font-semibold">{pct}%</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Current: <b>{levelName(g.current)}</b> · Required: <b>{levelName(g.required)}</b> — {g.reason}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-8 text-right"><Button asChild><Link to="/roadmap">See my roadmap</Link></Button></div>
    </AppShell>
  );
}
