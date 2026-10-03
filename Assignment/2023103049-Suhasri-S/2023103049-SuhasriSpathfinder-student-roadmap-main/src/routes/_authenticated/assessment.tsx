import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Loading, PageHeader } from "@/components/AppShell";
import { CareerFields, STEPS, cleanCareer, emptyCareer, validateStep, type CareerData } from "@/components/CareerForm";
import { AgentRunner } from "@/components/AgentRunner";
import { Button } from "@/components/ui/button";
import { buildCareerPlan } from "@/lib/agents.functions";
import { errMsg, useProfile } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({ meta: [{ title: "Career assessment — Pathfinder" }, { name: "description", content: "Tell Pathfinder about your goals and skills." }] }),
  component: Assessment,
});

function Assessment() {
  const { data: profile, isLoading } = useProfile();
  const [d, setD] = useState<CareerData | null>(null);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);
  const build = useServerFn(buildCareerPlan);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => { if (profile !== undefined && !d) setD(emptyCareer(profile)); }, [profile, d]);

  const run = async () => {
    setRunning(true); setFailed(false);
    try {
      await build();
      await qc.invalidateQueries();
      toast.success("Your roadmap is ready!");
      navigate({ to: "/skill-gap" });
    } catch (e) {
      setFailed(true);
      toast.error(errMsg(e));
    } finally { setRunning(false); }
  };

  const next = async () => {
    if (!d) return;
    const err = validateStep(d, step);
    if (err) return void toast.error(err);
    if (step < STEPS.length - 1) return setStep(step + 1);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ ...cleanCareer(d), updated_at: new Date().toISOString() }).eq("id", u.user!.id);
    if (error) return void toast.error("Couldn't save your answers. Please try again.");
    qc.invalidateQueries({ queryKey: ["profile"] });
    run();
  };

  if (isLoading || !d) return <AppShell><Loading /></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Career assessment" subtitle="Five quick steps. Your answers drive every agent in Pathfinder." />
      {running ? <AgentRunner /> : failed ? (
        <div className="rounded-2xl border bg-card p-8">
          <h2 className="text-xl font-semibold">We couldn't finish your roadmap</h2>
          <p className="mt-1 text-muted-foreground">Your answers are saved. Try again in a moment.</p>
          <Button className="mt-5" onClick={run}>Retry</Button>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <ol className="mb-8 flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}. {s}</li>
            ))}
          </ol>
          <CareerFields d={d} set={setD} step={step} />
          <div className="mt-8 flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            <Button onClick={next}>{step === STEPS.length - 1 ? "Analyze my career" : "Continue"}</Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
