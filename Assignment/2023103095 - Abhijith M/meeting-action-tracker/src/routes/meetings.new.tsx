import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { analyzeMeeting } from "@/lib/agents.functions";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/meetings/new")({
  head: () => pageMeta("Create Meeting", "Submit a meeting transcript for analysis by the Meeting Analysis Agent."),
  component: () => <AppShell><NewMeeting /></AppShell>,
});

const SAMPLE = `Rahul will complete API testing by Wednesday.
Priya will prepare deployment documentation.
The security team needs to review the API before deployment.`;

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  participants: z.string().max(1000),
  transcript: z.string().trim().min(20, "Transcript must be at least 20 characters").max(50000, "Transcript too long (50k max)"),
});

function NewMeeting() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeMeeting);
  const [f, setF] = useState({ title: "", meeting_date: new Date().toISOString().slice(0, 10), participants: "", transcript: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message); return; }
    setBusy(true);
    const { data, error } = await supabase.from("meetings").insert({ ...p.data, user_id: user!.id }).select("id").single();
    if (error || !data) { setBusy(false); toast.error(error?.message ?? "Could not save meeting"); return; }
    await supabase.from("audit_logs").insert({ user_id: user!.id, action: "meeting_created", entity: "meeting", entity_id: data.id });
    // Navigate immediately so the user sees live agent states, then run analysis.
    navigate({ to: "/meetings/$id", params: { id: data.id } });
    analyze({ data: { meetingId: data.id } })
      .then((r) => r.ok ? toast.success(`Extracted ${r.count} action item(s) — awaiting your approval`) : toast.error(`Analysis failed: ${r.error}`))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Analysis failed"));
  }

  return (
    <>
      <PageHeader eyebrow="Workspace" title="Create meeting" desc="The transcript is treated as untrusted input: it is screened for prompt-injection and PII before it reaches the LLM." />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4 rounded-lg border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Meeting title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Sprint 14 release sync" /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={f.meeting_date} onChange={(e) => setF({ ...f, meeting_date: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Participants</Label><Input value={f.participants} onChange={(e) => setF({ ...f, participants: e.target.value })} placeholder="Rahul, Priya, Security Team" /></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><Label>Transcript</Label>
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => setF({ ...f, transcript: SAMPLE, title: f.title || "API release planning", participants: f.participants || "Rahul, Priya, Security Team" })}>Load sample transcript</button>
            </div>
            <Textarea rows={14} className="font-mono text-sm" value={f.transcript} onChange={(e) => setF({ ...f, transcript: e.target.value })} placeholder="Paste the meeting transcript…" />
            <div className="text-right font-mono text-[11px] text-muted-foreground">{f.transcript.length.toLocaleString()} / 50,000</div>
          </div>
          <Button disabled={busy} className="w-full sm:w-auto">{busy ? "Starting agents…" : "Analyze transcript"}</Button>
        </div>
        <aside className="space-y-3 text-sm">
          <div className="rounded-lg border bg-card p-4">
            <div className="eyebrow mb-2">What happens next</div>
            <ol className="space-y-2 text-muted-foreground">
              <li><b className="text-foreground">1.</b> Meeting Analysis Agent extracts action items via a real LLM.</li>
              <li><b className="text-foreground">2.</b> Validation drops items not grounded in the transcript.</li>
              <li><b className="text-foreground">3.</b> You approve or reject each item.</li>
              <li><b className="text-foreground">4.</b> Task Management Agent creates tasks.</li>
              <li><b className="text-foreground">5.</b> Reminder Agent schedules deadline notifications.</li>
            </ol>
          </div>
        </aside>
      </form>
    </>
  );
}
