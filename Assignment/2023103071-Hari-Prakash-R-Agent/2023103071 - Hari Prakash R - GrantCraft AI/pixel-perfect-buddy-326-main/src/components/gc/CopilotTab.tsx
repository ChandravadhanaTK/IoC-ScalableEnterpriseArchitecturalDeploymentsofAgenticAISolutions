import { useRef, useState } from "react";
import { Play, Search, ShieldCheck, FileText, Calculator, UserCheck, AlertOctagon, CheckCircle2, Loader2, RotateCcw, XCircle, Cpu, Clock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { auditBudget, rebalanceBudget, type BudgetLine } from "@/lib/grantcraft";
import { Panel, Pill, useApp, PageHead } from "./shared";

type Scenario = { id: string; title: string; amount: number; fail?: boolean; lines: (amt: number) => BudgetLine[]; grants: [string, number][] };

const mk = (amt: number, adminPct: number): BudgetLine[] => {
  const admin = Math.round(amt * adminPct);
  const rest = amt - admin;
  return [
    { item: "Hardware & Equipment", amount: Math.round(rest * 0.48), category: "program" },
    { item: "Installation & Field Ops", amount: Math.round(rest * 0.22), category: "program" },
    { item: "Training & Capacity Building", amount: Math.round(rest * 0.18), category: "program" },
    { item: "Monitoring & Evaluation", amount: rest - Math.round(rest * 0.48) - Math.round(rest * 0.22) - Math.round(rest * 0.18), category: "program" },
    { item: "Administrative Overhead", amount: admin, category: "admin" },
  ];
};

const PRESETS: Scenario[] = [
  { id: "p1", title: "Solar-Powered Digital Classrooms for 50 Rural Schools", amount: 120000, lines: (a) => mk(a, 0.08), grants: [["Global Education CSR Fund", 94], ["Tata Digital Learning Grant", 89], ["Clean Energy for Schools Initiative", 83]] },
  { id: "p2", title: "Clean Water Filtration & IoT Sensors for 20 Drought-Prone Villages", amount: 85000, lines: (a) => mk(a, 0.09), grants: [["WaterAid Resilience Fund", 92], ["HUL Jal Jeevan CSR Program", 88], ["Smart Villages IoT Grant", 81]] },
  { id: "p3", title: "Test Failure Path: Unregistered NGO Requesting 25% Admin Overhead", amount: 250000, fail: true, lines: (a) => mk(a, 0.25), grants: [["General Community Fund", 71], ["Rural Development Pool", 68], ["Open Social Grant", 62]] },
];

type AgentStatus = "pending" | "running" | "done" | "failed";
const AGENTS = [
  { key: "scout", name: "Grant Scout Agent", state: "DISCOVERING", tools: ["Grant_Vector_Search", "CSR_Portal_API"], icon: Search },
  { key: "compliance", name: "Compliance & Eligibility Agent", state: "AUDITING", tools: ["NGO_Doc_Parser", "Policy_Rule_Engine"], icon: ShieldCheck },
  { key: "architect", name: "Proposal Architect Agent", state: "DRAFTING", tools: ["Impact_RAG_Retriever", "Citation_Verifier"], icon: FileText },
  { key: "auditor", name: "Financial Auditor Agent", state: "VERIFYING_MATH", tools: ["Python_Sandbox_Calc", "Cap_Rule_Checker"], icon: Calculator },
  { key: "hitl", name: "HITL Approval Gate", state: "AWAITING_DIRECTOR_SIGN_OFF", tools: ["Director_Console"], icon: UserCheck },
] as const;

type Trace = { agent: string; tool: string; payload: string; ms: number; tokens: number };
type Phase = "idle" | "running" | "hitl" | "approved" | "rejected" | "failed";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fmt = (n: number) => "$" + n.toLocaleString("en-US");

export function CopilotTab() {
  const { role, addAudit, addFunding, funding } = useApp();
  const [sel, setSel] = useState<string>("p1");
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<AgentStatus[]>(AGENTS.map(() => "pending"));
  const [traces, setTraces] = useState<Trace[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [budget, setBudget] = useState<BudgetLine[]>([]);
  const [hash, setHash] = useState<string>("");
  const [revisions, setRevisions] = useState(0);
  const run = useRef(0);

  const setAt = (i: number, s: AgentStatus) => setStatus((p) => p.map((x, j) => (j === i ? s : x)));
  const trace = (t: Trace) => setTraces((p) => [...p, t]);

  const resolveScenario = (): Scenario => {
    if (sel !== "custom") return PRESETS.find((p) => p.id === sel)!;
    const m = custom.replace(/,/g, "").match(/\$?\s?(\d{4,})/);
    const amount = m ? Number(m[1]) : 100000;
    const fail = /unregistered|no 80g|no 12a|uncertified/i.test(custom);
    const pct = custom.match(/(\d{1,2})\s?%\s?admin/i);
    return { id: "custom", title: custom.trim() || "Custom NGO Funding Request", amount, fail, lines: (a) => mk(a, pct ? Number(pct[1]) / 100 : 0.09), grants: [["Matched CSR Opportunity Fund", fail ? 66 : 87], ["Regional Impact Grant", fail ? 61 : 82], ["Community Catalyst Fund", 76]] };
  };

  async function runAuditor(id: number, lines: BudgetLine[], sc: Scenario) {
    setAt(3, "running");
    await sleep(900);
    if (run.current !== id) return;
    let res = auditBudget(lines);
    trace({ agent: "Financial Auditor", tool: "Python_Sandbox_Calc", payload: JSON.stringify({ total: res.total, admin: res.admin, ratio: +res.ratio.toFixed(4) }), ms: 212, tokens: 0 });
    let final = lines;
    if (!res.pass) {
      final = rebalanceBudget(lines);
      res = auditBudget(final);
      trace({ agent: "Financial Auditor", tool: "Cap_Rule_Checker", payload: `{"violation":"admin>10%","action":"deterministic_recalc","new_ratio":${res.ratio.toFixed(4)}}`, ms: 48, tokens: 0 });
    } else {
      trace({ agent: "Financial Auditor", tool: "Cap_Rule_Checker", payload: `{"cap":0.10,"ratio":${res.ratio.toFixed(4)},"pass":true}`, ms: 31, tokens: 0 });
    }
    setBudget(final);
    await addAudit({ actor: "Financial Auditor Agent", type: "TOOL", action: `Budget verified for ${fmt(sc.amount)} — admin ${(res.ratio * 100).toFixed(1)}%` });
    setAt(3, "done");
    setAt(4, "running");
    setPhase("hitl");
  }

  async function start() {
    const id = ++run.current;
    const sc = resolveScenario();
    setScenario(sc);
    setStatus(AGENTS.map(() => "pending"));
    setTraces([]);
    setBudget([]);
    setHash("");
    setRevisions(0);
    setPhase("running");

    // 1 scout
    setAt(0, "running");
    await sleep(1100);
    if (run.current !== id) return;
    trace({ agent: "Grant Scout", tool: "Grant_Vector_Search", payload: `{"query":"${sc.title.slice(0, 48)}…","top_k":3,"namespace":"tenant_ngo_042"}`, ms: 184, tokens: 412 });
    await sleep(500);
    trace({ agent: "Grant Scout", tool: "CSR_Portal_API", payload: `{"matches":${JSON.stringify(sc.grants.map(([n, s]) => ({ n, s: s / 100 })))}}`, ms: 326, tokens: 0 });
    await addAudit({ actor: "Grant Scout Agent", type: "AGENT", action: `Matched 3 grants (top ${sc.grants[0]![1]}%)` });
    setAt(0, "done");

    // 2 compliance
    setAt(1, "running");
    await sleep(1100);
    if (run.current !== id) return;
    trace({ agent: "Compliance", tool: "NGO_Doc_Parser", payload: sc.fail ? `{"80G":null,"12A":null,"501c3":null,"pii_redacted":7}` : `{"80G":"VALID","12A":"VALID","FCRA":"VALID","pii_redacted":7}`, ms: 640, tokens: 1830 });
    await sleep(400);
    if (sc.fail) {
      trace({ agent: "Compliance", tool: "Policy_Rule_Engine", payload: `{"rule":"MANDATORY_TAX_CERT","result":"FAIL","halt":true}`, ms: 22, tokens: 0 });
      await addAudit({ actor: "Policy_Rule_Engine", type: "GUARDRAIL", action: "COMPLIANCE HALT — missing 80G/12A/501(c)(3); drafting skipped" });
      setAt(1, "failed");
      setPhase("failed");
      return;
    }
    trace({ agent: "Compliance", tool: "Policy_Rule_Engine", payload: `{"rules_checked":24,"result":"PASS"}`, ms: 19, tokens: 0 });
    await addAudit({ actor: "Compliance Agent", type: "AGENT", action: "Eligibility verified — 80G/12A valid, PII redacted" });
    setAt(1, "done");

    // 3 architect
    setAt(2, "running");
    await sleep(1500);
    if (run.current !== id) return;
    trace({ agent: "Proposal Architect", tool: "Impact_RAG_Retriever", payload: `{"chunks":12,"sources":["impact_report_2025.pdf","baseline_survey.xlsx"]}`, ms: 412, tokens: 5240 });
    await sleep(500);
    trace({ agent: "Proposal Architect", tool: "Citation_Verifier", payload: `{"citations":9,"verified":9,"groundedness":0.964}`, ms: 288, tokens: 960 });
    await addAudit({ actor: "Proposal Architect Agent", type: "AGENT", action: "Draft generated — groundedness 96.4%" });
    setAt(2, "done");

    await runAuditor(id, sc.lines(sc.amount), sc);
  }

  async function approve() {
    if (!scenario) return;
    const h = await addAudit({ actor: "NGO Director", type: "HITL", action: `APPROVED & signed: ${scenario.title.slice(0, 40)} (${fmt(scenario.amount)})` });
    setHash(h);
    addFunding(scenario.amount);
    setAt(4, "done");
    setPhase("approved");
  }
  async function revise() {
    if (!scenario) return;
    await addAudit({ actor: "NGO Director", type: "HITL", action: "Requested budget revision — loop to Financial Auditor" });
    setRevisions((r) => r + 1);
    setAt(4, "pending");
    setPhase("running");
    // tighten: shift 1% of admin to M&E
    const tweaked = budget.map((l) => (l.category === "admin" ? { ...l, amount: Math.round(l.amount * 0.85) } : l));
    const diff = budget.reduce((s, l) => s + l.amount, 0) - tweaked.reduce((s, l) => s + l.amount, 0);
    const idx = tweaked.findIndex((l) => l.item.startsWith("Monitoring"));
    tweaked[idx] = { ...tweaked[idx]!, amount: tweaked[idx]!.amount + diff };
    await runAuditor(run.current, tweaked, scenario);
  }
  async function reject() {
    await addAudit({ actor: "NGO Director", type: "HITL", action: "REJECTED & halted — reason: strategic misalignment with FY priorities" });
    setAt(4, "failed");
    setPhase("rejected");
  }

  const audit = budget.length ? auditBudget(budget) : null;
  const totalTokens = traces.reduce((s, t) => s + t.tokens, 0);
  const totalMs = traces.reduce((s, t) => s + t.ms, 0);
  const canApprove = role === "director";

  return (
    <div>
      <PageHead kicker="Live Workspace" title="Multi-Agent Execution Studio" desc="Pick a scenario or describe your own funding need, then watch four specialised agents discover, audit, draft and verify — with a human sign-off at the end." />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <Panel title="Scenario" icon={<Cpu className="size-4" />}>
            <div className="space-y-2">
              {PRESETS.map((p, i) => (
                <button key={p.id} onClick={() => setSel(p.id)} className={cn("w-full rounded-lg border p-3 text-left transition", sel === p.id ? (p.fail ? "glow-danger bg-destructive/10" : "glow-primary bg-primary/10") : "hover:bg-muted")}>
                  <div className="font-mono text-[10px] text-muted-foreground">PRESET {i + 1}</div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className={cn("mt-1 font-mono text-xs", p.fail ? "text-destructive" : "text-primary")}>{fmt(p.amount)}</div>
                </button>
              ))}
              <button onClick={() => setSel("custom")} className={cn("w-full rounded-lg border p-3 text-left transition", sel === "custom" ? "glow-accent bg-accent/10" : "hover:bg-muted")}>
                <div className="font-mono text-[10px] text-muted-foreground">CUSTOM</div>
                <div className="text-sm font-medium">Write your own request</div>
              </button>
              {sel === "custom" && (
                <Textarea value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Mobile health vans for 30 tribal hamlets, $95,000" className="min-h-24 font-mono text-xs" />
              )}
            </div>
            <Button onClick={start} disabled={phase === "running"} className="mt-4 w-full font-semibold">
              {phase === "running" ? <Loader2 className="animate-spin" /> : <Play />} Run Multi-Agent Pipeline
            </Button>
          </Panel>

          <Panel title="Run Telemetry">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><Clock className="mx-auto size-4 text-info" /><div className="mt-1 font-mono text-sm">{totalMs}ms</div><div className="text-[10px] text-muted-foreground">tool latency</div></div>
              <div><Coins className="mx-auto size-4 text-warning" /><div className="mt-1 font-mono text-sm">{totalTokens.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">tokens</div></div>
              <div><CheckCircle2 className="mx-auto size-4 text-success" /><div className="mt-1 font-mono text-sm">{fmt(funding)}</div><div className="text-[10px] text-muted-foreground">funding signed</div></div>
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <Panel title="Agent Pipeline">
            <div className="grid gap-2 md:grid-cols-5">
              {AGENTS.map((a, i) => {
                const s = status[i];
                const Icon = a.icon;
                return (
                  <div key={a.key} className={cn("rounded-lg border p-3 transition-all", s === "running" && "glow-accent animate-pulse", s === "done" && "border-success/40", s === "failed" && "glow-danger")}>
                    <div className="flex items-center justify-between">
                      <Icon className={cn("size-5", s === "done" ? "text-success" : s === "failed" ? "text-destructive" : s === "running" ? "text-accent" : "text-muted-foreground")} />
                      {s === "running" && <Loader2 className="size-4 animate-spin text-accent" />}
                      {s === "done" && <CheckCircle2 className="size-4 text-success" />}
                      {s === "failed" && <XCircle className="size-4 text-destructive" />}
                    </div>
                    <div className="mt-2 text-xs font-semibold leading-tight">{a.name}</div>
                    <Pill tone={s === "failed" ? "danger" : s === "done" ? "success" : s === "running" ? "accent" : "muted"} className="mt-2 max-w-full truncate text-[9px]">{s === "pending" ? "IDLE" : s === "failed" ? "FAILED_SAFE" : a.state}</Pill>
                    <div className="mt-2 space-y-0.5">{a.tools.map((t) => <div key={t} className="truncate font-mono text-[9px] text-muted-foreground">⚙ {t}</div>)}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {phase === "failed" && (
            <div className="glass glow-danger border-destructive/50 bg-destructive/10 p-5">
              <div className="flex items-center gap-2 text-destructive"><AlertOctagon className="size-5" /><h3 className="font-bold">Compliance Exception — Execution Halted (FAILED_SAFE)</h3></div>
              <p className="mt-2 text-sm text-muted-foreground">The NGO has no valid 80G / 12A / 501(c)(3) registration on file and requests 25% administrative overhead (cap 10%). Drafting was skipped before any expensive LLM calls — 0 drafting tokens spent.</p>
              <div className="mt-3 text-sm font-semibold">Remediation steps</div>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Upload valid 12A & 80G certificates (or IRS 501(c)(3) determination letter).</li>
                <li>Reduce admin overhead to ≤ 10% of total request; reallocate to program delivery.</li>
                <li>Complete NGO Darpan / FCRA registration if receiving foreign CSR funds.</li>
                <li>Re-submit — the pipeline will resume from the Compliance Agent.</li>
              </ol>
            </div>
          )}

          {status[0] === "done" && scenario && (
            <Panel title="Grant Scout · Top Matches">
              <div className="grid gap-2 md:grid-cols-3">
                {scenario.grants.map(([n, s]) => (
                  <div key={n} className="rounded-lg border p-3">
                    <div className={cn("font-display text-2xl font-bold", s >= 85 ? "text-success" : s >= 70 ? "text-warning" : "text-destructive")}>{s}%</div>
                    <div className="text-sm">{n}</div>
                    <div className="mt-2 h-1 rounded bg-muted"><div className="h-1 rounded bg-primary" style={{ width: `${s}%` }} /></div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {status[2] === "done" && scenario && (
            <Panel title="Proposal Draft" right={<Pill tone="success">RAG Groundedness 96.4%</Pill>}>
              <div className="space-y-3 text-sm">
                <div><div className="font-semibold">Executive Summary</div><p className="text-muted-foreground">{scenario.title} — a {fmt(scenario.amount)} intervention designed for measurable, sustainable community outcomes, grounded in our 2025 baseline survey and prior impact reports [1][2].</p></div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div><div className="font-semibold">Measurable KPIs</div><ul className="list-disc pl-5 text-muted-foreground"><li>Beneficiaries reached: 12,500 in 18 months</li><li>Service uptime ≥ 95% via remote monitoring</li><li>Cost per beneficiary ≤ {fmt(Math.round(scenario.amount / 12500))}</li><li>Community ownership committees in 100% of sites</li></ul></div>
                  <div><div className="font-semibold">Implementation Timeline</div><ul className="list-disc pl-5 text-muted-foreground"><li>M1–2: Site survey & procurement</li><li>M3–6: Installation & commissioning</li><li>M7–12: Training & handover</li><li>M13–18: M&E and impact report</li></ul></div>
                </div>
              </div>
            </Panel>
          )}

          {audit && (
            <Panel title="Financial Auditor · Deterministic Budget" right={<Pill tone={audit.pass ? "success" : "danger"}>Admin {(audit.ratio * 100).toFixed(2)}% {audit.pass ? "≤ 10% ✓" : "> 10%"}</Pill>}>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Line item</th><th>Category</th><th className="text-right">Amount</th><th className="text-right">Share</th></tr></thead>
                <tbody>
                  {budget.map((l) => (
                    <tr key={l.item} className="border-b border-border/50"><td className="py-2">{l.item}</td><td><Pill tone={l.category === "admin" ? "warning" : "info"}>{l.category}</Pill></td><td className="text-right font-mono">{fmt(l.amount)}</td><td className="text-right font-mono text-muted-foreground">{((l.amount / audit.total) * 100).toFixed(1)}%</td></tr>
                  ))}
                  <tr className="font-semibold"><td className="py-2">Total</td><td /><td className="text-right font-mono">{fmt(audit.total)}</td><td className="text-right font-mono">100%</td></tr>
                </tbody>
              </table>
              {revisions > 0 && <div className="mt-2 font-mono text-xs text-accent-foreground">Revision loop ×{revisions} completed</div>}
            </Panel>
          )}

          {phase === "hitl" && (
            <div className="glass glow-accent p-5">
              <div className="flex items-center gap-2"><UserCheck className="size-5 text-accent" /><h3 className="font-bold">AWAITING_DIRECTOR_SIGN_OFF</h3></div>
              <p className="mt-1 text-sm text-muted-foreground">{canApprove ? "Review the draft and budget, then decide." : "Only the NGO Director can sign off. Switch role in the header to act."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={!canApprove} onClick={approve}><CheckCircle2 /> Approve & Export Signed Proposal</Button>
                <Button disabled={!canApprove} variant="secondary" onClick={revise}><RotateCcw /> Request Budget Revision</Button>
                <Button disabled={!canApprove} variant="destructive" onClick={reject}><XCircle /> Reject & Halt</Button>
              </div>
            </div>
          )}
          {phase === "approved" && (
            <div className="glass glow-primary p-5">
              <div className="flex items-center gap-2 text-success"><CheckCircle2 className="size-5" /><h3 className="font-bold">COMPLETED — Proposal signed & exported</h3></div>
              <div className="mt-2 break-all font-mono text-xs text-muted-foreground">SHA-256 audit hash: {hash}</div>
            </div>
          )}
          {phase === "rejected" && (
            <div className="glass glow-danger p-5"><div className="flex items-center gap-2 text-destructive"><XCircle className="size-5" /><h3 className="font-bold">Rejected & halted by Director</h3></div><p className="mt-1 text-sm text-muted-foreground">Reason logged: strategic misalignment with FY priorities.</p></div>
          )}

          {traces.length > 0 && (
            <Panel title="Tool Call Trace">
              <div className="space-y-1.5">
                {traces.map((t, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border bg-background/50 px-3 py-2 font-mono text-[11px] animate-in fade-in slide-in-from-left-2">
                    <Pill tone="accent">{t.agent}</Pill>
                    <span className="text-primary">{t.tool}()</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{t.payload}</span>
                    <Pill tone="info">{t.ms}ms</Pill>
                    {t.tokens > 0 && <Pill tone="warning">{t.tokens} tok</Pill>}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
