import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FlaskConical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StageTimeline } from "@/components/prooflab/StageTimeline";
import { ReportView } from "@/components/prooflab/ReportView";
import { HistoryList } from "@/components/prooflab/HistoryList";
import { useAnalysis } from "@/hooks/use-analysis";
import { deleteAnalysis, loadHistory, saveAnalysis } from "@/lib/history";
import type { Analysis } from "@/lib/agent/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProofLab — From Idea to Evidence" },
      { name: "description", content: "Test your technology idea with a multi-stage AI analysis agent: STAR, pros & cons, feasibility, research gaps, simulation and architecture." },
      { property: "og:title", content: "ProofLab — From Idea to Evidence" },
      { property: "og:description", content: "A multi-stage AI agent that analyses technology ideas and produces a structured report." },
    ],
  }),
  component: Index,
});

const EXAMPLE = "An AI system that predicts traffic congestion using CCTV cameras.";

function Index() {
  const [idea, setIdea] = useState("");
  const [history, setHistory] = useState<Analysis[]>([]);
  useEffect(() => setHistory(loadHistory()), []);
  const onDone = useCallback((a: Analysis) => setHistory(saveAnalysis(a)), []);
  const { status, running, error, analysis, setAnalysis, start, reset } = useAnalysis(onDone);

  const trimmed = idea.trim();
  const valid = trimmed.length >= 15 && trimmed.length <= 2000;
  const started = running || error || Object.values(status).some((s) => s !== "pending");

  const newAnalysis = () => { reset(); setIdea(""); };
  const openPast = (a: Analysis) => { reset(); setIdea(a.idea); setAnalysis(a); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground"><FlaskConical className="size-4" /></span>
            <div>
              <p className="font-semibold leading-none tracking-tight">ProofLab</p>
              <p className="label-mono mt-1">From Idea to Evidence</p>
            </div>
          </div>
          {(started || analysis) && <Button variant="outline" size="sm" onClick={newAnalysis}><RotateCcw className="size-3.5" /> New Analysis</Button>}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {!started && !analysis && (
          <section className="mx-auto max-w-2xl">
            <p className="label-mono text-signal">Technology idea analysis agent</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Test your technology idea.</h1>
            <p className="mt-4 text-muted-foreground">Describe an idea. ProofLab runs it through nine analysis stages — from understanding and STAR to feasibility, research gaps, a simple simulation and a proposed architecture.</p>
            <form className="mt-8 rounded-md border bg-card p-3 shadow-sm" onSubmit={(e) => { e.preventDefault(); if (valid) start(trimmed); }}>
              <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={`e.g. ${EXAMPLE}`} rows={6} maxLength={2000} className="resize-none border-0 text-base shadow-none focus-visible:ring-0" />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <button type="button" className="label-mono hover:text-signal" onClick={() => setIdea(EXAMPLE)}>Try example</button>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{trimmed.length}/2000</span>
                  <Button type="submit" disabled={!valid}>Analyze Idea</Button>
                </div>
              </div>
            </form>
            {trimmed.length > 0 && trimmed.length < 15 && <p className="mt-2 text-xs text-muted-foreground">Please write at least 15 characters.</p>}
          </section>
        )}

        {(started || analysis) && (
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-4">
              <div className="rounded-md border bg-card p-4">
                <p className="label-mono mb-2">Idea</p>
                <p className="text-sm">{analysis?.idea ?? trimmed}</p>
              </div>
              {started && <div className="rounded-md border bg-card p-4"><p className="label-mono mb-4">Agent workflow</p><StageTimeline status={status} /></div>}
            </aside>
            <section>
              {error && (
                <div className="mb-4 flex items-start gap-3 rounded-md border border-destructive p-4 text-sm">
                  <AlertTriangle className="size-4 shrink-0 text-destructive" />
                  <div className="flex-1"><p className="font-medium">Analysis stopped</p><p className="text-muted-foreground">{error}</p></div>
                  <Button size="sm" variant="outline" onClick={() => start(trimmed)}>Retry</Button>
                </div>
              )}
              {analysis ? (
                <>
                  <ReportView analysis={analysis} />
                  <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="size-3.5" /> AI-generated analysis. Verify existing work, claims and figures independently before relying on them.</p>
                </>
              ) : running ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed bg-card/60 text-center">
                  <p className="font-medium">Agent is working…</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">Each stage builds on the previous findings. This usually takes a minute or two.</p>
                </div>
              ) : null}
            </section>
          </div>
        )}

        <section className="mx-auto mt-16 max-w-2xl">
          <h2 className="label-mono mb-3">Analysis history</h2>
          <HistoryList items={history} onOpen={openPast} onDelete={(id) => setHistory(deleteAnalysis(id))} />
        </section>
      </main>
    </div>
  );
}
