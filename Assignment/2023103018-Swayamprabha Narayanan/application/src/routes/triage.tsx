import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bot, Check, ChevronRight, Loader2, Play, ThumbsDown, ThumbsUp, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, PriorityBadge, Meter } from "@/components/ops/ui";
import { AGENT_COMPONENTS, analyze, PIPELINE, type Analysis } from "@/lib/agent";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/triage")({
  head: () => meta("AI Triage", "AI operations assistant workflow: validation, classification, routing, SLA analysis and human approval."),
  component: Triage,
});

function Triage() {
  const { requests, updateStatus, log } = useStore();
  const queue = requests.filter((r) => !["Resolved", "Closed"].includes(r.status));
  const [id, setId] = useState(queue[0]?.id ?? "");
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<Analysis | null>(null);
  const [decided, setDecided] = useState<null | "approved" | "rejected">(null);
  const req = requests.find((r) => r.id === id);

  const run = async () => {
    if (!req) return;
    setResult(null); setDecided(null);
    updateStatus(req.id, "AI Analyzing");
    for (let i = 0; i <= 7; i++) { setStep(i); await new Promise((r) => setTimeout(r, 380)); }
    const a = analyze(req.title, req.description);
    setResult(a);
    updateStatus(req.id, "Awaiting Approval");
    log(`AI analysis complete · ${a.classification} / ${a.priority} · ${a.confidence}%`, req.id, "info", "AI Agent");
  };
  const decide = (ok: boolean) => {
    if (!req) return;
    setDecided(ok ? "approved" : "rejected");
    setStep(ok ? 9 : 7);
    updateStatus(req.id, ok ? "Assigned" : "New");
    log(ok ? "Approved AI recommendation" : "Rejected AI recommendation", req.id, ok ? "info" : "warn");
    toast[ok ? "success" : "warning"](ok ? `${req.id} routed to ${result?.department}` : `${req.id} returned for manual triage`);
  };

  return (
    <>
      <PageHeader eyebrow="AI agent layer" title="AI Triage Assistant" subtitle="Every recommendation passes through human approval before execution." />

      <Panel title="Agent workflow" subtitle="Request lifecycle through the operations agent">
        <div className="flex flex-wrap items-center gap-y-3">
          {PIPELINE.map((s, i) => {
            const done = step > i || (step === 9 && i === 9), active = step === i && step !== 9;
            return (
              <div key={s} className="flex items-center">
                <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  done ? "border-teal/40 bg-teal/12 text-teal" : active ? "border-primary bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground")}>
                  {done ? <Check className="size-3.5" /> : active ? <Loader2 className="size-3.5 animate-spin" /> : <span className="font-mono">{i + 1}</span>}{s}
                </div>
                {i < PIPELINE.length - 1 && <ChevronRight className="mx-1 size-4 text-muted-foreground/50" />}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Select request" subtitle={`${queue.length} open requests in queue`}>
          <Select value={id} onValueChange={(v) => { setId(v); setStep(-1); setResult(null); setDecided(null); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose request" /></SelectTrigger>
            <SelectContent>{queue.map((r) => <SelectItem key={r.id} value={r.id}>{r.id} · {r.title}</SelectItem>)}</SelectContent>
          </Select>
          {req && (
            <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
              <p className="font-semibold">{req.title}</p>
              <p className="mt-1 text-muted-foreground">{req.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">{req.location}</p>
            </div>
          )}
          <Button className="mt-4 w-full" onClick={run} disabled={!req || (step >= 0 && step < 8 && !result)}><Play />Run AI analysis</Button>
        </Panel>

        <section className="rounded-2xl bg-navy-hero p-6 text-primary-foreground shadow-glow xl:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><Bot className="size-5" />AI analysis</div>
            {result && <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs">Confidence {result.confidence}%</span>}
          </div>
          {!result ? (
            <div className="grid h-56 place-items-center text-center text-sm text-primary-foreground/70">
              {step >= 0 ? <div><Loader2 className="mx-auto mb-2 size-6 animate-spin" />Running {PIPELINE[Math.min(step, 7)]}…</div> : "Select a request and run the analysis."}
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[["Classification", result.classification], ["Recommended department", result.department], ["SLA risk", `${result.slaRisk} · ${result.slaHours}h target`]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-primary-foreground/10 p-3"><div className="text-[11px] text-primary-foreground/65">{k}</div><div className="mt-1 font-semibold">{v}</div></div>
                ))}
                <div className="rounded-xl bg-primary-foreground/10 p-3"><div className="text-[11px] text-primary-foreground/65">Priority</div><div className="mt-1"><PriorityBadge priority={result.priority} /></div></div>
                <div className="rounded-xl bg-primary-foreground/10 p-3 sm:col-span-2"><div className="text-[11px] text-primary-foreground/65">Human approval required</div><div className="mt-1 flex items-center gap-1.5 font-semibold"><UserCheck className="size-4" />{result.approval ? "Yes — high impact or low confidence" : "Optional — policy allows auto-route"}</div></div>
              </div>
              <div className="mt-3 rounded-xl bg-primary-foreground/10 p-4"><div className="text-[11px] text-primary-foreground/65">Recommended action</div><p className="mt-1 font-medium">{result.action}</p></div>
              <div className="mt-3"><div className="mb-1 flex justify-between text-[11px] text-primary-foreground/65"><span>Model confidence</span><span>{result.confidence}%</span></div><Meter value={result.confidence} tone="teal" /></div>
              {result.issues.length > 0 && <p className="mt-3 text-xs text-warning">Validator flags: {result.issues.join(" · ")}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                {decided ? <span className="text-sm font-semibold">Decision recorded: {decided} · logged to audit trail</span> : (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="secondary"><ThumbsUp />Approve & route</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Approve AI recommendation?</AlertDialogTitle><AlertDialogDescription>{req?.id} will be assigned to {result.department} with {result.priority} priority. This action is audited.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => decide(true)}>Approve</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => decide(false)}><ThumbsDown />Reject</Button>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <Panel title="Agent components" subtitle="Application layer modules" className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {AGENT_COMPONENTS.map((c, i) => (
            <div key={c.name} className={cn("rounded-xl border p-4 transition-colors", step >= i && step < 9 && step !== -1 ? "border-teal/40 bg-accent" : "bg-card")}>
              <div className="font-mono text-[11px] text-muted-foreground">0{i + 1}</div>
              <div className="mt-1 font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.desc}</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
