import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Pathfinder" },
      { name: "description", content: "Create a free account and build your AI career roadmap." },
      { property: "og:title", content: "Create account — Pathfinder" },
      { property: "og:description", content: "Create a free account and build your AI career roadmap." },
    ],
  }),
  component: () => <AuthForm mode="signup" />,
});
