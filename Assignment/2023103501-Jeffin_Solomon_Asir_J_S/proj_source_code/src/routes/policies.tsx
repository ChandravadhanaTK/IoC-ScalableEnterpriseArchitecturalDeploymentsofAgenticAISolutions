import { createFileRoute } from "@tanstack/react-router";
import { POLICIES } from "@/lib/store";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Policy Book — AuditLens" },
      { name: "description", content: "Company expense policy enforced by the AuditLens agents." },
      { property: "og:title", content: "Policy Book — AuditLens" },
      { property: "og:description", content: "Company expense policy enforced by the AuditLens agents." },
    ],
  }),
  component: () => (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Policy Book</h1>
      <p className="mt-2 text-muted-foreground">Rules are enforced twice: deterministically by the Policy Engine, and contextually by the AI Auditor. HIGH-severity rule hits can never be auto-approved.</p>
      <ol className="panel mt-8 space-y-3">
        {POLICIES.map((p, k) => (
          <li key={k} className="flex gap-4 border-b pb-3 last:border-0">
            <span className="font-mono text-accent-foreground/60">§{k + 1}</span><span>{p}</span>
          </li>
        ))}
      </ol>
    </div>
  ),
});
