import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createAgentRunner, GatewayError, PROMPTS } from "@/lib/agents.server";

const Body = z.object({ lease: z.string().min(50).max(60000) });

function friendly(err: unknown): string {
  if (err instanceof GatewayError) {
    if (err.status === 429) return "The AI is busy right now (rate limited). Please wait a minute and try again.";
    if (err.status === 402) return "AI credits are used up for this workspace. Add credits to keep analyzing leases.";
    if (err.status === 403) return "AI access is blocked for this workspace. Check workspace AI settings.";
    if (err.status === 401) return "The AI service isn't configured correctly.";
    if (err.status >= 500) return "The AI service had a temporary problem. Please try again shortly.";
    return "The AI request was rejected. Try a shorter or cleaner lease text.";
  }
  const m = (err as { statusCode?: number })?.statusCode;
  if (m === 429) return "The AI is busy right now (rate limited). Please wait a minute and try again.";
  if (m === 402) return "AI credits are used up for this workspace.";
  return "Something went wrong while analyzing. Please try again.";
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return Response.json({ error: "Please paste a lease of at least 50 characters." }, { status: 400 });
        const apiKey = process.env['LOVABLE_API_KEY'];
        if (!apiKey) return Response.json({ error: "AI service not configured." }, { status: 500 });
        const lease = parsed.data.lease;
        const run = createAgentRunner(apiKey, request.signal);
        const enc = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            const send = (o: object) => {
              try {
                controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
              } catch {
                /* closed */
              }
            };
            const stage = async (agent: string, sys: string, user: string) => {
              const t = Date.now();
              send({ type: "status", agent, status: "running" });
              try {
                const out = await run(sys, user);
                send({ type: "status", agent, status: "done", ms: Date.now() - t, output: out.json, raw: out.raw });
                return out.json as Record<string, unknown>;
              } catch (e) {
                send({ type: "status", agent, status: "error", ms: Date.now() - t });
                throw e;
              }
            };
            try {
              const plan = await stage("orchestrator", PROMPTS.orchestrator, `LEASE:\n${lease}`);
              const ca = (plan['clause_assignments'] ?? {}) as Record<string, unknown>;
              const mk = (k: string) =>
                `Assigned clauses:\n${JSON.stringify(ca[k] ?? [])}\n\nFULL LEASE:\n${lease}`;
              const [legal, financial, rights] = await Promise.all([
                stage("legal", PROMPTS.legal, mk("legal")),
                stage("financial", PROMPTS.financial, mk("financial")),
                stage("tenant_rights", PROMPTS.tenant_rights, mk("rights")),
              ]);
              const findings = JSON.stringify({ legal, financial, tenant_rights: rights });
              const critic = await stage("critic", PROMPTS.critic, `FINDINGS:\n${findings}\n\nLEASE:\n${lease}`);
              const report = await stage(
                "synthesizer",
                PROMPTS.synthesizer,
                `FINDINGS:\n${findings}\n\nCRITIC:\n${JSON.stringify(critic)}\n\nLEASE:\n${lease}`,
              );
              send({ type: "report", report });
            } catch (e) {
              if (!request.signal.aborted) {
                console.error("analyze failed", e);
                send({ type: "error", message: friendly(e) });
              }
            } finally {
              try {
                controller.close();
              } catch {
                /* noop */
              }
            }
          },
        });
        return new Response(stream, {
          headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache, no-transform" },
        });
      },
    },
  },
});
