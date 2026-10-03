import { supabase } from "./supabase";
// Agent Orchestrator: runs an agent, times it, and records the execution in agent_logs.
export async function runAgent<T>(uid: string, agent: string, action: string, fn: () => T | Promise<T>, summary: (r: T) => string): Promise<T> {
  const t = performance.now();
  try {
    const r = await fn();
    await supabase.from("agent_logs").insert({ user_id: uid, agent, action, status: "success", duration_ms: Math.round(performance.now() - t), summary: summary(r) });
    return r;
  } catch (e) {
    await supabase.from("agent_logs").insert({ user_id: uid, agent, action, status: "error", duration_ms: Math.round(performance.now() - t), summary: String(e) });
    throw e;
  }
}
