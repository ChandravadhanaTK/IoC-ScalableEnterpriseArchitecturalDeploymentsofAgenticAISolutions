import { runAgent } from "./agents.functions";

export type AgentId = "destination" | "transport" | "stay" | "itinerary" | "budget" | "weather" | "critic";
export type Phase =
  | "COLLECT_INPUT" | "RESEARCH" | "BUILD_ITINERARY" | "OPTIMIZE_BUDGET" | "VALIDATE" | "USER_REVIEW" | "FAILED";

export const AGENT_LABELS: Record<AgentId, string> = {
  destination: "Destination Researcher",
  transport: "Transport Planner",
  stay: "Stay Finder",
  itinerary: "Itinerary Builder",
  budget: "Budget Optimizer",
  weather: "Weather & Safety Advisor",
  critic: "Critic / Validator",
};

export interface TripInput {
  origin: string; destination: string; startDate: string; days: number; travelers: number;
  budget: number; currency: string; interests: string; dietary: string;
  accommodation: string; transport: string; pace: "relaxed" | "balanced" | "packed";
}

export interface TraceEvent {
  id: string; agent: AgentId; attempt: number; status: "running" | "ok" | "error" | "fallback";
  startedAt: number; endedAt?: number; ms?: number; tokensIn?: number; tokensOut?: number; error?: string;
}

// deno-lint-ignore no-explicit-any
export type AnyJson = any;

export interface TripState {
  input: TripInput;
  phase: Phase;
  research: Partial<Record<"destination" | "transport" | "stay" | "weather", AnyJson>>;
  itinerary?: AnyJson; budget?: AnyJson; validation?: AnyJson;
  revisions: number; unresolved: string[]; trace: TraceEvent[];
}

const MAX_RETRIES = 2;
const MAX_REVISIONS = 1;
const TIMEOUT_MS = 120_000;

type Emit = (s: TripState) => void;

async function callAgent(state: TripState, emit: Emit, agent: AgentId, payload: Record<string, unknown>) {
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const ev: TraceEvent = { id: `${agent}-${Date.now()}-${attempt}`, agent, attempt, status: "running", startedAt: Date.now() };
    state.trace.push(ev); emit({ ...state });
    try {
      const res = await Promise.race([
        runAgent({ data: { agent, state: payload } }),
        new Promise<never>((_, r) => setTimeout(() => r(new Error("Timed out")), TIMEOUT_MS)),
      ]);
      ev.endedAt = Date.now(); ev.ms = ev.endedAt - ev.startedAt;
      if (res.ok) {
        ev.status = "ok"; ev.tokensIn = res.usage.input; ev.tokensOut = res.usage.output;
        emit({ ...state });
        return JSON.parse(res.json);
      }
      ev.status = "error"; ev.error = res.error; lastErr = res.error;
      emit({ ...state });
      const retryable = res.status === 429 || res.status >= 500 || res.status === 422;
      if (!retryable || ("terminal" in res && res.terminal)) break;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    } catch (e) {
      ev.endedAt = Date.now(); ev.ms = ev.endedAt - ev.startedAt;
      ev.status = "error"; ev.error = (e as Error).message; lastErr = ev.error;
      emit({ ...state });
    }
  }
  throw new Error(`${AGENT_LABELS[agent]} failed: ${lastErr}`);
}

export async function planTrip(input: TripInput, emit: Emit, prev?: TripState): Promise<TripState> {
  const state: TripState = prev
    ? { ...prev, input, revisions: 0, unresolved: [], validation: undefined }
    : { input, phase: "COLLECT_INPUT", research: {}, revisions: 0, unresolved: [], trace: [] };
  try {
    if (!prev) {
      state.phase = "RESEARCH"; emit({ ...state });
      const base = { trip: input };
      const tasks = (["destination", "transport", "stay", "weather"] as const).map(async (a) => {
        try {
          state.research[a] = await callAgent(state, emit, a, base);
        } catch (e) {
          if (a === "destination") throw e; // essential
          state.unresolved.push(`${AGENT_LABELS[a]} unavailable — plan built without it.`);
          state.trace.push({ id: `${a}-fb`, agent: a, attempt: 0, status: "fallback", startedAt: Date.now(), error: "Continued without this agent" });
        }
        emit({ ...state });
      });
      await Promise.all(tasks);
    }

    let revisionRequest: string | undefined;
    for (;;) {
      state.phase = "BUILD_ITINERARY"; emit({ ...state });
      state.itinerary = await callAgent(state, emit, "itinerary", {
        trip: input, research: state.research, ...(revisionRequest ? { revisionRequest, previous: state.itinerary } : {}),
      });
      state.phase = "OPTIMIZE_BUDGET"; emit({ ...state });
      state.budget = await callAgent(state, emit, "budget", {
        trip: input, transport: state.research.transport, stay: state.research.stay, itinerary: state.itinerary,
      });
      state.phase = "VALIDATE"; emit({ ...state });
      state.validation = await callAgent(state, emit, "critic", {
        trip: input, itinerary: state.itinerary, budget: state.budget, weather: state.research.weather,
      });
      const issues: AnyJson[] = state.validation?.issues ?? [];
      const serious = issues.filter((i) => i.severity !== "low");
      if (state.validation?.passed && serious.length === 0) break;
      if (state.revisions >= MAX_REVISIONS) {
        state.unresolved.push(...serious.map((i) => `${i.description} (suggested: ${i.fix})`));
        break;
      }
      state.revisions++;
      revisionRequest = serious.map((i) => `${i.description} → ${i.fix}`).join("\n");
    }
    state.phase = "USER_REVIEW"; emit({ ...state });
  } catch (e) {
    state.phase = "FAILED";
    state.unresolved.push((e as Error).message);
    emit({ ...state });
  }
  return state;
}
