import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { runPipeline, AgentError } from "@/lib/agents.server";

const Body = z.object({
  complaint: z.string().trim().min(10).max(5000),
  policy: z.string().trim().min(10).max(8000),
});

export const Route = createFileRoute("/api/resolve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Complaint and policy must be at least 10 characters." }, { status: 400 });
        }
        const enc = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
            try {
              for await (const ev of runPipeline(parsed.data.complaint, parsed.data.policy, request.signal)) send(ev);
            } catch (err: any) {
              if (!request.signal.aborted) {
                const status = err instanceof AgentError ? err.status : undefined;
                let message = err?.message ?? "Something went wrong";
                if (status === 429) message = "The AI is rate limited right now. Please wait a moment and try again.";
                if (status === 402) message = "AI credits are exhausted. Add credits to your workspace to continue.";
                send({ type: "error", message, status });
              }
            } finally {
              try { controller.close(); } catch { /* closed */ }
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
