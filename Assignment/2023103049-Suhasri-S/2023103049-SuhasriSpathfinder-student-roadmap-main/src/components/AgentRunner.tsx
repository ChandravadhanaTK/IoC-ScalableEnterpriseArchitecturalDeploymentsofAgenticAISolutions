import { useEffect, useState } from "react";

const PHASES = [
  "Analyzing your career goal…",
  "Identifying required skills…",
  "Calculating your skill gaps…",
  "Building your personalized roadmap…",
  "Ordering prerequisites and resources…",
];

export function AgentRunner({ phases = PHASES }: { phases?: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, phases.length - 1)), 9000);
    return () => clearInterval(t);
  }, [phases.length]);
  return (
    <div className="rounded-2xl border bg-card p-8" role="status">
      <ul className="space-y-3">
        {phases.map((p, k) => (
          <li key={p} className={k <= i ? "flex items-center gap-3 font-medium" : "flex items-center gap-3 text-muted-foreground/50"}>
            {k < i ? <span className="h-4 w-4 rounded-full bg-success" /> : k === i ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <span className="h-4 w-4 rounded-full border" />}
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">This usually takes under a minute. Please keep this page open.</p>
    </div>
  );
}
