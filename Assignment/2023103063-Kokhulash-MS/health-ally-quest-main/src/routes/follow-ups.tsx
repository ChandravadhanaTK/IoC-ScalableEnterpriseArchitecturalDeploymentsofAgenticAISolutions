import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, Mail, MessageSquare, MonitorSmartphone, Send, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EsiBadge } from "@/components/EsiBadge";
import { store, uid, useClinic, type FollowUp, type FollowStep } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-Up & Care Coordination — CareRoute" },
      { name: "description", content: "Automated 24h, 48h and 7-day patient check-ins with escalation to clinical staff." },
      { property: "og:title", content: "Follow-Up & Care Coordination — CareRoute" },
      { property: "og:description", content: "Automated 24h, 48h and 7-day patient check-ins with escalation to clinical staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FollowUps,
});

const CH = { SMS: MessageSquare, Email: Mail, Portal: MonitorSmartphone };

function FollowUps() {
  const { followUps, alerts } = useClinic();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Follow-Up & Care Coordination</h1>
        <p className="text-sm text-muted-foreground">The Follow-Up Reminder Agent runs check-in sequences and escalates worsening patients back to triage.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {followUps.map((f) => <Sequence key={f.id} f={f} />)}
        </div>
        <aside className="rounded-xl border bg-card p-4 lg:sticky lg:top-24 lg:self-start">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Siren className="h-4 w-4" /> Clinical staff alerts</h3>
          {alerts.length === 0 ? <p className="text-sm text-muted-foreground">No escalations. Use “Patient reports worsening symptoms” to test dispatch.</p> : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id} className="animate-in slide-in-from-right-4 rounded-lg border border-emergency/30 bg-emergency/10 p-3 text-sm">
                  <div className="flex justify-between font-semibold text-emergency"><span>{a.patient}</span><span className="font-mono text-[11px]">{a.at}</span></div>
                  <p>{a.text}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{a.channel}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function Sequence({ f }: { f: FollowUp }) {
  const nextIdx = f.steps.findIndex((s) => s.status === "scheduled");
  const sendNext = () => {
    if (nextIdx < 0) return;
    const steps: FollowStep[] = f.steps.map((s, i) => (i === nextIdx ? { ...s, status: "sent" } : s));
    store.updateFollowUp(f.id, { steps });
    toast(`${f.steps[nextIdx]!.channel} sent to ${f.patient}`, { description: f.steps[nextIdx]!.message });
  };
  const worsen = () => {
    store.updateFollowUp(f.id, { escalated: true });
    store.addAlert({
      id: uid("AL"), patient: f.patient, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      text: `Patient replied "WORSE" — re-triage started (prior ESI ${f.cls.esi}). Nurse callback required within 15 min.`,
      channel: "Paged: on-call RN · Secure chat: care team · Task created in EHR inbox",
    });
    toast.error(`Escalation: ${f.patient}`, { description: "Re-triage started, on-call nurse paged." });
  };
  return (
    <div className={cn("rounded-xl border bg-card p-4", f.escalated && "border-emergency/50")}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-semibold">{f.patient}</span>
        <EsiBadge esi={f.cls.esi} className="text-[10px]" />
        <span className="text-xs text-muted-foreground">{f.cls.specialty}</span>
        {f.escalated && <span className="flex items-center gap-1 rounded-full bg-emergency px-2 py-0.5 text-[11px] font-bold text-emergency-foreground"><AlertTriangle className="h-3 w-3" /> Escalated to triage</span>}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={sendNext} disabled={nextIdx < 0}><Send className="h-3.5 w-3.5" /> Send next</Button>
          <Button size="sm" variant="destructive" onClick={worsen} disabled={f.escalated}>Patient reports worsening symptoms</Button>
        </div>
      </div>
      <ol className="relative grid gap-3 sm:grid-cols-3">
        {f.steps.map((s) => {
          const Icon = CH[s.channel];
          return (
            <li key={s.label} className={cn("rounded-lg border p-3 text-sm", s.status !== "scheduled" ? "bg-primary/5" : "border-dashed")}>
              <div className="mb-1 flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-semibold">{s.label}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{s.offset}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.message}</p>
              <span className={cn("mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                s.status === "responded" ? "bg-routine/15 text-routine" : s.status === "sent" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{s.status}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
