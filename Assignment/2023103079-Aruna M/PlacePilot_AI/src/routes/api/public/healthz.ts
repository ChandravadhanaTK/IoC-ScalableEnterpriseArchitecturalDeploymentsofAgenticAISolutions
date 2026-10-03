import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/healthz")({
  server: {
    handlers: {
      GET: async () => Response.json({ status: "ok", service: "placepilot-ai", ts: new Date().toISOString() }),
    },
  },
});
