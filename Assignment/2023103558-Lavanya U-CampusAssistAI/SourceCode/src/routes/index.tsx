import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { analyzeIssue } from "@/lib/analyze.functions";
import type { IssueAnalysis } from "@/lib/ai/analyze.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusAssist AI — Campus support, routed for you" },
      {
        name: "description",
        content:
          "Describe a campus problem and two AI agents triage it and recommend the right department and next step.",
      },
      { property: "og:title", content: "CampusAssist AI — Campus support, routed for you" },
      {
        property: "og:description",
        content:
          "Describe a campus problem and two AI agents triage it and recommend the right department and next step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type StepStatus = "pending" | "processing" | "completed" | "failed";

interface AnalysisRecord {
  issue: string;
  result: IssueAnalysis;
  at: number;
}

const EXAMPLES = [
  "Wi-Fi keeps dropping in the library",
  "Late hostel allotment for this semester",
  "Bus route changed without notice",
  "Missing marks in my grade sheet",
];

const STORAGE_KEY = "campusassist-recent";

const PRIORITY_STYLE: Record<IssueAnalysis["priority"], string> = {
  Low: "text-ok",
  Medium: "text-primary",
  High: "text-high",
  Critical: "text-destructive",
};

function loadRecent(): AnalysisRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function StatusPill({ status }: { status: StepStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/8 px-2 py-0.5 text-[11px] font-medium text-ok">
        <span className="size-1.5 rounded-full bg-ok" />
        Completed
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">
        <span className="size-1.5 rounded-full bg-primary animate-ca-pulse" />
        Processing
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/50" />
      Pending
    </span>
  );
}

function StepDot({ status, index, isLast }: { status: StepStatus; index: number; isLast: boolean }) {
  return (
    <div className="flex flex-col items-center">
      {status === "completed" ? (
        <span className="grid size-7 place-items-center rounded-full bg-ok text-[12px] font-semibold text-primary-foreground">
          ✓
        </span>
      ) : status === "processing" ? (
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground animate-ca-glow">
          <span className="size-2 rounded-full bg-primary-foreground animate-ca-pulse" />
        </span>
      ) : status === "failed" ? (
        <span className="grid size-7 place-items-center rounded-full bg-destructive text-[12px] font-semibold text-destructive-foreground">
          !
        </span>
      ) : (
        <span className="grid size-7 place-items-center rounded-full border border-border bg-surface text-[12px] font-semibold text-muted-foreground">
          {index + 1}
        </span>
      )}
      {!isLast && (
        <span
          className={`mt-1 w-px flex-1 ${status === "completed" || status === "processing" ? "bg-border animate-ca-fill" : "bg-border"}`}
        />
      )}
    </div>
  );
}

function Index() {
  const [issue, setIssue] = useState("");
  const [steps, setSteps] = useState<StepStatus[]>(["pending", "pending", "pending", "pending"]);
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [recent, setRecent] = useState<AnalysisRecord[]>([]);
  const [runMeta, setRunMeta] = useState<{ id: number; seconds: number } | null>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const doneCount = steps.filter((s) => s === "completed").length;

  async function run(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please describe your issue before analyzing.");
      return;
    }
    setError(null);
    setRecord(null);
    setRunning(true);
    setSteps(["completed", "processing", "pending", "pending"]);
    const started = Date.now();

    const triageTimer = window.setTimeout(() => {
      setSteps(["completed", "completed", "processing", "pending"]);
    }, 1400);

    try {
      const result = await analyzeIssue({ data: { issue: trimmed } });
      window.clearTimeout(triageTimer);
      setSteps(["completed", "completed", "completed", "completed"]);
      const next: AnalysisRecord = { issue: trimmed, result, at: Date.now() };
      setRecord(next);
      setRunMeta({ id: Math.floor(1000 + Math.random() * 9000), seconds: (Date.now() - started) / 1000 });
      setRecent((prev) => {
        const updated = [next, ...prev].slice(0, 6);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // storage unavailable — ignore
        }
        return updated;
      });
    } catch (e) {
      window.clearTimeout(triageTimer);
      setSteps((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s === "processing");
        next[idx === -1 ? 1 : idx] = "failed";
        return next;
      });
      setError(
        e instanceof Error && e.message
          ? e.message
          : "The analysis could not be completed. Please try again.",
      );
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setIssue("");
    setRecord(null);
    setError(null);
    setRunMeta(null);
    setSteps(["pending", "pending", "pending", "pending"]);
  }

  const stepLabels = ["Student Issue", "Triage Agent", "Action Agent", "AI Recommendation"];
  const stepHints = ["Received and logged", "Classifying category and priority…", "Choosing department and next action…", "Compiling recommendation…"];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[40rem] w-[40rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-surface/70 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-surface/60 bg-surface/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30 text-sm font-semibold">
              CA
            </span>
            <div>
              <div className="text-[15px] font-semibold leading-none">CampusAssist AI</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Campus support, routed for you</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-ok/25 bg-ok/8 px-3 py-1.5 text-[11px] font-medium text-ok">
              <span className="size-1.5 rounded-full bg-ok animate-ca-pulse" />
              Both agents online
            </span>
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-[11px] text-muted-foreground">
              No sign-in
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-9 lg:py-12">
        <h1 className="max-w-[24ch] text-balance font-display text-[34px] leading-[1.05] font-bold lg:text-[44px]">
          Describe a campus problem. Two agents route it.
        </h1>
        <p className="mt-3 max-w-[52ch] text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Triage classifies the issue, then the Action agent points you to the right department and next
          step — clearly marked as an AI recommendation.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Left column: input + workflow */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-2xl border border-surface/70 bg-surface/70 p-5 shadow-sm shadow-primary/5 backdrop-blur-xl">
              <label
                htmlFor="issue-input"
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Describe the issue
              </label>
              <div className="mt-3 rounded-xl border border-border bg-surface/80 p-3">
                <textarea
                  id="issue-input"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value.slice(0, 1000))}
                  rows={4}
                  placeholder="e.g. The hot water in Block C hostel has been off since Monday and maintenance tickets haven't been answered."
                  className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{issue.length} / 1000</span>
                  <span>Nothing is sent until you analyze</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setIssue(example)}
                    className="rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    {example}
                  </button>
                ))}
              </div>
              {error && !running && (
                <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {error}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => run(issue)}
                  disabled={running}
                  className="rounded-xl bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {running ? "Analyzing…" : "Analyze Issue"}
                </button>
                {(record || error) && !running && (
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-border bg-surface/70 px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    Analyze Another Issue
                  </button>
                )}
                {error && !running && issue.trim() && (
                  <button
                    type="button"
                    onClick={() => run(issue)}
                    className="rounded-xl border border-border bg-surface/70 px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-surface/70 bg-surface/70 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Agent workflow
                </span>
                <span className="font-mono text-[10px] text-primary">{doneCount}/4 done</span>
              </div>
              <div className="mt-4">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex gap-3">
                    <StepDot status={steps[i] ?? "pending"} index={i} isLast={i === stepLabels.length - 1} />
                    <div className={i === stepLabels.length - 1 ? "" : "pb-5"}>
                      <div className="text-[13px] font-medium">{label}</div>
                      <div className="mt-1">
                        <StatusPill status={steps[i] ?? "pending"} />
                      </div>
                      {steps[i] === "processing" && (
                        <div className="mt-1.5 text-[12px] leading-snug text-muted-foreground">
                          {stepHints[i]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: result + recent */}
          <div className="space-y-5 lg:col-span-7">
            {record ? (
              <div className="animate-ca-in rounded-2xl border border-surface/70 bg-surface/70 p-6 shadow-sm shadow-primary/5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    AI Recommendation
                  </span>
                  {runMeta && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      run #{runMeta.id} · {runMeta.seconds.toFixed(1)}s
                    </span>
                  )}
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-foreground">“{record.issue}”</p>

                <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
                  <div className="bg-surface-2 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Category
                    </div>
                    <div className="mt-1 text-[13px] font-medium">{record.result.category}</div>
                  </div>
                  <div className="bg-surface-2 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Priority
                    </div>
                    <div className={`mt-1 text-[13px] font-medium ${PRIORITY_STYLE[record.result.priority]}`}>
                      {record.result.priority}
                    </div>
                  </div>
                  <div className="bg-surface-2 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Confidence
                    </div>
                    <div className="mt-1 text-[13px] font-medium">{record.result.confidence}%</div>
                  </div>
                  <div className="bg-surface-2 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Escalation
                    </div>
                    <div className="mt-1">
                      {record.result.escalation ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/10 px-2 py-0.5 text-[11px] font-medium text-warn">
                          <span className="size-1.5 rounded-full bg-warn" />
                          Recommended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/8 px-2 py-0.5 text-[11px] font-medium text-ok">
                          <span className="size-1.5 rounded-full bg-ok" />
                          Not needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface/60 p-4">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Triage reasoning
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">
                      {record.result.reasoning}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/60 p-4">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Recommended action
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">
                      {record.result.action}{" "}
                      <span className="font-medium">— {record.result.department}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="max-w-[46ch] text-pretty text-[12px] leading-relaxed text-muted-foreground">
                    AI recommendations are informational and should be verified with the appropriate
                    campus department for important matters.
                  </p>
                  <button
                    type="button"
                    onClick={() => run(record.issue)}
                    disabled={running}
                    className="rounded-xl border border-border bg-surface/70 px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-60"
                  >
                    Retry analysis
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 backdrop-blur-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  AI Recommendation
                </span>
                <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                  {running
                    ? "The agents are working on your issue. The recommendation will appear here."
                    : "Your analysis result will appear here once you describe an issue and press Analyze Issue."}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-surface/70 bg-surface/70 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Recent analyses
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">stored on this device</span>
              </div>
              {recent.length === 0 ? (
                <p className="mt-4 text-[13px] text-muted-foreground">
                  No analyses yet — your recent results will be listed here.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {recent.map((item) => (
                    <button
                      key={item.at}
                      type="button"
                      onClick={() => {
                        setRecord(item);
                        setIssue(item.issue);
                        setError(null);
                        setSteps(["completed", "completed", "completed", "completed"]);
                      }}
                      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-primary/5"
                    >
                      <span className="rounded-md bg-primary/8 px-2 py-1 text-[11px] font-medium text-primary">
                        {item.result.category}
                      </span>
                      <span className="flex-1 truncate text-[13px]">{item.issue}</span>
                      <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                        {item.result.confidence}%
                      </span>
                      {item.result.escalation ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/10 px-2 py-0.5 text-[11px] font-medium text-warn">
                          <span className="size-1.5 rounded-full bg-warn" />
                          Escalated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/8 px-2 py-0.5 text-[11px] font-medium text-ok">
                          <span className="size-1.5 rounded-full bg-ok" />
                          Completed
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-surface/60 bg-surface/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-[12px] text-muted-foreground">
          <span>
            AI recommendations are informational and should be verified with the appropriate campus
            department for important matters.
          </span>
          <span className="font-mono text-[11px]">No automatic irreversible actions</span>
        </div>
      </footer>
    </div>
  );
}
