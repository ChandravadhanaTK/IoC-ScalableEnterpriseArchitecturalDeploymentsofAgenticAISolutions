import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  text: z.string().min(3).max(4000),
  department: z.string().min(1).max(50),
  policy: z.string().max(20000),
});

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Please enter a purchase request of at least a few words." }, { status: 400 });
        }
        const { runPipeline, FriendlyError } = await import("@/lib/procure/pipeline.server");
        const enc = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const emit = (e: unknown) => {
              try { controller.enqueue(enc.encode(JSON.stringify(e) + "\n")); } catch { /* closed */ }
            };
            try {
              await runPipeline(parsed.data, emit, request.signal);
            } catch (err) {
              const friendly = err instanceof FriendlyError;
              emit({
                type: "error",
                message: friendly ? err.message : "Something went wrong while analyzing. Please retry.",
                retryable: friendly ? err.retryable : true,
              });
              if (!friendly) console.error(err);
            } finally {
              try { controller.close(); } catch { /* noop */ }
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
