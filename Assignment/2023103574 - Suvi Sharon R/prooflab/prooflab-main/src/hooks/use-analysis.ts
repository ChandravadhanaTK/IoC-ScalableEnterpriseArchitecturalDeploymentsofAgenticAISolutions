// Agent orchestrator: runs stages in order, passes earlier findings forward, skips non-applicable stages.
import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { runStage } from "@/lib/agent/agent.functions";
import { STAGES, type Analysis, type StageId, type StageResults, type StageStatus, type Understanding } from "@/lib/agent/types";

const initialStatus = () => Object.fromEntries(STAGES.map((s) => [s.id, "pending"])) as Record<StageId, StageStatus>;

export function useAnalysis(onDone: (a: Analysis) => void) {
  const run = useServerFn(runStage);
  const [status, setStatus] = useState(initialStatus);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const cancelled = useRef(false);

  const start = useCallback(async (idea: string) => {
    cancelled.current = false;
    setError(null);
    setAnalysis(null);
    setRunning(true);
    const st = initialStatus();
    setStatus({ ...st });
    const results: StageResults = {};
    const skipped: Partial<Record<StageId, string>> = {};

    for (const { id } of STAGES) {
      if (cancelled.current) break;
      if (skipped[id]) {
        st[id] = "skipped";
        setStatus({ ...st });
        continue;
      }
      st[id] = "running";
      setStatus({ ...st });
      try {
        const res = await run({ data: { stage: id, idea, context: results as Record<string, unknown> } });
        if (!res.ok) throw new Error(res.error);
        (results as Record<string, unknown>)[id] = res.result;
        if (id === "understanding") {
          for (const s of (res.result as Understanding).skip ?? []) {
            if (s?.stage && s.stage !== "understanding" && s.stage !== "final") skipped[s.stage] = s.reason;
          }
        }
        st[id] = "completed";
        setStatus({ ...st });
      } catch (e) {
        st[id] = "error";
        setStatus({ ...st });
        setError(e instanceof Error ? e.message : "Analysis failed.");
        setRunning(false);
        return;
      }
    }

    setRunning(false);
    if (cancelled.current) return;
    const a: Analysis = { id: crypto.randomUUID(), idea, createdAt: Date.now(), results, skipped };
    setAnalysis(a);
    onDone(a);
  }, [run, onDone]);

  const reset = useCallback(() => {
    cancelled.current = true;
    setRunning(false);
    setError(null);
    setAnalysis(null);
    setStatus(initialStatus());
  }, []);

  return { status, running, error, analysis, setAnalysis, start, reset };
}
