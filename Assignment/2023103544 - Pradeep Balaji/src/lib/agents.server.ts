import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const RUN_ID = "X-Lovable-AIG-Run-ID";
const MODEL = "openai/gpt-6-astra";

export class GatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function createAgentRunner(apiKey: string, signal: AbortSignal) {
  let runId: string | undefined;
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    if (!res.ok) {
      const body = await res.clone().text().catch(() => "");
      throw new GatewayError(res.status, body.slice(0, 300));
    }
    return res;
  };
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: fetchFn as typeof fetch,
  });

  return async function runAgent(system: string, user: string): Promise<{ raw: string; json: unknown }> {
    let streamErr: unknown;
    const result = streamText({
      model: provider.responses(MODEL),
      system: system + "\n\nRespond with ONLY a single valid JSON object. No markdown fences, no prose.",
      prompt: user,
      abortSignal: signal,
      maxRetries: 0,
      onError: ({ error }) => {
        streamErr = error;
      },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const raw = await result.text;
    if (streamErr) throw streamErr;
    return { raw, json: parseJson(raw) };
  };
}

function parseJson(raw: string): unknown {
  const s = raw.replace(/```(?:json)?/g, "").trim();
  try {
    return JSON.parse(s);
  } catch {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(s.slice(a, b + 1));
      } catch {
        /* fallthrough */
      }
    }
    return { parse_error: true, text: raw };
  }
}

export const PROMPTS = {
  orchestrator: `You are the Orchestrator of Lease Guard, a multi-agent rental agreement reviewer.
Read the lease, split it into clauses, and assign each relevant clause (quote a short identifying excerpt or clause number) to specialist agents.
Return JSON: {"agents_needed":["legal","financial","tenant_rights"],"clause_assignments":{"legal":[string],"financial":[string],"rights":[string]},"reasoning":string}`,
  legal: `You are the Legal Agent. Analyze assigned lease clauses for legal risk: liability shifts, indemnification, termination, unenforceable or one-sided terms, ambiguity.
Return JSON: {"findings":[{"clause":string,"issue":string,"severity":"low"|"medium"|"high"|"critical","explanation":string}],"summary":string}`,
  financial: `You are the Financial Agent. Analyze assigned clauses for money risks: rent increases, deposits, fees, penalties, utilities, maintenance costs, hidden charges. Estimate cost impact when possible.
Return JSON: {"findings":[{"clause":string,"issue":string,"severity":"low"|"medium"|"high"|"critical","estimated_cost":string,"explanation":string}],"summary":string}`,
  tenant_rights: `You are the Tenant Rights Agent. Check assigned clauses for violations of common tenant protections: privacy/entry notice, habitability, repairs, retaliation, discrimination, deposit return, quiet enjoyment. Note that laws vary by jurisdiction.
Return JSON: {"findings":[{"clause":string,"right_affected":string,"severity":"low"|"medium"|"high"|"critical","explanation":string}],"summary":string}`,
  critic: `You are the Critic Agent. Review the findings from the legal, financial and tenant_rights agents against the lease text. Flag contradictions between agents, claims not supported by the lease text, and important issues all agents missed.
Return JSON: {"contradictions":[string],"unsupported_claims":[string],"missing_issues":[{"clause":string,"issue":string,"severity":"low"|"medium"|"high"|"critical"}],"corrections":[string],"confidence":number}`,
  synthesizer: `You are the Synthesizer. Combine specialist findings and the critic's corrections into a final tenant-facing report. Apply corrections; drop unsupported claims.
risk_score: 0 (very safe) to 100 (extremely risky).
Return JSON: {"risk_score":number,"risk_label":string,"summary":string,"red_flags":[{"title":string,"severity":"low"|"medium"|"high"|"critical","clause":string,"why_it_matters":string}] (exactly the top 5, most severe first),"questions_for_landlord":[string] (5-8),"negotiation_email":{"subject":string,"body":string}}`,
};
