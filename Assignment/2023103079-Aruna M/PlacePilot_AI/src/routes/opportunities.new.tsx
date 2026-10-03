import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { aiExtract } from "@/lib/placepilot/ai.functions";
import { assemble, deterministicExtract, detectInjection, fmtDate, normalizeExtraction, NS } from "@/lib/placepilot/engine";
import { AGENTS, SAMPLES } from "@/lib/placepilot/samples";
import { audit, setState, useApp } from "@/lib/placepilot/store";
import type { AgentState, EngineMode, Extraction, Opportunity } from "@/lib/placepilot/types";
import { btn, btnGhost, EngineBadge, input, PageHeader, Panel, Pill } from "@/components/pp";
import { OpportunityView } from "@/components/OpportunityView";

export const Route = createFileRoute("/opportunities/new")({
  head: () => ({
    meta: [
      { title: "Ingest Notification — PlacePilot AI" },
      { name: "description", content: "Paste a WhatsApp, email or circular placement notification and watch six agents process it." },
      { property: "og:title", content: "Ingest Notification — PlacePilot AI" },
      { property: "og:description", content: "Live agentic pipeline with human review checkpoint." },
    ],
  }),
  component: Ingest,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Mode = "auto" | "real" | "demo";
type Phase = "input" | "running" | "review" | "finishing" | "done";

function Ingest() {
  const { student } = useApp();
  const extract = useServerFn(aiExtract);
  const [raw, setRaw] = useState(SAMPLES[0]!.text);
  const [mode, setMode] = useState<Mode>("auto");
  const [phase, setPhase] = useState<Phase>("input");
  const [states, setStates] = useState<Record<string, AgentState>>({});
  const [draft, setDraft] = useState<Extraction | null>(null);
  const [meta, setMeta] = useState<{ engine: EngineMode; fallback: string | null; latency: number; tin: number; tout: number }>({ engine: "demo", fallback: null, latency: 0, tin: 0, tout: 0 });
  const [result, setResult] = useState<Opportunity | null>(null);
  const flags = detectInjection(raw);
  const st = (id: string, s: AgentState) => setStates((p) => ({ ...p, [id]: s }));

  async function run() {
    setPhase("running");
    setStates({});
    st("extraction", "PROCESSING");
    const t0 = performance.now();
    let ex: Extraction;
    let engine: EngineMode = "demo";
    let fallback: string | null = null;
    let tin = 0, tout = 0;
    if (mode !== "demo") {
      const r = await extract({ data: { raw } }).catch((e: unknown) => ({ ok: false as const, reason: e instanceof Error ? e.message : "Network error" }));
      if (r.ok) {
        ex = normalizeExtraction(JSON.parse(r.json));
        engine = "real";
        tin = r.tokensIn;
        tout = r.tokensOut;
      } else {
        fallback = r.reason;
        st("extraction", "FALLBACK");
        await sleep(400);
        ex = deterministicExtract(raw);
      }
    } else {
      await sleep(600);
      ex = deterministicExtract(raw);
    }
    const latency = Math.round(performance.now() - t0);
    st("extraction", "VALIDATING");
    await sleep(350);
    st("extraction", "AWAITING_APPROVAL");
    setDraft(ex);
    setMeta({ engine, fallback, latency, tin, tout });
    setPhase("review");
  }

  async function approve() {
    if (!draft) return;
    setPhase("finishing");
    st("extraction", "COMPLETED");
    void audit("student", "hitl.approve_extraction", `${draft.company ?? NS} / ${draft.role ?? NS}`);
    for (const a of AGENTS.slice(1)) {
      st(a.id, "PROCESSING");
      await sleep(350);
      st(a.id, "VALIDATING");
      await sleep(200);
      st(a.id, "COMPLETED");
    }
    const { opp, trace } = assemble(raw, draft, student, meta.engine, meta.fallback, meta.latency, { in: meta.tin, out: meta.tout });
    setState((s) => ({ ...s, opportunities: [opp, ...s.opportunities], traces: [trace, ...s.traces] }));
    void audit("system", "pipeline.completed", `${opp.id} engine=${opp.engine}`);
    setResult(opp);
    setPhase("done");
  }

  const upd = (k: keyof Extraction, v: string) => {
    if (!draft) return;
    const arrKeys = ["branches", "degrees", "locations", "skills"];
    const numKeys = ["ctcLpa", "minCgpa", "min10", "min12", "maxActiveBacklogs"];
    setDraft({
      ...draft,
      [k]: arrKeys.includes(k) ? v.split(",").map((x) => x.trim()).filter(Boolean) : numKeys.includes(k) ? (v.trim() === "" ? null : Number(v)) : v.trim() || null,
    });
  };

  return (
    <div>
      <PageHeader kicker="Ingestion" title="Ingest a placement notification">Paste the raw broadcast exactly as received. Six agents extract, verify and plan — you approve the extraction before anything is saved.</PageHeader>

      {phase === "input" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <Panel title="Raw notification">
            <div className="mb-3 flex flex-wrap gap-2">
              {SAMPLES.map((s) => (
                <button key={s.id} className={btnGhost + " text-xs"} onClick={() => setRaw(s.text)}>{s.label}</button>
              ))}
            </div>
            <textarea className={`${input} h-72 font-mono text-xs`} value={raw} onChange={(e) => setRaw(e.target.value)} />
            {flags.length > 0 && (
              <p className="mt-2 rounded-sm border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">Guardrail: possible prompt injection detected ({flags.join(", ")}). Embedded instructions will be ignored.</p>
            )}
          </Panel>
          <Panel title="Execution engine">
            <div className="space-y-2 text-sm">
              {([["auto", "Auto (Real AI → fallback)"], ["real", "Real AI only, fallback on error"], ["demo", "Deterministic Demo Engine (offline)"]] as const).map(([v, l]) => (
                <label key={v} className="flex gap-2"><input type="radio" checked={mode === v} onChange={() => setMode(v)} className="accent-[var(--primary)]" />{l}</label>
              ))}
            </div>
            <button className={btn + " mt-5 w-full"} disabled={!raw.trim()} onClick={run}>Run agent pipeline</button>
          </Panel>
        </div>
      )}

      {phase !== "input" && (
        <Panel title="Live agent stepper" className="mb-5">
          <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {AGENTS.map((a, i) => (
              <li key={a.id} className={`rounded-sm border p-2 ${states[a.id] === "PROCESSING" ? "animate-pulse border-info" : "border-border"}`}>
                <p className="font-mono text-[10px] text-muted-foreground">0{i + 1}</p>
                <p className="text-sm font-medium">{a.short}</p>
                <div className="mt-1"><Pill v={states[a.id] ?? "IDLE"} /></div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {phase === "review" && draft && (
        <Panel title="Human review checkpoint — verify before saving" right={<EngineBadge engine={meta.engine} />}>
          {meta.fallback && <p className="mb-3 text-xs text-warning">Real AI unavailable ({meta.fallback}) — switched to the Deterministic Demo Engine.</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["company", "Company"], ["role", "Role"], ["ctcLpa", "CTC (LPA)"], ["stipend", "Stipend"], ["batch", "Batch"], ["branches", "Branches"],
              ["degrees", "Degrees"], ["minCgpa", "Min CGPA"], ["min10", "Min 10th %"], ["min12", "Min 12th %"], ["maxActiveBacklogs", "Max active backlogs"], ["bond", "Bond"],
              ["skills", "Listed skills"], ["locations", "Locations"], ["employmentType", "Employment type"],
            ] as [keyof Extraction, string][]).map(([k, l]) => {
              const v = draft[k];
              const val = Array.isArray(v) ? (v as string[]).join(", ") : v === null || v === undefined ? "" : String(v);
              return (
                <label key={k} className="text-sm">
                  <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">{l}</span>
                  <input className={input} placeholder={NS} value={val} onChange={(e) => upd(k, e.target.value)} />
                </label>
              );
            })}
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase text-muted-foreground">Extracted milestones</p>
          <ul className="mt-1 space-y-1 text-sm">
            {draft.events.map((e, i) => (
              <li key={i}>{e.label}: <span className="font-mono text-xs">{e.start ? fmtDate(e.start) + (e.end ? ` → ${fmtDate(e.end)}` : "") : `${NS}${e.rawText ? ` ("${e.rawText}")` : ""}`}</span> {e.tentative && <Pill v="borderline" label="Tentative" />}</li>
            ))}
            {draft.events.length === 0 && <li className="italic text-muted-foreground">None specified</li>}
          </ul>
          <div className="mt-5 flex gap-2">
            <button className={btn} onClick={approve}>Approve & continue</button>
            <button className={btnGhost} onClick={() => setPhase("input")}>Reject</button>
          </div>
        </Panel>
      )}

      {phase === "done" && result && (
        <div>
          <div className="mb-4 flex gap-2">
            <Link to="/opportunities/$id" params={{ id: result.id }} className={btn}>Open saved opportunity</Link>
            <button className={btnGhost} onClick={() => { setPhase("input"); setResult(null); }}>Ingest another</button>
          </div>
          <OpportunityView opp={result} />
        </div>
      )}
    </div>
  );
}
