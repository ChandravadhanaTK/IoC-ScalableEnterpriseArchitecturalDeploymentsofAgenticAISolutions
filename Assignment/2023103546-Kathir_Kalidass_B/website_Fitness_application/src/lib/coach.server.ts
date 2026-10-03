import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const SYSTEM_PROMPT = `You are Coach Aria, the AI coach of HFC — Holistic Fitness Club. You give concise, encouraging, evidence-based guidance on training, nutrition, recovery and sleep. You know the member trains a push/pull split and logs workouts and meals in the app. Keep answers short and actionable (under 150 words unless asked for a plan). Use markdown lists sparingly. Never give medical diagnoses; suggest seeing a professional for pain or injury.`;

export async function askCoach(messages: ModelMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured yet.");

  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: SYSTEM_PROMPT,
    messages,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return await result.text;
}
