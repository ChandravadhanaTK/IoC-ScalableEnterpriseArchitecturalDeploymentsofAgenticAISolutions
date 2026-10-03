import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About – ResearchMate" },
      { name: "description", content: "About ResearchMate, an agentic AI research paper assistant built for an IoC capstone." },
      { property: "og:title", content: "About – ResearchMate" },
      { property: "og:description", content: "What ResearchMate is and how its agentic workflow works." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-semibold text-primary">About ResearchMate</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed">
        <p>ResearchMate is an Agentic AI Research Paper Assistant built as an IoC capstone project. It turns a natural-language request into a short, grounded research report built from real scholarly records.</p>
        <h2 className="pt-4 text-2xl font-semibold">What is Agentic AI?</h2>
        <blockquote className="border-l-4 border-accent bg-card p-4 italic">
          ResearchMate uses multiple specialized agent steps. The planner understands the research request, the search agent retrieves scholarly papers, the validation agent verifies metadata, the ranking agent prioritizes relevant papers, and the analysis and synthesis agents generate the final research response.
        </blockquote>
        <h2 className="pt-4 text-2xl font-semibold">Data honesty</h2>
        <p>Papers, authors, DOIs and links come only from the OpenAlex API. Nothing is invented. Missing fields are shown as “Metadata unavailable”. The relevance score is ResearchMate's own explainable formula, not an official metric.</p>
        <h2 className="pt-4 text-2xl font-semibold">Technology</h2>
        <p>React, TypeScript, Vite, Tailwind CSS, TanStack Start server functions, OpenAlex API, and Lovable AI for summarization (with a deterministic fallback).</p>
      </div>
    </div>
  );
}
