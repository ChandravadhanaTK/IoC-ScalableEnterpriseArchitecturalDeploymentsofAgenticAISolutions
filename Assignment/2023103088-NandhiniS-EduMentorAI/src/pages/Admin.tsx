import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export default function Admin() {
  const [tab, setTab] = useState<"users" | "analytics" | "agents">("users");
  const [users, setUsers] = useState<any[]>([]); const [logs, setLogs] = useState<any[]>([]); const [c, setC] = useState({ users: 0, pdfs: 0, quizzes: 0, avg: 0 });
  useEffect(() => {
    (async () => {
      const [u, r, l, pd] = await Promise.all([supabase.from("profiles").select("id,full_name,email"), supabase.from("quiz_results").select("user_id,accuracy"), supabase.from("agent_logs").select("*").order("created_at", { ascending: false }).limit(100), supabase.from("pdf_documents").select("id", { count: "exact", head: true })]);
      const res = r.data ?? [];
      setUsers((u.data ?? []).map(x => { const m = res.filter(y => y.user_id === x.id); return { ...x, attempts: m.length, avg: m.length ? Math.round(m.reduce((a, y) => a + y.accuracy, 0) / m.length) : 0 }; }));
      setLogs(l.data ?? []); setC({ users: u.data?.length ?? 0, pdfs: pd.count ?? 0, quizzes: res.length, avg: res.length ? Math.round(res.reduce((a, y) => a + y.accuracy, 0) / res.length) : 0 });
    })();
  }, []);
  const count = (a: string) => logs.filter(x => x.agent === a).length;
  return (<div className="up"><h1 className="mb-4 text-2xl font-bold">Admin</h1>
    <div className="mb-4 flex gap-2">{(["users", "analytics", "agents"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm ${tab === t ? "bg-primary font-bold text-black" : "bg-alt"}`}>{t === "agents" ? "Agent Monitoring" : t[0].toUpperCase() + t.slice(1)}</button>)}</div>
    {tab === "users" && <div className="space-y-2">{users.map(u => <div key={u.id} className="card flex justify-between text-sm"><span>{u.full_name ?? u.email}</span><span className="text-muted">{u.attempts} quizzes · avg {u.avg}%</span></div>)}</div>}
    {tab === "analytics" && <div className="grid gap-4 sm:grid-cols-4">{Object.entries({ "Total users": c.users, "Total PDFs": c.pdfs, "Total quizzes": c.quizzes, "Platform avg": c.avg + "%" }).map(([k, v]) => <div key={k} className="card"><p className="text-muted text-sm">{k}</p><p className="text-3xl font-bold">{v}</p></div>)}</div>}
    {tab === "agents" && <div><p className="text-muted mb-3 text-sm">Question generations {count("question_generation")} · Evaluations {count("evaluation")} · Study plans {count("study_planner")}</p>
      <div className="space-y-2">{logs.map(l => <div key={l.id} className="card text-sm"><b>{l.agent}</b> · {l.action} · <span className={l.status === "success" ? "text-primary" : "text-bad"}>{l.status}</span> · {l.duration_ms}ms<p className="text-muted">{l.summary} · {new Date(l.created_at).toLocaleString()}</p></div>)}</div></div>}</div>);
}
