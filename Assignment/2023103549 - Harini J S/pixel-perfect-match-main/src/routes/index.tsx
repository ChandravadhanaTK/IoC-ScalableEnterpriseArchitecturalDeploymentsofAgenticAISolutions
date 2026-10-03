import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KnowFlow — Personal Knowledge Intelligence" },
      { name: "description", content: "Collect, connect and question your own documents with grounded, cited AI answers." },
      { property: "og:title", content: "KnowFlow — Personal Knowledge Intelligence" },
      { property: "og:description", content: "Collect, connect and question your own documents with grounded, cited AI answers." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
