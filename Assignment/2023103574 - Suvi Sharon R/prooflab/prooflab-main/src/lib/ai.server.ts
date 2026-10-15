// Server-only Lovable AI Gateway helper. Never import from client code.
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
    const response = await fetch(input, { ...init, headers });
    runId ??= response.headers.get(RUN_ID_HEADER)?.trim() || undefined;
    return response;
  };
}

export class AiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

/** Runs one prompt and parses the model's JSON answer. */
export async function runJsonPrompt<T>(system: string, user: string): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new AiError("AI is not configured on the server.", 401);

  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: createRunIdFetch(),
  });

  let streamError: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    system,
    prompt: user,
    onError: ({ error }) => {
      streamError = error;
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

  let text = "";
  try {
    text = await result.text;
  } catch (e) {
    streamError ??= e;
  }
  if (streamError || !text) throw toAiError(streamError);
  return parseJson<T>(text);
}

function toAiError(error: unknown): AiError {
  const status = (error as { statusCode?: number })?.statusCode;
  if (status === 429) return new AiError("Too many requests. Please wait a moment and try again.", 429);
  if (status === 402) return new AiError("AI credits are exhausted. Add credits in workspace billing to continue.", 402);
  if (status === 403) return new AiError("The AI request was denied.", 403);
  if (!error) return new AiError("The AI returned an empty response.");
  return new AiError("The AI service failed to respond. Please try again.", status);
}

export function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new AiError("The AI response could not be read. Please try again.");
  }
}
