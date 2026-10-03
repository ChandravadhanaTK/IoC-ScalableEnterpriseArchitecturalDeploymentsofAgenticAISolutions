import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { FeedbackCard } from "@/components/FeedbackCard";
import { analyzeAnswer, type Feedback } from "@/lib/feedback";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/feedback")({
  head: () => meta("AI Feedback", "Paste any interview answer to see strengths, weak areas, tips and topics to practice."),
  component: FeedbackPage,
});

function FeedbackPage() {
  const [cat, setCat] = useState("Behavioral");
  const [text, setText] = useState("");
  const [fb, setFb] = useState<Feedback | null>(null);
  const { interviews } = useStore();

  return (
    <>
      <PageHeader eyebrow="Prepare · Feedback" title="Feedback assistant" sub="Paste an answer and get a breakdown of what works and what to fix." />
      <div className="glass p-6">
        <div className="flex flex-wrap gap-2">
          {["Technical", "HR", "Behavioral"].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-lg px-3 py-1.5 text-sm ${c === cat ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{c}</button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} maxLength={4000}
          placeholder="Paste your answer…" className="mt-4 w-full rounded-lg border border-border bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
        <button className="btn-primary mt-3" disabled={text.trim().length < 10} onClick={() => setFb(analyzeAnswer(text, cat))}>Analyze answer</button>
      </div>
      {fb && <div className="mt-4"><FeedbackCard fb={fb} /></div>}
      <div className="glass mt-4 p-5">
        <h2 className="mb-3 font-display font-semibold">Past interview answers</h2>
        {interviews.length ? (
          <ul className="divide-y divide-border text-sm">
            {interviews.slice().reverse().map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3">
                <div><p className="font-medium">{i.question}</p><p className="label-mono mt-1">{i.category} · {new Date(i.date).toLocaleDateString()}</p></div>
                <span className="font-display text-lg text-primary">{i.rating}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">None yet — <Link to="/interview" className="text-primary">start a mock interview</Link>.</p>}
      </div>
    </>
  );
}
