import { createOpenAI } from "@ai-sdk/openai";
import { streamText, APICallError, type ModelMessage } from "ai";

const MODEL = "openai/gpt-6-astra";

export class AgentError extends Error {}

function friendly(err: unknown): never {
  if (APICallError.isInstance(err)) {
    const s = err.statusCode;
    if (s === 402) throw new AgentError("AI credits are used up for this workspace. Please add credits and try again.");
    if (s === 429) throw new AgentError("The AI is busy right now. Please wait a moment and try again.");
    if (s === 403) throw new AgentError("AI access is currently blocked for this workspace.");
  }
  console.error("AI call failed", err);
  throw new AgentError("The AI service couldn't complete this request. Please try again.");
}

export async function callModel(system: string, messages: ModelMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AgentError("AI is not configured for this app yet.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  let text = "";
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system,
      messages,
      maxRetries: 0,
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
    text = await result.text;
  } catch (e) {
    friendly(e);
  }
  if (!text.trim()) throw new AgentError("The AI returned an empty answer. Please try again.");
  return text;
}

export async function callJson<T>(system: string, prompt: string): Promise<T> {
  const text = await callModel(
    system + "\nRespond with ONLY a single valid JSON object. No markdown fences, no commentary.",
    [{ role: "user", content: prompt }],
  );
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    throw new AgentError("The AI response couldn't be understood. Please try again.");
  }
}
