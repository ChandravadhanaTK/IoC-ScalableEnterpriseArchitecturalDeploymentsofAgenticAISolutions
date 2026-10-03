import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { planInterview } from "@/lib/interview.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard, PageHeader } from "@/components/app/kit";

export const Route = createFileRoute("/_app/interviews/new")({
  head: () => ({
    meta: [
      { title: "Create interview — Ardent Prep" },
      { name: "description", content: "Describe the role and let the Planning Agent draft your mock interview." },
      { property: "og:title", content: "Create interview — Ardent Prep" },
      { property: "og:description", content: "Describe the role and let the Planning Agent draft your mock interview." },
    ],
  }),
  component: NewInterview,
});

function NewInterview() {
  const navigate = useNavigate();
  const plan = useServerFn(planInterview);
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [type, setType] = useState("Mixed");
  const [diff, setDiff] = useState("Medium");
  const [n, setN] = useState(5);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data?.target_role && !role) setRole(profile.data.target_role);
  }, [profile.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = profile.data;
  const sparse = p && !p.skills && !p.resume_text && !p.projects;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: iv, error } = await supabase
      .from("interviews")
      .insert({ user_id: u.user!.id, target_role: role.trim(), job_description: jd.trim(), interview_type: type, difficulty: diff, num_questions: n })
      .select()
      .single();
    if (error || !iv) {
      setBusy(false);
      { toast.error("Could not create interview"); return; }
    }
    const r = await plan({ data: { interviewId: iv.id } });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    navigate({ to: "/interviews/$id/plan", params: { id: iv.id } });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHeader eyebrow="Step 1 · Plan" title="Create an interview" sub="The Interview Planning Agent drafts questions from your profile and the job description. You approve the plan before anything starts." />
      {sparse && (
        <GlassCard className="mt-4 text-sm">
          Your profile is mostly empty, so questions will be general.{" "}
          <Link to="/profile" className="font-medium text-primary">Complete your profile</Link> for a tailored plan.
        </GlassCard>
      )}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard className="space-y-4 lg:col-span-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} required maxLength={150} placeholder="Backend Engineer Intern" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Job description</Label>
            <Textarea rows={12} value={jd} onChange={(e) => setJd(e.target.value)} maxLength={6000} placeholder="Paste the job description" />
          </div>
        </GlassCard>
        <GlassCard className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Interview type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Technical", "Coding", "Behavioral", "Mixed"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Difficulty</Label>
            <Select value={diff} onValueChange={setDiff}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Easy", "Medium", "Hard"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Number of questions</Label>
            <Input type="number" min={1} max={15} value={n} onChange={(e) => setN(Math.max(1, Math.min(15, Number(e.target.value) || 1)))} />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !role.trim()}>
            {busy ? <><Loader2 className="size-4 animate-spin" /> Planning agent working…</> : "Generate interview plan"}
          </Button>
        </GlassCard>
      </div>
    </form>
  );
}
