import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export const analysisSchema = z.object({
  category: z.enum(["Academic", "Hostel", "Technical", "Transport", "Administration", "Other"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  reasoning: z.string(),
  confidence: z.number(),
  department: z.string(),
  action: z.string(),
  escalation: z.boolean(),
});

export type IssueAnalysis = z.infer<typeof analysisSchema>;

const SYSTEM_PROMPT = `You are CampusAssist AI, a two-agent campus helpdesk system.

Agent 1 (Triage Agent): classify the student's issue into exactly one category (Academic, Hostel, Technical, Transport, Administration, Other), assign a priority (Low, Medium, High, Critical), write one or two short sentences of reasoning, and give a confidence percentage (0-100).

Agent 2 (Action Agent): using the triage result, name the most appropriate campus department, recommend one concrete next action for the student, and decide whether escalation is recommended (true only when the matter is urgent, safety-related, or previously ignored).

Rules: keep reasoning and action concise (under 40 words each). Never suggest irreversible actions. Be practical and specific to a university campus.`;

export async function analyzeCampusIssue(issue: string): Promise<IssueAnalysis> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new Error("AI service is not configured.");
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: SYSTEM_PROMPT,
    prompt: `Student issue: """${issue}"""`,
    output: Output.object({ schema: analysisSchema }),
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

  try {
    const output = await result.output;
    return analysisSchema.parse({
      ...output,
      confidence: Math.max(0, Math.min(100, Math.round(output.confidence))),
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("The AI agents could not produce a structured analysis. Please retry.");
    }
    throw error;
  }
}
