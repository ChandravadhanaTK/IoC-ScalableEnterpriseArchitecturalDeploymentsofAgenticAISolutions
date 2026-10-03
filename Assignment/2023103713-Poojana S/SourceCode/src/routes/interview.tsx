import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { FeedbackCard } from "@/components/FeedbackCard";
import { INTERVIEW } from "@/lib/questions";
import { analyzeAnswer, type Feedback } from "@/lib/feedback";
import { addInterview, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/interview")({
  head: () => meta("Mock Interview", "Random technical, HR and behavioral interview questions with instant answer feedback."),
  component: Interview,
});

function Interview() {
  const cats = Object.keys(INTERVIEW);
  const [cat, setCat] = useState<string>(cats[0] ?? "Technical");
  const [q, setQ] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [fb, setFb] = useState<Feedback | null>(null);
  const { interviews } = useStore();

  const next = (c = cat) => {
    const list = (INTERVIEW[c] ?? []).filter((x) => x !== q);
    setQ(list[Math.floor(Math.random() * list.length)] ?? null);
    setAnswer(""); setFb(null);
  };
  const submit = () => {
    if (!q || answer.trim().length < 10) return;
    const f = analyzeAnswer(answer.slice(0, 4000), cat);
    setFb(f);
    addInterview({ category: cat, question: q, answer: answer.slice(0, 4000), rating: f.rating });
  };

  return (
    <>
      <PageHeader eyebrow="Prepare · Mock interview" title="Interview simulator" sub="Choose a round, get a random question, and type your answer as you'd say it." />
      <div className="mb-4 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => { setCat(c); next(c); }}
            className={`rounded-lg px-4 py-2 text-sm ${c === cat ? "bg-primary/15 text-primary" : "btn-ghost"}`}>{c}</button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-2">
          {q ? (
            <>
              <p className="label-mono">{cat} round</p>
              <h2 className="mt-2 font-display text-xl font-semibold">{q}</h2>
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={4000} rows={8}
                placeholder="Type your answer…" className="mt-4 w-full rounded-lg border border-border bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className="btn-primary" disabled={answer.trim().length < 10} onClick={submit}>Get feedback</button>
                <button className="btn-ghost" onClick={() => next()}>New question</button>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </>
          ) : (
            <div className="grid place-items-center py-12 text-center">
              <p className="text-muted-foreground">Ready when you are.</p>
              <button className="btn-primary mt-4" onClick={() => next()}>Generate question</button>
            </div>
          )}
        </div>
        <div className="glass p-5">
          <h2 className="mb-3 font-display font-semibold">Session history</h2>
          <ul className="space-y-3 text-sm">
            {interviews.slice(-6).reverse().map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="line-clamp-1 text-muted-foreground">{i.question}</span>
                <span className="font-mono text-primary">{i.rating}</span>
              </li>
            ))}
            {!interviews.length && <li className="text-muted-foreground">No sessions yet.</li>}
          </ul>
        </div>
      </div>
      {fb && <div className="mt-4"><FeedbackCard fb={fb} /></div>}
    </>
  );
}
