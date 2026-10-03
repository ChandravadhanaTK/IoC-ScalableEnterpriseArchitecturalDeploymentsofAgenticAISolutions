import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ardent Prep — AI Interview Preparation" },
      { name: "description", content: "Plan, rehearse and review mock interviews with three cooperating AI agents." },
      { property: "og:title", content: "Ardent Prep — AI Interview Preparation" },
      { property: "og:description", content: "Plan, rehearse and review mock interviews with three cooperating AI agents." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
