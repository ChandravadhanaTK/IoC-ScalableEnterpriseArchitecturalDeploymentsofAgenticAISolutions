import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";
import { createGatewayProvider } from "@/lib/ai-gateway.server";

const Body = z.object({
  invoice: z.record(z.string(), z.unknown()),
  findings: z.array(z.object({ rule: z.string(), severity: z.string(), detail: z.string() })),
  policies: z.array(z.string()),
});

const SYSTEM = `You are "Ledger", the AI Auditor agent inside an enterprise Invoice & Expense Auditing system.
You receive one invoice/expense claim (already extracted to JSON), the deterministic policy-engine findings, and the company expense policy.
Your job: reason like a senior internal auditor. Do NOT invent facts that are not in the data.
Write a concise markdown report with these sections:
### Summary (2 sentences)
### Findings (bullets: each with severity HIGH/MEDIUM/LOW and evidence from the data)
### Fraud & Anomaly Signals (bullets, or "None detected")
### Recommendation (one paragraph)
Keep the whole report under 250 words.
The very last line MUST be exactly: VERDICT: {"decision":"APPROVE"|"REVIEW"|"REJECT","risk":<integer 0-100>,"confidence":<number 0-1>}`;

export const Route = createFileRoute("/api/audit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY'];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const { invoice, findings, policies } = parsed.data;
        const { provider, getRunId } = createGatewayProvider(apiKey, request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined);
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: SYSTEM,
          prompt: `POLICY:\n- ${policies.join("\n- ")}\n\nINVOICE:\n${JSON.stringify(invoice, null, 2)}\n\nPOLICY ENGINE FINDINGS:\n${JSON.stringify(findings, null, 2)}`,
          abortSignal: request.signal,
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
        const res = result.toTextStreamResponse({ headers: { "Cache-Control": "no-cache, no-transform" } });
        const id = getRunId();
        if (id) res.headers.set("X-Lovable-AIG-Run-ID", id);
        return res;
      },
    },
  },
});
