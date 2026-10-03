import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/readyz")({
  server: {
    handlers: {
      GET: async () => {
        const ai = Boolean(process.env["LOVABLE_API_KEY"]);
        return Response.json({
          status: "ready",
          checks: { ai_gateway: ai ? "configured" : "not_configured", deterministic_engine: "ready" },
          mode: ai ? "real_ai_available" : "demo_fallback",
        });
      },
    },
  },
});
