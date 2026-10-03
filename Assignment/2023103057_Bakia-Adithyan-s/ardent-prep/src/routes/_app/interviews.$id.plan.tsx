import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { planInterview } from "@/lib/interview.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, GlassCard, LoadingState, PageHeader, Pill, StatusPill } from "@/components/app/kit";
import type { Database } from "@/integrations/supabase/types";

type Q = Database["public"]["Tables"]["interview_questions"]["Row"];

export const Route = createFileRoute("/_app/interviews/$id/plan")({
  head: () => ({
    meta: [
      { title: "Interview plan — Ardent Prep" },
      { name: "description", content: "Review, edit and approve your AI-generated interview plan." },
      { property: "og:title", content: "Interview plan — Ardent Prep" },
      { property: "og:description", content: "Review, edit and approve your AI-generated interview plan." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const plan = useServerFn(planInterview);
  const [busy, setBusy] = useState<"regen" | "approve" | null>(null);

  const q = useQuery({
    queryKey: ["plan", id],
    queryFn: async () => {
      const [iv, qs] = await Promise.all([
        supabase.from("interviews").select("*").eq("id", id).single(),
        supabase.from("interview_questions").select("*").eq("interview_id", id).order("position"),
      ]);
      if (iv.error) throw iv.error;
      return { interview: iv.data, questions: qs.data ?? [] };
    },
  });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message="Interview not found." />;
  const { interview, questions } = q.data!;
  const editable = interview.status === "planning" || interview.status === "awaiting_approval";

  const regen = async () => {
    setBusy("regen");
    const r = await plan({ data: { interviewId: id } });
    setBusy(null);
    if (!r.ok) toast.error(r.error);
    else toast.success("New plan generated");
    q.refetch();
  };

  const approve = async () => {
    setBusy("approve");
    const { error } = await supabase.from("interviews").update({ status: "in_progress", approved_at: new Date().toISOString() }).eq("id", id);
    setBusy(null);
    if (error) { toast.error("Could not approve plan"); return; }
    qc.invalidateQueries();
    navigate({ to: "/interviews/$id/session", params: { id } });
  };

  const update = async (qid: string, patch: Partial<Q>) => {
    const { error } = await supabase.from("interview_questions").update(patch).eq("id", qid);
    if (error) toast.error("Could not save change");
    else q.refetch();
  };
  const remove = async (qid: string) => {
    if (questions.length <= 1) { toast.error("A plan needs at least one question."); return; }
    await supabase.from("interview_questions").delete().eq("id", qid);
    q.refetch();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Step 2 · Human approval"
        title={interview.target_role}
        sub={`${interview.interview_type} · ${interview.difficulty} · ${questions.length} questions. Edit or remove anything before you approve.`}
        action={
          editable ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={regen} disabled={!!busy}>
                {busy === "regen" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Regenerate
              </Button>
              <Button onClick={approve} disabled={!!busy || questions.length === 0}>Approve & start interview</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <StatusPill status={interview.status} />
              <Button asChild>
                <Link to={interview.status === "completed" ? "/interviews/$id/report" : "/interviews/$id/session"} params={{ id }}>
                  {interview.status === "completed" ? "View report" : "Go to interview"}
                </Link>
              </Button>
            </div>
          )
        }
      />

      {busy === "regen" && <LoadingState label="Interview Planning Agent is drafting questions…" />}

      {questions.length === 0 && busy !== "regen" ? (
        <GlassCard className="mt-6">
          <EmptyState title="No plan yet" body="Plan generation didn't finish. Try generating again." action={<Button onClick={regen}>Generate plan</Button>} />
        </GlassCard>
      ) : (
        <div className="mt-6 space-y-3">
          {questions.map((qq, i) => (
            <QuestionCard key={qq.id + qq.question} q={qq} index={i} editable={editable} onSave={update} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ q, index, editable, onSave, onRemove }: { q: Q; index: number; editable: boolean; onSave: (id: string, p: Partial<Q>) => void; onRemove: (id: string) => void }) {
  const [text, setText] = useState(q.question);
  const [concepts, setConcepts] = useState(q.expected_concepts.join(", "));
  return (
    <GlassCard>
      <div className="flex items-start gap-4">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
        <div className="min-w-0 flex-1 space-y-3">
          {editable ? (
            <Textarea rows={2} value={text} maxLength={1200} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() && text !== q.question && onSave(q.id, { question: text.trim() })} />
          ) : (
            <p className="text-sm">{q.question}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {editable ? (
              <>
                <Select value={q.category} onValueChange={(v) => onSave(q.id, { category: v })}>
                  <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Technical", "Coding", "Behavioral", "System Design", "Problem Solving"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={q.difficulty} onValueChange={(v) => onSave(q.id, { difficulty: v })}>
                  <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Easy", "Medium", "Hard"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input
                  className="h-8 min-w-[200px] flex-1 text-xs"
                  value={concepts}
                  placeholder="Expected concepts (comma separated)"
                  onChange={(e) => setConcepts(e.target.value)}
                  onBlur={() => onSave(q.id, { expected_concepts: concepts.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8) })}
                />
              </>
            ) : (
              <>
                <Pill tone="accent">{q.category}</Pill>
                <Pill tone="muted">{q.difficulty}</Pill>
                {q.expected_concepts.map((c) => <Pill key={c} tone="primary">{c}</Pill>)}
              </>
            )}
          </div>
        </div>
        {editable && (
          <Button variant="ghost" size="icon" onClick={() => onRemove(q.id)} aria-label="Remove question">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
