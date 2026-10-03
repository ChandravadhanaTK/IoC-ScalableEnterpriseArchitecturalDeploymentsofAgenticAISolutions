import { useEffect, useMemo, useState } from "react";
import type { Difficulty, MCQ } from "@/lib/questions";
import { addResult, pct } from "@/lib/store";

const DIFFS: (Difficulty | "All")[] = ["All", "Easy", "Medium", "Hard"];

export function QuizModule({ module, bank }: { module: "Aptitude" | "Technical"; bank: Record<string, MCQ[]> }) {
  const topics = Object.keys(bank);
  const [topic, setTopic] = useState<string>(topics[0] ?? "");
  const [diff, setDiff] = useState<Difficulty | "All">("All");
  const [running, setRunning] = useState(false);

  const qs = useMemo(() => (bank[topic] ?? []).filter((q) => diff === "All" || q.difficulty === diff), [bank, topic, diff]);

  if (running) return <QuizRun module={module} topic={topic} difficulty={diff} questions={qs} onExit={() => setRunning(false)} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <button key={t} onClick={() => setTopic(t)}
            className={`glass p-4 text-left transition ${t === topic ? "ring-2 ring-primary" : "hover:bg-muted"}`}>
            <p className="font-display font-semibold">{t}</p>
            <p className="label-mono mt-1">{bank[t]?.length ?? 0} questions</p>
          </button>
        ))}
      </div>
      <div className="glass flex flex-wrap items-center gap-4 p-5">
        <span className="label-mono">Difficulty</span>
        {DIFFS.map((d) => (
          <button key={d} onClick={() => setDiff(d)}
            className={`rounded-lg px-3 py-1.5 text-sm ${d === diff ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{d}</button>
        ))}
        <button className="btn-primary ml-auto" disabled={!qs.length} onClick={() => setRunning(true)}>
          Start timed quiz · {qs.length} Q · {qs.length * 45}s
        </button>
      </div>
    </div>
  );
}

function QuizRun({ module, topic, difficulty, questions, onExit }: {
  module: "Aptitude" | "Technical"; topic: string; difficulty: string; questions: MCQ[]; onExit: () => void;
}) {
  const limit = questions.length * 45;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [left, setLeft] = useState(limit);
  const [done, setDone] = useState(false);

  const score = answers.filter((a, k) => a === questions[k]!.answer).length;

  const finish = () => {
    if (done) return;
    setDone(true);
    addResult({ module, topic, difficulty, score: answers.filter((a, k) => a === questions[k]!.answer).length, total: questions.length, seconds: limit - left });
  };

  useEffect(() => {
    if (done) return;
    if (left <= 0) { finish(); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, done]);

  if (done) {
    return (
      <div className="space-y-4">
        <div className="glass p-6">
          <p className="label-mono">{topic} · result</p>
          <p className="mt-2 font-display text-5xl font-bold">{pct(score, questions.length)}<span className="text-2xl text-muted-foreground">%</span></p>
          <p className="mt-1 text-muted-foreground">{score} of {questions.length} correct in {limit - left}s</p>
          <button className="btn-primary mt-4" onClick={onExit}>Back to topics</button>
        </div>
        {questions.map((q, k) => (
          <div key={q.id} className="glass p-5">
            <p className="font-medium">{k + 1}. {q.q}</p>
            <p className={`mt-2 text-sm ${answers[k] === q.answer ? "text-good" : "text-weak"}`}>
              Your answer: {answers[k] === null ? "—" : q.options[answers[k]!]} · Correct: {q.options[q.answer]}
            </p>
            {q.explain && <p className="mt-1 text-sm text-muted-foreground">{q.explain}</p>}
          </div>
        ))}
      </div>
    );
  }

  const q = questions[i]!;
  return (
    <div className="glass p-6">
      <div className="flex items-center justify-between">
        <span className="label-mono">Question {i + 1} / {questions.length} · {q.difficulty}</span>
        <span className={`font-mono text-sm ${left < 20 ? "text-weak" : "text-primary"}`}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-3 h-1 rounded bg-muted"><div className="h-1 rounded bg-primary transition-all" style={{ width: `${((i + 1) / questions.length) * 100}%` }} /></div>
      <h2 className="mt-6 font-display text-xl font-semibold">{q.q}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {q.options.map((o, k) => (
          <button key={k} onClick={() => setAnswers((a) => a.map((v, j) => (j === i ? k : v)))}
            className={`rounded-lg border p-4 text-left text-sm transition ${answers[i] === k ? "border-primary bg-primary/15 text-primary" : "hover:bg-muted"}`}>
            {String.fromCharCode(65 + k)}. {o}
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
        {i < questions.length - 1
          ? <button className="btn-primary" onClick={() => setI(i + 1)}>Next</button>
          : <button className="btn-primary" onClick={finish}>Submit</button>}
      </div>
    </div>
  );
}
