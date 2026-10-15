import type { ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Analysis, Level } from "@/lib/agent/types";
import { runSimulation } from "@/lib/simulation";
import { cn } from "@/lib/utils";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border bg-card p-5">
      <h3 className="label-mono mb-3">{title}</h3>
      <div className="space-y-3 text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "signal" | "warn" | "bad" | "good" }) {
  return (
    <span className={cn("inline-flex rounded border px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider",
      tone === "muted" && "border-border text-muted-foreground",
      tone === "signal" && "border-signal text-signal",
      tone === "good" && "border-success text-success",
      tone === "warn" && "border-warning text-warning",
      tone === "bad" && "border-destructive text-destructive")}>{children}</span>
  );
}

const levelTone = (l: Level, invert = false): "good" | "warn" | "bad" =>
  l === "medium" ? "warn" : (l === "high") !== invert ? "good" : "bad";

function Skipped({ reason }: { reason?: string }) {
  return <Panel title="Skipped"><p className="text-muted-foreground">This stage was not applicable. {reason}</p></Panel>;
}

export function ReportView({ analysis }: { analysis: Analysis }) {
  const r = analysis.results;
  const tabs = [
    ["overview", "Overview"], ["star", "STAR"], ["positives", "Positives"], ["negatives", "Negatives"],
    ["existing", "Existing Work"], ["feasibility", "Feasibility"], ["gap", "Research Gap"],
    ["simulation", "Simulation"], ["architecture", "Architecture"], ["final", "Final Report"],
  ] as const;

  return (
    <Tabs defaultValue="overview">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1">
        {tabs.map(([v, l]) => <TabsTrigger key={v} value={v} className="text-xs">{l}</TabsTrigger>)}
      </TabsList>

      <div className="mt-4">
        <TabsContent value="overview" className="grid gap-4 md:grid-cols-2">
          {r.understanding && <>
            <div className="md:col-span-2"><Panel title="Idea summary"><p className="text-base">{r.understanding.summary}</p></Panel></div>
            <Panel title="Core problem"><p>{r.understanding.core_problem}</p></Panel>
            <Panel title="Proposed technology"><p>{r.understanding.technology}</p></Panel>
            <Panel title="Intended users"><p>{r.understanding.users}</p></Panel>
            <Panel title="Expected outcome"><p>{r.understanding.outcome}</p></Panel>
          </>}
        </TabsContent>

        <TabsContent value="star" className="grid gap-4 md:grid-cols-2">
          {r.star && (["situation", "task", "action", "result"] as const).map((k) => (
            <Panel key={k} title={k}><p>{r.star![k]}</p></Panel>
          ))}
        </TabsContent>

        <TabsContent value="positives" className="grid gap-3">
          {r.proscons?.positives.map((p, i) => <Panel key={i} title={`Strength ${i + 1}`}><p className="font-medium">{p.title}</p><p className="text-muted-foreground">{p.detail}</p></Panel>)}
        </TabsContent>

        <TabsContent value="negatives" className="grid gap-3">
          {r.proscons?.negatives.map((p, i) => (
            <Panel key={i} title={`Concern ${i + 1}`}>
              <div className="flex items-center gap-2"><p className="font-medium">{p.title}</p><Pill tone="bad">{p.category}</Pill></div>
              <p className="text-muted-foreground">{p.detail}</p>
            </Panel>
          ))}
        </TabsContent>

        <TabsContent value="existing" className="grid gap-3">
          {analysis.skipped.existing ? <Skipped reason={analysis.skipped.existing} /> : <>
            {r.existing?.items.map((it, i) => (
              <Panel key={i} title={it.certainty === "known" ? "Known existing work" : "Uncertain — verify"}>
                <div className="flex items-center gap-2"><p className="font-medium">{it.name}</p><Pill tone={it.certainty === "known" ? "signal" : "warn"}>{it.certainty}</Pill></div>
                <p className="text-muted-foreground">{it.description}</p>
              </Panel>
            ))}
            {r.existing?.note && <p className="text-xs text-muted-foreground">{r.existing.note}</p>}
          </>}
        </TabsContent>

        <TabsContent value="feasibility" className="grid gap-3 md:grid-cols-2">
          {r.feasibility && <>
            {([["technical", "Technical feasibility", false], ["data", "Data requirements", true], ["infrastructure", "Infrastructure", true], ["complexity", "Implementation complexity", true], ["resources", "Resources required", true]] as const).map(([k, t, inv]) => (
              <Panel key={k} title={t}>
                <Pill tone={levelTone(r.feasibility![k].rating, inv)}>{r.feasibility![k].rating}</Pill>
                <p>{r.feasibility![k].summary}</p>
              </Panel>
            ))}
            <Panel title="Verdict"><p>{r.feasibility.verdict}</p></Panel>
          </>}
        </TabsContent>

        <TabsContent value="gap" className="grid gap-3">
          {analysis.skipped.gap ? <Skipped reason={analysis.skipped.gap} /> : r.gap?.gaps.map((g, i) => (
            <Panel key={i} title={`Potential gap ${i + 1}`}>
              <div className="flex items-center gap-2"><p className="font-medium">{g.title}</p><Pill>confidence: {g.confidence}</Pill></div>
              <p className="text-muted-foreground">{g.detail}</p>
            </Panel>
          ))}
        </TabsContent>

        <TabsContent value="simulation"><SimulationPanel analysis={analysis} /></TabsContent>

        <TabsContent value="architecture">
          {r.architecture && <Panel title="Proposed system architecture">
            <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
              {([["Input", r.architecture.input], ["Processing / AI", r.architecture.processing], ["Storage / Services", r.architecture.storage], ["Output", r.architecture.output]] as const).map(([t, items], i) => (
                <div key={t} className="flex flex-1 flex-col items-center gap-2 md:flex-row">
                  <div className="w-full rounded-md border bg-background p-3">
                    <p className="label-mono mb-2">{t}</p>
                    <ul className="space-y-1">{items.map((x) => <li key={x} className="rounded bg-muted px-2 py-1 font-mono text-xs">{x}</li>)}</ul>
                  </div>
                  {i < 3 && <><ArrowRight className="hidden size-4 shrink-0 text-signal md:block" /><ArrowDown className="size-4 text-signal md:hidden" /></>}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground">{r.architecture.notes}</p>
          </Panel>}
        </TabsContent>

        <TabsContent value="final" className="grid gap-4">
          {r.final && <>
            <Panel title="Summary"><p className="text-base">{r.final.summary}</p></Panel>
            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Key strengths"><ul className="list-disc space-y-1 pl-4">{r.final.strengths.map((s) => <li key={s}>{s}</li>)}</ul></Panel>
              <Panel title="Key risks"><ul className="list-disc space-y-1 pl-4">{r.final.risks.map((s) => <li key={s}>{s}</li>)}</ul></Panel>
              <Panel title="Existing work"><p>{r.final.existing_work}</p></Panel>
              <Panel title="Feasibility"><p>{r.final.feasibility}</p></Panel>
              <Panel title="Potential research gap"><p>{r.final.gap}</p></Panel>
              <Panel title="Simulation result"><p>{r.final.simulation}</p></Panel>
              <Panel title="Architecture"><p>{r.final.architecture}</p></Panel>
              <Panel title="Suggested next step"><p className="font-medium text-signal">{r.final.next_step}</p></Panel>
            </div>
          </>}
        </TabsContent>
      </div>
    </Tabs>
  );
}

function SimulationPanel({ analysis }: { analysis: Analysis }) {
  const p = analysis.results.simulation;
  if (analysis.skipped.simulation) return <Skipped reason={analysis.skipped.simulation} />;
  if (!p) return null;
  if (!p.applicable || typeof p.baseline !== "number") {
    return <Panel title="Simulation not performed"><p>{p.reason || "No meaningful quantitative metric for this idea."}</p></Panel>;
  }
  const rows = runSimulation(p);
  const max = Math.max(...rows.map((r) => r.value), p.baseline) || 1;
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <Panel title="Assumptions">
        <p className="font-medium">{p.title}</p>
        <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
          <dt className="text-muted-foreground">Baseline</dt><dd>{p.baseline} {p.unit}</dd>
          <dt className="text-muted-foreground">Effect at full adoption</dt><dd>{p.direction === "decrease" ? "−" : "+"}{p.improvement_pct}%</dd>
          <dt className="text-muted-foreground">Adoption growth</dt><dd>+{p.adoption_step_pct}% / {p.period_label}</dd>
        </dl>
        <ul className="list-disc space-y-1 pl-4 text-muted-foreground">{p.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
        <p className="text-xs text-muted-foreground">Illustrative only. Values are assumptions; numbers are computed deterministically by the app, not by the AI.</p>
      </Panel>
      <Panel title={`${p.metric_name} (${p.unit}) per ${p.period_label}`}>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.period} className="grid grid-cols-[3rem_1fr_5rem] items-center gap-2 font-mono text-xs">
              <span className="text-muted-foreground">{p.period_label.slice(0, 3)} {r.period}</span>
              <div className="h-4 rounded-sm bg-muted"><div className="h-4 rounded-sm bg-signal" style={{ width: `${(r.value / max) * 100}%` }} /></div>
              <span className="text-right">{r.value}</span>
            </div>
          ))}
        </div>
        <p className="font-mono text-xs text-muted-foreground">Final change vs baseline: {rows.at(-1)!.change > 0 ? "+" : ""}{rows.at(-1)!.change} {p.unit}</p>
      </Panel>
    </div>
  );
}
