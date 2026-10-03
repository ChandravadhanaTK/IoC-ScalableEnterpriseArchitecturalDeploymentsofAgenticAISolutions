import { Loader2, Sparkles } from "lucide-react";

const examples = [
  { label: "Prepare for an exam", goal: "Prepare for my DBMS exam in 5 days" },
  { label: "Learn React", goal: "Learn React fundamentals in 7 days" },
  { label: "Complete a project", goal: "Complete my final year project in 6 days" },
  { label: "Prepare for an interview", goal: "Prepare for a software engineering interview" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string;
}

export function GoalInput({ value, onChange, onSubmit, busy, error }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <label htmlFor="goal" className="text-base font-semibold">
        What do you want to accomplish?
      </label>
      <textarea
        id="goal"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
        }}
        placeholder="Prepare for my DBMS exam in 5 days"
        className="mt-3 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Demo:</span>
        {examples.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => onChange(ex.goal)}
            className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition hover:border-primary hover:text-primary"
          >
            {ex.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Planning…" : "Create Plan"}
        </button>
      </div>
    </section>
  );
}
