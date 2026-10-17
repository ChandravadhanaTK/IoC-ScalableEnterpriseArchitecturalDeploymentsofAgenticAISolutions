import { useEffect, useState } from "react";
import { Server, Zap, GitBranch, CheckCircle2, ArrowRight, Box } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Panel, Pill, PageHead } from "./shared";

export function DeploymentTab() {
  const [queue, setQueue] = useState([120]);
  const pods = Math.min(25, Math.max(2, Math.ceil(queue[0]! / 40)));
  const [outage, setOutage] = useState(false);
  const [served, setServed] = useState({ primary: 0, fallback: 0 });

  useEffect(() => {
    const t = setInterval(() => setServed((s) => (outage ? { ...s, fallback: s.fallback + 7 } : { ...s, primary: s.primary + 7 })), 400);
    return () => clearInterval(t);
  }, [outage]);

  const stages = [
    { env: "Development", sub: "Mock Tools", checks: ["Unit tests", "Contract tests", "Mocked LLM & CSR APIs"] },
    { env: "Staging", sub: "Golden Dataset Eval", checks: ["100 grant scenarios via Ragas", "Faithfulness ≥ 0.90", "Budget math 100%"] },
    { env: "Production", sub: "Blue/Green + 10% Canary", checks: ["Canary 10% traffic", "Auto-rollback if groundedness < 90%", "Promote to Green"] },
  ];

  return (
    <div>
      <PageHead kicker="Deliverable 3" title="Cloud-Native Deployment & Resilience" desc="Stateless FastAPI agent workers autoscaled by queue depth, multi-model failover, and gated releases." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Horizontal Scaling · KEDA on Redis Queue Depth" icon={<Server className="size-4" />}>
          <div className="text-sm text-muted-foreground">Containerised FastAPI Agent Workers on Cloud Run / EKS. Drag the queue to simulate a grant deadline spike.</div>
          <div className="mt-4 flex items-center justify-between text-xs"><span>Redis queue depth: <b className="font-mono text-foreground">{queue[0]}</b> jobs</span><Pill tone={pods > 15 ? "warning" : "success"}>{pods} / 25 pods</Pill></div>
          <Slider className="mt-2" value={queue} onValueChange={setQueue} min={0} max={1000} step={10} />
          <div className="mt-4 grid grid-cols-10 gap-1.5">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className={cn("flex aspect-square items-center justify-center rounded border transition-all", i < pods ? "border-primary/50 bg-primary/20 text-primary" : "opacity-20")}><Box className="size-3" /></div>
            ))}
          </div>
          <div className="mt-3 font-mono text-[11px] text-muted-foreground">minReplicas: 2 · maxReplicas: 25 · trigger: redis listLength / 40</div>
        </Panel>

        <Panel title="Multi-Model Failover Simulator" icon={<Zap className="size-4" />} right={<div className="flex items-center gap-2 text-xs">Primary outage <Switch checked={outage} onCheckedChange={setOutage} /></div>}>
          <div className="flex items-center gap-3">
            <div className="glass flex-1 p-3 text-center text-sm">LiteLLM Router</div>
            <div className={cn("rounded-md border px-2 py-1 font-mono text-[10px]", outage ? "glow-danger text-destructive" : "text-success")}>Circuit {outage ? "OPEN" : "CLOSED"}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className={cn("rounded-lg border p-3 transition", outage ? "glow-danger opacity-60" : "glow-primary")}>
              <div className="text-sm font-semibold">Primary</div><div className="text-xs text-muted-foreground">Claude 3.5 Sonnet / GPT-4o</div>
              <Pill tone={outage ? "danger" : "success"} className="mt-2">{outage ? "HTTP 429 / 503" : "200 OK"}</Pill>
              <div className="mt-2 font-mono text-xs">{served.primary} req</div>
            </div>
            <div className={cn("rounded-lg border p-3 transition", outage && "glow-accent")}>
              <div className="text-sm font-semibold">Fallback</div><div className="text-xs text-muted-foreground">Gemini 1.5 Pro</div>
              <Pill tone={outage ? "accent" : "muted"} className="mt-2">{outage ? "ACTIVE · failover 142ms" : "STANDBY"}</Pill>
              <div className="mt-2 font-mono text-xs">{served.fallback} req</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" /> 0 dropped requests · failover &lt; 150ms</div>
        </Panel>
      </div>

      <Panel title="Environments & CI/CD Release Pipeline" icon={<GitBranch className="size-4" />} className="mt-5">
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          {stages.map((s, i) => (
            <div key={s.env} className="contents">
              <div className="glass flex-1 p-4">
                <div className="font-display text-lg font-bold">{s.env}</div>
                <Pill tone={i === 2 ? "success" : i === 1 ? "accent" : "info"}>{s.sub}</Pill>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{s.checks.map((c) => <li key={c} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 text-success" />{c}</li>)}</ul>
              </div>
              {i < 2 && <ArrowRight className="mx-auto size-5 rotate-90 text-primary md:rotate-0" />}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
