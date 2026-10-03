import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, Loader2, Wand2 } from "lucide-react";
import { analyzeIncident } from "@/agent/triageAgent";
import { AgentWorkflow } from "@/components/agent/AgentWorkflow";
import { AnalysisCard } from "@/components/agent/AnalysisCard";
import { EmptyState, PageHeader, Panel, PriorityBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useIncidents } from "@/hooks/useIncidents";
import type { TriageResult } from "@/types/domain";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/triage")({
  head: () => ({
    meta: [
      { title: "AI Triage Agent — CampusFlow AI" },
      { name: "description", content: "Watch the AI agent classify, prioritize and route campus incidents with reasoning and confidence." },
      { property: "og:title", content: "AI Triage Agent — CampusFlow AI" },
      { property: "og:description", content: "AI classification, prioritization and routing of campus incidents." },
    ],
  }),
  component: TriagePage,
});

const SAMPLES = [
  { title: "Wi-Fi outage in Hostel C", description: "Entire hostel has no internet since 7am, students cannot access the LMS for exams today.", location: "Hostel C" },
  { title: "Sparking switchboard in Physics Lab", description: "Switchboard near bench 4 is sparking and smells of smoke. Power should be cut.", location: "Physics Lab 1" },
  { title: "Access card not opening lab door", description: "My access card badge is rejected at the Robotics lab door lock.", location: "Robotics Lab" },
];

function TriagePage() {
  const [input, setInput] = useState(SAMPLES[0]!);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<TriageResult | null>(null);
  const { data } = useIncidents();
  const running = step >= 0 && step < 6 && !result;

  const run = async () => {
    setResult(null);
    const r = analyzeIncident(input);
    for (let i = 0; i <= 4; i++) { setStep(i); await new Promise((res) => setTimeout(res, 450)); }
    setStep(r.requiresApproval ? 5 : 6);
    setResult(r);
  };

  return (
    <>
      <PageHeader title="AI Triage" description="The triage agent reads each incident, classifies it, scores priority, routes it and decides whether a human must approve." />
      <Panel title="Agent workflow" className="mb-4"><AgentWorkflow active={step} skipApproval={result ? !result.requiresApproval : false} /></Panel>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Incident input" className="lg:col-span-2" action={<BrainCircuit className="size-4 text-primary" />}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">{SAMPLES.map((s) => <button key={s.title} onClick={() => setInput(s)} className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted">{s.title}</button>)}</div>
            <Input value={input.title} onChange={(e) => setInput({ ...input, title: e.target.value })} placeholder="Title" />
            <Input value={input.location} onChange={(e) => setInput({ ...input, location: e.target.value })} placeholder="Location" />
            <Textarea rows={6} value={input.description} onChange={(e) => setInput({ ...input, description: e.target.value })} />
            <Button className="w-full" onClick={run} disabled={running || input.description.trim().length < 10}>
              {running ? <><Loader2 className="size-4 animate-spin" />Analyzing…</> : <><Wand2 className="size-4" />Run AI triage</>}
            </Button>
          </div>
        </Panel>
        <Panel title="AI analysis" className="lg:col-span-3">
          {result ? <AnalysisCard a={result} /> : running ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-14" /><Skeleton className="h-24" /></div> :
            <EmptyState icon={BrainCircuit} title="No analysis yet" description="Pick a sample or describe an incident, then run the agent." />}
        </Panel>
      </div>
      <Panel title="Triage queue" description="Incidents awaiting human approval" className="mt-4">
        {data?.filter((i) => i.approval === "pending").length ? (
          <div className="divide-y">{data.filter((i) => i.approval === "pending").map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-2.5 text-sm"><span className="w-20 font-mono text-xs text-muted-foreground">{i.id}</span><span className="flex-1 truncate">{i.title}</span><span className="hidden text-xs text-muted-foreground sm:block">{Math.round(i.analysis.confidence * 100)}%</span><PriorityBadge p={i.priority} /></div>
          ))}</div>
        ) : <EmptyState title="Queue is clear" description="No incidents are waiting for approval." />}
      </Panel>
    </>
  );
}
