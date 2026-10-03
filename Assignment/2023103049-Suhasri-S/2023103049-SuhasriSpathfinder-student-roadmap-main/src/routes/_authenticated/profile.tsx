import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Loading, PageHeader } from "@/components/AppShell";
import { CareerFields, STEPS, cleanCareer, emptyCareer, validateStep, type CareerData } from "@/components/CareerForm";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Pathfinder" }, { name: "description", content: "Update your goals, skills and availability." }] }),
  component: Profile,
});

function Profile() {
  const { data: profile, isLoading } = useProfile();
  const [d, setD] = useState<CareerData | null>(null);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => { if (profile !== undefined && !d) setD(emptyCareer(profile)); }, [profile, d]);

  if (isLoading || !d) return <AppShell><Loading /></AppShell>;

  const save = async () => {
    for (let i = 0; i < STEPS.length; i++) { const e = validateStep(d, i); if (e) return void toast.error(e); }
    setSaving(true);
    const important = profile && (profile.target_role !== d.target_role || JSON.stringify(profile.skills) !== JSON.stringify(cleanCareer(d).skills) || profile.hours_per_week !== d.hours_per_week || profile.timeline_months !== d.timeline_months);
    const { error } = await supabase.from("profiles").update({ ...cleanCareer(d), updated_at: new Date().toISOString() }).eq("id", profile!.id);
    setSaving(false);
    if (error) return void toast.error("Couldn't save your profile. Please try again.");
    await qc.invalidateQueries({ queryKey: ["profile"] });
    if (important && profile?.assessment_completed) {
      toast.success("Saved. Your goals changed — reassess your skill gaps and roadmap.", { action: { label: "Reassess", onClick: () => navigate({ to: "/skill-gap" }) } });
    } else toast.success("Profile saved.");
  };

  return (
    <AppShell>
      <PageHeader title="Profile & settings" subtitle="Changes to your goal, skills or availability can trigger a reassessment." />
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <CareerFields d={d} set={setD} step="all" />
        <div className="mt-8 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></div>
      </div>
    </AppShell>
  );
}
