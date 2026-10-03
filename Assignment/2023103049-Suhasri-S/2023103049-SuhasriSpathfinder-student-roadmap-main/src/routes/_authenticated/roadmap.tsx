import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRoadmap } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — Pathfinder" }, { name: "description", content: "Your personalized, adaptive learning roadmap." }] }),
  component: Roadmap,
});

function Roadmap() {
  const { data: rm, isLoading } = useRoadmap();
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [detail, setDetail] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const qc = useQueryClient();

  if (isLoading) return <AppShell><Loading /></AppShell>;
  if (!rm) return <AppShell><PageHeader title="Roadmap" /><Empty title="No roadmap yet" text="Complete the assessment to generate your roadmap."><Button asChild><Link to="/assessment">Start assessment</Link></Button></Empty></AppShell>;

  const phases = [...new Map(rm.tasks.map((t) => [t.phase_index, t.phase_title])).entries()];
  const firstOpen = rm.tasks.find((t) => !t.completed)?.phase_index ?? 0;
  const isOpen = (i: number) => open[i] ?? i === firstOpen;
  const done = rm.tasks.filter((t) => t.completed).length;

  const toggle = async (id: string, completed: boolean) => {
    setSaving(id);
    const { error } = await supabase.from("roadmap_tasks").update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq("id", id);
    setSaving(null);
    if (error) return void toast.error("Couldn't save. Please try again.");
    await qc.invalidateQueries({ queryKey: ["roadmap"] });
    toast.success(completed ? "Task completed" : "Marked as not done");
  };

  return (
    <AppShell>
      <PageHeader title={rm.title ?? "Your roadmap"} subtitle={`Version ${rm.version} · ${done}/${rm.tasks.length} tasks complete`} />
      {rm.summary && <p className="mb-4 text-muted-foreground">{rm.summary}</p>}
      <Progress value={rm.tasks.length ? (done / rm.tasks.length) * 100 : 0} className="mb-8 h-3" />
      <ol className="relative space-y-4 border-l-2 border-primary/20 pl-6">
        {phases.map(([pi, title]) => {
          const tasks = rm.tasks.filter((t) => t.phase_index === pi);
          const pd = tasks.filter((t) => t.completed).length;
          const milestones = [...new Set(tasks.map((t) => t.milestone ?? ""))];
          return (
            <li key={pi} className="relative">
              <span className={`absolute -left-[35px] top-5 h-4 w-4 rounded-full border-2 border-primary ${pd === tasks.length ? "bg-primary" : "bg-background"}`} />
              <div className="rounded-2xl border bg-card">
                <button className="flex w-full items-center gap-3 p-5 text-left" onClick={() => setOpen({ ...open, [pi]: !isOpen(pi) })} aria-expanded={isOpen(pi)}>
                  {isOpen(pi) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <div className="flex-1"><p className="text-xs font-semibold uppercase text-muted-foreground">Phase {pi + 1}</p><h2 className="text-lg font-semibold">{title}</h2></div>
                  <span className="text-sm text-muted-foreground">{pd}/{tasks.length}</span>
                </button>
                {isOpen(pi) && (
                  <div className="space-y-5 border-t px-5 pb-5 pt-4">
                    {milestones.map((m) => (
                      <div key={m}>
                        <p className="mb-2 text-sm font-semibold text-primary">Milestone: {m}</p>
                        <ul className="space-y-2">
                          {tasks.filter((t) => (t.milestone ?? "") === m).map((t) => (
                            <li key={t.id} className="rounded-xl bg-muted/50 p-3">
                              <div className="flex items-start gap-3">
                                <button aria-label={t.completed ? "Undo completion" : "Mark complete"} disabled={saving === t.id} onClick={() => toggle(t.id, !t.completed)} className="mt-0.5 shrink-0 text-primary disabled:opacity-50">
                                  {t.completed ? <CheckCircle2 className="h-5 w-5 fill-primary text-primary-foreground" /> : <Circle className="h-5 w-5" />}
                                </button>
                                <button className="min-w-0 flex-1 text-left" onClick={() => setDetail(detail === t.id ? null : t.id)}>
                                  <p className={`font-medium ${t.completed ? "text-muted-foreground line-through" : ""}`}>
                                    {t.title}{t.prerequisites === "Added by Adaptive Planning Agent" && <Sparkles className="ml-1 inline h-4 w-4 text-accent" />}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{t.skill} · {t.estimated_hours}h · {t.priority} priority · {detail === t.id ? "hide details" : "details"}</p>
                                </button>
                              </div>
                              {detail === t.id && (
                                <div className="ml-8 mt-3 space-y-2 text-sm">
                                  <p>{t.description}</p>
                                  <p><b>Prerequisites:</b> {t.prerequisites || "None"}</p>
                                  {t.practice && <p><b>Practice:</b> {t.practice}</p>}
                                  {t.resources.length > 0 && <div><b>Resources:</b><ul className="ml-5 list-disc">{t.resources.map((r) => <li key={r}>{r}</li>)}</ul></div>}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
