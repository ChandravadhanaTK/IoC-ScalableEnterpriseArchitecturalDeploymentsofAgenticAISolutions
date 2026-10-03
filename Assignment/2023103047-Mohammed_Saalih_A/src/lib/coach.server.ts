import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const RUN = "X-Lovable-AIG-Run-ID";

export const COACH_SYSTEM = `You are Stonks Fish, a warm, sharp human chess coach. You are NOT an engine.
Never mention engine evaluations, centipawns, or numbers like +1.7. Never claim engine-level certainty; use language like "this move appears to create a problem because...".
You receive the game PGN, the selected move, and the FEN before and after it. Reason carefully about the actual position from the FEN.

When asked to explain a move, answer in markdown with these sections:
### Your move: <SAN>
**What you were trying to do:** ...
**What was good:** ...
**What could be improved:** ... (look for blunders, hanging pieces, missed captures, king safety, weak squares, development, pawn structure, bad exchanges, premature attacks, passivity)
**What you should have considered:** give a thinking process (threats, checks, captures, opponent ideas, candidate moves) rather than just "play X".
**Chess lesson:** one general principle.
End with ONE short question that makes the student think about the position.

In follow-ups, coach Socratically: when the student asks "why was this bad?", first guide them with a question before revealing the answer, unless they explicitly ask for the answer. Keep replies concise and encouraging.`;

export async function handleCoach(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("AI is not configured", { status: 500 });
  let body: { messages?: ModelMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid request", { status: 400 });
  }
  const messages = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
  );
  if (!messages.length) return new Response("No messages", { status: 400 });

  let runId = request.headers.get(RUN) ?? undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const h = new Headers(init?.headers);
      if (runId && !h.has(RUN)) h.set(RUN, runId);
      const res = await fetch(input, { ...init, headers: h });
      runId ??= res.headers.get(RUN) ?? undefined;
      if (!res.ok) gatewayStatus = res.status;
      return res;
    },
  });
  let gatewayStatus = 0;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: COACH_SYSTEM,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
    onError: ({ error }) => console.error("coach error", gatewayStatus, error),
  });
  return result.toTextStreamResponse();
}
