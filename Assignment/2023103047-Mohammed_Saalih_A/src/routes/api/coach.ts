import { createFileRoute } from "@tanstack/react-router";
import { handleCoach } from "@/lib/coach.server";

export const Route = createFileRoute("/api/coach")({
  server: { handlers: { POST: ({ request }) => handleCoach(request) } },
});
