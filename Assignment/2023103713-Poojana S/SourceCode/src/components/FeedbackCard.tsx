import type { Feedback } from "@/lib/feedback";

export function FeedbackCard({ fb }: { fb: Feedback }) {
  return (
    <div className="glass grid gap-6 p-6 md:grid-cols-4">
      <div>
        <p className="label-mono">Score</p>
        <p className="mt-2 font-display text-5xl font-bold text-primary">{fb.rating}<span className="text-xl text-muted-foreground">/10</span></p>
      </div>
      <List title="Strengths" items={fb.strengths} tone="!text-good" />
      <List title="Weak areas" items={fb.weaknesses.length ? fb.weaknesses : ["Nothing major — nice work."]} tone="!text-weak" />
      <div>
        <List title="Tips" items={fb.tips} tone="!text-primary" />
        <p className="label-mono mb-2 mt-4">Practice next</p>
        <div className="flex flex-wrap gap-2">{fb.topics.map((t) => <span key={t} className="rounded-md bg-accent/15 px-2 py-1 text-xs text-accent">{t}</span>)}</div>
      </div>
    </div>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <p className={`label-mono mb-2 ${tone}`}>{title}</p>
      <ul className="space-y-2 text-sm">{items.map((s) => <li key={s}>• {s}</li>)}</ul>
    </div>
  );
}
