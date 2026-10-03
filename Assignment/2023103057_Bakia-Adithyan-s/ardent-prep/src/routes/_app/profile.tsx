import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState, GlassCard, LoadingState, PageHeader } from "@/components/app/kit";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Candidate profile — Ardent Prep" },
      { name: "description", content: "Your education, skills and experience used to tailor mock interviews." },
      { property: "og:title", content: "Candidate profile — Ardent Prep" },
      { property: "og:description", content: "Your education, skills and experience used to tailor mock interviews." },
    ],
  }),
  component: ProfilePage,
});

const empty = { full_name: "", education: "", experience_level: "", skills: "", programming_languages: "", projects: "", target_role: "", resume_text: "" };
type Form = typeof empty;

function ProfilePage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (q.data) setF({ ...empty, ...Object.fromEntries(Object.keys(empty).map((k) => [k, (q.data as Record<string, unknown>)[k] ?? ""])) } as Form);
  }, [q.data]);

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message="Could not load profile." onRetry={() => q.refetch()} />;

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").upsert({ id: u.user!.id, ...f, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast.error("Could not save profile"); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <PageHeader eyebrow="Candidate" title="Your profile" sub="The Planning Agent only uses what you write here — it never invents experience." action={<Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>} />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassCard className="space-y-4">
          <Field label="Name"><Input value={f.full_name} onChange={set("full_name")} maxLength={120} /></Field>
          <Field label="Education"><Input value={f.education} onChange={set("education")} placeholder="B.Tech Computer Science, 2026" maxLength={300} /></Field>
          <Field label="Experience level">
            <Select value={f.experience_level} onValueChange={(v) => setF((p) => ({ ...p, experience_level: v }))}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                {["Student", "Fresher", "Junior (1-2 yrs)", "Mid (3-5 yrs)", "Senior (5+ yrs)"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Target role"><Input value={f.target_role} onChange={set("target_role")} placeholder="Frontend Developer" maxLength={150} /></Field>
          <Field label="Skills"><Input value={f.skills} onChange={set("skills")} placeholder="React, SQL, data structures" maxLength={800} /></Field>
          <Field label="Programming languages"><Input value={f.programming_languages} onChange={set("programming_languages")} placeholder="TypeScript, Python, Java" maxLength={400} /></Field>
        </GlassCard>
        <GlassCard className="space-y-4">
          <Field label="Projects"><Textarea rows={6} value={f.projects} onChange={set("projects")} placeholder="Short descriptions of projects you've built" maxLength={3000} /></Field>
          <Field label="Resume text"><Textarea rows={10} value={f.resume_text} onChange={set("resume_text")} placeholder="Paste your resume as plain text" maxLength={8000} /></Field>
        </GlassCard>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
