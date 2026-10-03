import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { runAgent } from "../lib/orchestrator";
import { evaluationAgent, mergeTopics, questionAgent, studyPlannerAgent, type Difficulty, type EvalResult, type Question } from "../lib/agents";
import type { Pdf } from "./PdfLibrary";
export default function Quiz() {
  const { session } = useAuth(); const uid = session!.user.id;
  const [pdfs, setPdfs] = useState<Pdf[]>([]); const [sel, setSel] = useState(""); const [diff, setDiff] = useState<Difficulty>("easy"); const [n, setN] = useState(5);
  const [qs, setQs] = useState<Question[]>([]); const [ans, setAns] = useState<Record<string, string>>({}); const [i, setI] = useState(0);
  const [left, setLeft] = useState(0); const [res, setRes] = useState<EvalResult | null>(null); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.from("pdf_documents").select("*").eq("user_id", uid).then(({ data }) => setPdfs((data ?? []) as Pdf[])); }, []);
  async function generate() {
    const pdf = pdfs.find(p => p.id === sel); if (!pdf?.content) return setMsg("Select a PDF with readable text.");
    setBusy(true); setMsg("");
    const qq = await runAgent(uid, "question_generation", "generate", () => questionAgent(pdf.content!, diff, n), r => `${r.length} questions from ${pdf.title}`);
    if (qq.length < 3) { setBusy(false); return setMsg("Not enough readable text in this PDF to build a quiz."); }
    await supabase.from("generated_questions").insert(qq.map(q => ({ id: q.id, user_id: uid, pdf_id: sel, qtype: q.type, difficulty: diff, topic: q.topic, prompt: q.prompt, options: q.options ?? null, answer: q.answer, keywords: q.keywords ?? null })));
    await supabase.from("pdf_documents").update({ question_count: pdf.question_count + qq.length }).eq("id", sel);
    setQs(qq); setAns({}); setI(0); setLeft(qq.length * 60); setRes(null); setBusy(false);
  }
  async function submit() {
    if (!qs.length || res) return; setBusy(true);
    const r = await runAgent(uid, "evaluation", "evaluate", () => evaluationAgent(qs, ans), x => `${x.score}/${x.total}`);
    const { data: att } = await supabase.from("quiz_attempts").insert({ user_id: uid, pdf_id: sel, difficulty: diff, total: qs.length }).select("id").single();
    if (att) {
      await supabase.from("quiz_answers").insert(r.items.map(it => ({ attempt_id: att.id, user_id: uid, question_id: it.id, answer: ans[it.id] ?? "", correct: it.correct, marks: it.marks, feedback: it.explanation })));
      await supabase.from("quiz_results").insert({ attempt_id: att.id, user_id: uid, score: r.score, total: r.total, accuracy: r.accuracy, topic_stats: r.topics });
      const { data: hist } = await supabase.from("quiz_results").select("topic_stats").eq("user_id", uid);
      const plan = await runAgent(uid, "study_planner", "plan", () => studyPlannerAgent(mergeTopics((hist ?? []).map(h => h.topic_stats))), p => `${p.weakTopics.length} weak topics`);
      await supabase.from("study_plans").insert({ user_id: uid, weak_topics: plan.weakTopics, tasks: plan.tasks });
    }
    localStorage.removeItem("quiz-draft"); setRes(r); setBusy(false);
  }
  const submitRef = useRef(submit); submitRef.current = submit;
  useEffect(() => { if (!qs.length || res) return; const t = setInterval(() => setLeft(l => { if (l <= 1) { submitRef.current(); return 0; } return l - 1; }), 1000); return () => clearInterval(t); }, [qs, res]);
  useEffect(() => { if (qs.length && !res) localStorage.setItem("quiz-draft", JSON.stringify(ans)); }, [ans, qs, res]); // auto save

  if (res) return (<div className="up space-y-4"><h1 className="text-2xl font-bold">Quiz complete</h1>
    <div className="card bounce-ok"><p className="text-4xl font-extrabold">{res.score}/{res.total}</p><p className="text-muted">Accuracy {res.accuracy}% · Correct {res.items.filter(x => x.correct).length} · Incorrect {res.items.filter(x => !x.correct).length}</p></div>
    <div className="card"><p><b>Strengths:</b> {res.strengths.join(", ") || "none yet"}</p><p><b>Weaknesses:</b> {res.weaknesses.join(", ") || "none"}</p><p className="text-primary mt-2">{res.recommendation}</p></div>
    {qs.map((q, k) => <div key={q.id} className="card"><p className="text-sm">{k + 1}. {q.prompt}</p><p className={res.items[k].correct ? "text-primary" : "text-bad"}>{res.items[k].correct ? "Correct" : res.items[k].explanation}</p></div>)}
    <button className="btn" onClick={() => { setQs([]); setRes(null); }}>New quiz</button></div>);

  if (!qs.length) return (<div className="up max-w-lg"><h1 className="mb-4 text-2xl font-bold">Generate quiz</h1><div className="card space-y-3">
    <select className="input" value={sel} onChange={e => setSel(e.target.value)}><option value="">Select a PDF</option>{pdfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
    <select className="input" value={diff} onChange={e => setDiff(e.target.value as Difficulty)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
    <select className="input" value={n} onChange={e => setN(+e.target.value)}>{[5, 10, 15, 20].map(x => <option key={x} value={x}>{x} questions</option>)}</select>
    {msg && <p className="text-warn text-sm">{msg}</p>}<button className="btn w-full" disabled={busy || !sel} onClick={generate}>{busy ? "Generating…" : "Generate quiz"}</button></div></div>);

  const q = qs[i]; const set = (v: string) => setAns({ ...ans, [q.id]: v });
  return (<div className="up max-w-2xl"><div className="mb-3 flex justify-between text-sm"><span>Question {i + 1} of {qs.length} · {Object.keys(ans).length} answered</span><span className="text-primary">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span></div>
    <div className="bg-alt mb-4 h-2 rounded-full"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((i + 1) / qs.length) * 100}%` }} /></div>
    <div className="card space-y-3"><p>{q.prompt}</p>
      {q.options ? q.options.map(o => <button key={o} onClick={() => set(o)} className={`block w-full rounded-xl border px-3 py-2 text-left ${ans[q.id] === o ? "border-primary bg-primary/10" : "border-white/15"}`}>{o}</button>)
        : <textarea className="input" rows={4} value={ans[q.id] ?? ""} onChange={e => set(e.target.value)} placeholder="Your answer" />}</div>
    <div className="mt-4 flex flex-wrap gap-2">{qs.map((x, k) => <button key={x.id} onClick={() => setI(k)} className={`h-9 w-9 rounded-lg text-sm ${k === i ? "bg-primary text-black" : ans[x.id] ? "bg-primary/30" : "bg-alt"}`}>{k + 1}</button>)}</div>
    <div className="mt-4 flex gap-3"><button className="btn bg-alt text-white" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>{i < qs.length - 1 ? <button className="btn" onClick={() => setI(i + 1)}>Next</button> : <button className="btn" disabled={busy} onClick={submit}>{busy ? "Evaluating…" : "Submit quiz"}</button>}</div></div>);
}
