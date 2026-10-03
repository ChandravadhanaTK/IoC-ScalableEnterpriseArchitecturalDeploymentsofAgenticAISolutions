import { supabase } from "@/integrations/supabase/client";

export type Run = {
  id: string; trace_id: string; meeting_id: string | null; agent: string; step: string; state: string;
  success: boolean | null; error: string | null; model: string | null; input_tokens: number | null;
  output_tokens: number | null; duration_ms: number | null; details: any; created_at: string;
};

export async function fetchRuns(): Promise<Run[]> {
  const { data } = await supabase.from("agent_runs").select("*").order("created_at", { ascending: false }).limit(1000);
  return (data ?? []) as Run[];
}

export function groupTraces(runs: Run[]) {
  const map = new Map<string, Run[]>();
  for (const r of runs) map.set(r.trace_id, [...(map.get(r.trace_id) ?? []), r]);
  return [...map.entries()].map(([traceId, rs]) => {
    const sorted = rs.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const failed = sorted.some((r) => r.state === "FAILED");
    const last = sorted.at(-1)!;
    const tokens = sorted.reduce((s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0);
    const duration = sorted.reduce((s, r) => s + (r.duration_ms ?? 0), 0);
    const kind = sorted.some((r) => r.agent === "MeetingAnalysisAgent") ? "Meeting pipeline" : "Reminder scan";
    return { traceId, runs: sorted, failed, state: failed ? "FAILED" : last.state, start: sorted[0]!.created_at, tokens, duration, kind, meetingId: sorted[0]!.meeting_id };
  }).sort((a, b) => b.start.localeCompare(a.start));
}

export const AGENT_LABEL: Record<string, string> = {
  Orchestrator: "Orchestrator",
  MeetingAnalysisAgent: "Meeting Analysis Agent",
  HumanApproval: "Human Approval",
  TaskManagementAgent: "Task Management Agent",
  ReminderAgent: "Reminder Agent",
};
