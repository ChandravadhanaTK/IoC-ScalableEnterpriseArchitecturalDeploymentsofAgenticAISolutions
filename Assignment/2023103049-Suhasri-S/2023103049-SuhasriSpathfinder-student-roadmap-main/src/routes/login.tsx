import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Pathfinder" },
      { name: "description", content: "Sign in to continue your adaptive career roadmap." },
      { property: "og:title", content: "Sign in — Pathfinder" },
      { property: "og:description", content: "Sign in to continue your adaptive career roadmap." },
    ],
  }),
  component: () => <AuthForm mode="login" />,
});
