import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const MODEL = "openai/gpt-6-astra";
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export type PipelineEvent =
  | { type: "stage"; agent: string; status: "running" | "done" | "error"; attempt?: number; output?: unknown; ms?: number; error?: string }
  | { type: "route"; route: string }
  | { type: "final"; reply: string; summary: unknown; scores: number[]; escalate: boolean; escalateReasons: string[] }
  | { type: "error"; message: string; status?: number };

function createRunIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID_HEADER)?.trim() || undefined;
    return res;
  };
}

export class AgentError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

const SPECIALISTS: Record<string, string> = {
  billing:
    "You are a senior BILLING specialist. You understand invoices, double charges, refunds, subscriptions, proration and chargebacks. Diagnose the billing problem precisely and propose a concrete resolution (amounts, timelines).",
  technical:
    "You are a senior TECHNICAL support engineer. You diagnose bugs, outages, login issues, crashes and configuration problems. Give a likely root cause and concrete troubleshooting/fix steps plus any goodwill gesture.",
  logistics:
    "You are a senior LOGISTICS/delivery specialist. You handle late, lost, damaged or wrong shipments, carriers and returns. Diagnose what likely happened and propose a concrete resolution (reship, refund, tracking escalation).",
};

function extractJson(text: string): any {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e <= s) throw new AgentError("Agent returned no JSON");
  try {
    return JSON.parse(text.slice(s, e + 1));
  } catch {
    throw new AgentError("Agent returned malformed JSON");
  }
}

export async function* runPipeline(
  complaint: string,
  policy: string,
  signal: AbortSignal,
): AsyncGenerator<PipelineEvent> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new AgentError("AI is not configured", 401);
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: createRunIdFetch(),
  });

  async function callOnce(system: string, user: string): Promise<any> {
    const result = streamText({
      model: provider.responses(MODEL),
      system: system + "\n\nRespond with ONLY a single valid JSON object, no markdown fences, no prose.",
      prompt: user,
      abortSignal: signal,
      maxRetries: 0,
      providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low" } },
    });
    let text = "";
    try {
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") text += part.text;
        if (part.type === "error") throw part.error;
      }
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      throw new AgentError(err?.responseBody ? safeMsg(err.responseBody, err.message) : err?.message ?? "AI call failed", status);
    }
    return extractJson(text);
  }

  async function call(system: string, user: string): Promise<any> {
    // Bounded retry only for 429 / 5xx.
    for (let i = 0; ; i++) {
      try {
        return await callOnce(system, user);
      } catch (err) {
        const st = err instanceof AgentError ? err.status : undefined;
        const retryable = st === 429 || (st !== undefined && st >= 500);
        if (!retryable || i >= 2 || signal.aborted) throw err;
        await new Promise((r) => setTimeout(r, 1500 * 2 ** i + Math.random() * 500));
      }
    }
  }

  async function* stage(agent: string, fn: () => Promise<any>, attempt?: number) {
    yield { type: "stage", agent, status: "running", attempt } as PipelineEvent;
    const t = Date.now();
    try {
      const output = await fn();
      yield { type: "stage", agent, status: "done", attempt, output, ms: Date.now() - t } as PipelineEvent;
      return output;
    } catch (err: any) {
      yield { type: "stage", agent, status: "error", attempt, error: err.message, ms: Date.now() - t } as PipelineEvent;
      throw err;
    }
  }

  // 1. Triage
  const triage = yield* stage("triage", () =>
    call(
      `You are a support TRIAGE agent. Classify the complaint. Return JSON:
{"category": string, "urgency": "low"|"medium"|"high", "sentiment": "positive"|"neutral"|"frustrated"|"angry", "intent": string (one sentence), "route": "billing"|"technical"|"logistics"}`,
      complaint,
    ),
  );
  const route = ["billing", "technical", "logistics"].includes(triage.route) ? triage.route : "technical";
  yield { type: "route", route };

  // 2. Specialist (only the routed one)
  const specialist = yield* stage(route, () =>
    call(
      `${SPECIALISTS[route]}\nReturn JSON: {"diagnosis": string, "proposed_resolution": string}`,
      `Complaint:\n${complaint}\n\nTriage:\n${JSON.stringify(triage)}`,
    ),
  );

  // 3. Policy
  const pol = yield* stage("policy", () =>
    call(
      `You are a POLICY compliance agent. Check the proposed resolution strictly against the company policy. If it violates policy, adjust it to the most customer-friendly compliant alternative. Return JSON:
{"compliant": boolean, "violations": string[], "adjusted_resolution": string}`,
      `Company policy:\n${policy}\n\nComplaint:\n${complaint}\n\nProposed resolution:\n${specialist.proposed_resolution}`,
    ),
  );

  // 4-5. Writer + QA loop
  const scores: number[] = [];
  let feedback = "";
  let draft: any = null;
  let qa: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    draft = yield* stage(
      "writer",
      () =>
        call(
          `You are a customer support WRITER. Write the reply to the customer. Match tone to sentiment "${triage.sentiment}": for frustrated/angry customers be empathetic, apologetic and direct; otherwise warm and concise. Never promise anything beyond the resolution given. Sign off as "The Support Team". Return JSON: {"subject": string, "reply": string}`,
          `Complaint:\n${complaint}\n\nResolution to communicate:\n${pol.adjusted_resolution}\n${
            feedback ? `\nPrevious draft:\n${draft?.reply}\n\nQA feedback to address:\n${feedback}` : ""
          }`,
        ),
      attempt,
    );
    qa = yield* stage(
      "qa",
      () =>
        call(
          `You are a strict QA reviewer for customer support replies. Score 0-10 on empathy, accuracy vs the resolution, policy compliance, clarity and tone. Be demanding: 8+ means ready to send. Return JSON: {"score": number, "feedback": string, "issues": string[]}`,
          `Complaint:\n${complaint}\n\nPolicy:\n${policy}\n\nApproved resolution:\n${pol.adjusted_resolution}\n\nDraft reply:\n${draft.reply}`,
        ),
      attempt,
    );
    const score = Number(qa.score) || 0;
    scores.push(score);
    if (score >= 8) break;
    feedback = qa.feedback;
  }

  const reasons: string[] = [];
  if (triage.urgency === "high") reasons.push("High urgency");
  if (Math.max(...scores) < 8) reasons.push("QA never reached 8");

  yield {
    type: "final",
    reply: draft.reply,
    scores,
    escalate: reasons.length > 0,
    escalateReasons: reasons,
    summary: {
      category: triage.category,
      urgency: triage.urgency,
      sentiment: triage.sentiment,
      intent: triage.intent,
      routed_to: route,
      diagnosis: specialist.diagnosis,
      policy_compliant: pol.compliant,
      violations: pol.violations,
      final_resolution: pol.adjusted_resolution,
      qa_attempts: scores.length,
    },
  };
}

function safeMsg(body: string, fallback: string) {
  try {
    const j = JSON.parse(body);
    return j?.error?.message ?? j?.message ?? fallback;
  } catch {
    return fallback;
  }
}
