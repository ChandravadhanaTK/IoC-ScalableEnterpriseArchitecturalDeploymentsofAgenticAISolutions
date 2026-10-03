import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import type { PlanTask } from "../lib/agents";
export default function StudyPlan() {
  const { session } = useAuth();
  const [plan, setPlan] = useState<{ id: string; weak_topics: string[]; tasks: PlanTask[] } | null>(null);
  useEffect(() => { supabase.from("study_plans").select("*").eq("user_id", session!.user.id).order("created_at", { ascending: false }).limit(1).then(({ data }) => setPlan((data?.[0] as typeof plan) ?? null)); }, []);
  async function toggle(k: number) {
    if (!plan) return; const tasks = plan.tasks.map((t, j) => j === k ? { ...t, done: !t.done } : t);
    setPlan({ ...plan, tasks }); await supabase.from("study_plans").update({ tasks }).eq("id", plan.id);
  }
  if (!plan) return <div className="up"><h1 className="mb-4 text-2xl font-bold">Study Plan</h1><p className="text-muted">Take a quiz and the Study Planner Agent will build your plan.</p></div>;
  const done = plan.tasks.filter(t => t.done).length;
  return (<div className="up space-y-4"><h1 className="text-2xl font-bold">Study Plan</h1>
    <div className="card"><b>Weak topics:</b> {plan.weak_topics.join(", ") || "none"}<div className="bg-alt mt-3 h-2 rounded-full"><div className="bg-primary h-2 rounded-full" style={{ width: `${(done / plan.tasks.length) * 100}%` }} /></div><p className="text-muted mt-1 text-sm">{done}/{plan.tasks.length} complete</p></div>
    {plan.tasks.map((t, k) => <label key={k} className="card flex cursor-pointer items-center gap-3"><input type="checkbox" checked={t.done} onChange={() => toggle(k)} /><span className={t.done ? "text-muted line-through" : ""}>Day {t.day}: {t.title}</span></label>)}</div>);
}
