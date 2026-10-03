import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronDown, Loader2, Play, RefreshCw, ShieldAlert, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AgentCards, FlowDiagram, KindTag, STAGE_META, emptyStages, type Stages } from "@/components/procure/Flow";
import { ResultSummary } from "@/components/procure/ResultView";
import { DEPARTMENTS, SAMPLE_REQUESTS, type AnalysisResult, type AuditEntry, type StreamEvent } from "@/lib/procure/data";
import { newRequestId, useProcure } from "@/lib/procure/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProcureAI — Analyze a purchase request" },
      { name: "description", content: "Describe what you need; ProcureAI's agents check policy, catalog and budget, then route approvals." },
      { property: "og:title", content: "ProcureAI — Analyze a purchase request" },
      { property: "og:description", content: "Multi-agent AI turns plain-English requests into policy-checked recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type LogLine = Omit<AuditEntry, "id" | "role"> & { at: string };

function Index() {
  const { policy, setPolicy, addRequest, addAudit, requests, role } = useProcure();
  const [text, setText] = useState(SAMPLE_REQUESTS[0]!.text);
  const [dept, setDept] = useState("Engineering");
  const [stages, setStages] = useState<Stages>(emptyStages);
  const [attempt, setAttempt] = useState(1);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handle = (e: StreamEvent) => {
    if (e.type === "stage") {
      setStages((s) => ({ ...s, [e.stage]: { ...s[e.stage], status: e.status, elapsedMs: e.elapsedMs ?? s[e.stage].elapsedMs, toolCalls: e.toolCalls ?? s[e.stage].toolCalls, output: e.output ?? s[e.stage].output, runs: (s[e.stage].runs ?? 0) + (e.status === "running" ? 1 : 0) } }));
    } else if (e.type === "loop") {
      setAttempt(e.attempt);
      toast.message(`Validator sent it back (attempt ${e.attempt}/${e.max})`);
    } else if (e.type === "log") {
      setLogs((l) => [...l, { ...e.entry, at: new Date().toISOString() }]);
      addAudit(e.entry);
    } else if (e.type === "blocked") {
      setBlocked(e.message);
    } else if (e.type === "final") {
      setResult(e.result);
      const id = newRequestId(requests);
      addRequest({ id, createdAt: new Date().toISOString(), department: e.result.department, text: e.result.requestText, status: "pending_manager", result: e.result, actions: [] });
      addAudit({ agent: "pipeline", tool: "submit", result: `${id} sent for approval`, status: "OK" });
      setSavedId(id);
    } else if (e.type === "error") {
      setError({ message: e.message, retryable: e.retryable });
    }
  };

  const analyze = async () => {
    if (text.trim().length < 3) { toast.error("Please describe what you need."); return; }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStages(emptyStages()); setAttempt(1); setResult(null); setBlocked(null); setError(null); setLogs([]); setSavedId(null); setRunning(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, department: dept, policy }), signal: ac.signal });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError({ message: j?.error ?? "Couldn't reach the analysis service. Please retry.", retryable: true });
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (line) { try { handle(JSON.parse(line) as StreamEvent); } catch { /* skip bad line */ } }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError({ message: "Connection interrupted. Please retry.", retryable: true });
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,1fr)_minmax(300px,0.9fr)_minmax(320px,1fr)]">
        {/* Left */}
        <section className="panel space-y-3 p-4">
          <div>
            <p className="eyebrow">New purchase request · as {role}</p>
            <h1 className="text-2xl font-bold">What do you need to buy?</h1>
          </div>
          <Select onValueChange={(v) => { const s = SAMPLE_REQUESTS[Number(v)]; if (!s) return; setText(s.text); setDept(s.department); }}>
            <SelectTrigger><SelectValue placeholder="Load sample request…" /></SelectTrigger>
            <SelectContent>{SAMPLE_REQUESTS.map((s, i) => <SelectItem key={s.label} value={String(i)}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I need a laptop with 32GB RAM for ML work under ₹1,50,000" />
          <div>
            <p className="eyebrow mb-1">Department</p>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium">
              Procurement policy <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea rows={12} value={policy} onChange={(e) => setPolicy(e.target.value)} className="font-mono text-xs" />
              <p className="mt-1 text-xs text-muted-foreground">Used as evidence only. Approval thresholds are fixed by the system and can't be changed here.</p>
            </CollapsibleContent>
          </Collapsible>
          <Button className="w-full" size="lg" onClick={analyze} disabled={running}>
            {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</> : <><Play className="mr-2 h-4 w-4" /> Analyze request</>}
          </Button>
        </section>

        {/* Center */}
        <section><FlowDiagram stages={stages} attempt={attempt} /></section>

        {/* Right */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Agents</h2>
            <span className="eyebrow">click to expand</span>
          </div>
          <AgentCards stages={stages} />
        </section>
      </div>

      {blocked && (
        <div className="panel flex items-start gap-3 border-destructive p-4">
          <ShieldAlert className="h-6 w-6 shrink-0 text-destructive" />
          <div>
            <h2 className="font-semibold">Request blocked by guardrail</h2>
            <p className="text-sm text-muted-foreground">{blocked}</p>
            <p className="mt-1 font-mono text-xs text-destructive">BLOCKED: approval rules are backend-controlled</p>
          </div>
        </div>
      )}
      {error && (
        <div className="panel flex flex-wrap items-center gap-3 border-warning p-4">
          <p className="flex-1 text-sm">{error.message}</p>
          {error.retryable && <Button variant="outline" onClick={analyze}><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>}
        </div>
      )}
      {result && (
        <>
          {savedId && <p className="text-sm text-muted-foreground">Saved as <span className="font-mono text-foreground">{savedId}</span> and sent to the Manager. <Link to="/approvals" className="font-medium text-primary">View in approvals →</Link></p>}
          <ResultSummary result={result} />
        </>
      )}

      <div className="flex items-center gap-2">
        <Switch id="logs" checked={showLogs} onCheckedChange={setShowLogs} />
        <label htmlFor="logs" className="flex items-center gap-1 text-sm font-medium"><Terminal className="h-4 w-4" /> View agent logs</label>
      </div>
      {showLogs && (
        <div className="max-h-72 overflow-auto rounded-lg bg-ink p-3 font-mono text-xs text-ink-foreground">
          {logs.length === 0 ? <p className="opacity-60">No logs yet — run an analysis.</p> : logs.map((l, i) => (
            <div key={i}><span className="opacity-50">{l.at.slice(11, 19)}</span> [{l.agent}] {l.tool} → {l.result} <span className="opacity-70">({l.status})</span></div>
          ))}
        </div>
      )}

      <section className="panel p-5">
        <h2 className="mb-1 text-xl font-bold">How it works</h2>
        <p className="mb-4 text-sm text-muted-foreground">Three AI agents do the language work; everything that decides money or approvals is plain rules on the server.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAGE_META.map((s, i) => (
            <div key={s.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{i}</span><span className="text-sm font-semibold">{s.label}</span><KindTag kind={s.kind} /></div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Approval thresholds: under ₹50,000 → Manager · ₹50,000–₹2,00,000 → Manager + Procurement · above ₹2,00,000 → Manager + Procurement + Finance. If the validator scores below 8, the recommendation is retried with feedback (max 3 attempts).</p>
      </section>
    </main>
  );
}
