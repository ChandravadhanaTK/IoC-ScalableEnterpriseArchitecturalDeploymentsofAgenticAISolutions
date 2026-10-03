import { useEffect, useState } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { mergeTopics, type TopicStats } from "../lib/agents";
interface Row { score: number; total: number; accuracy: number; topic_stats: TopicStats; created_at: string }
export default function Results() {
  const { session } = useAuth(); const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { supabase.from("quiz_results").select("*").eq("user_id", session!.user.id).order("created_at").then(({ data }) => setRows((data ?? []) as Row[])); }, []);
  const topics = Object.entries(mergeTopics(rows.map(r => r.topic_stats))).map(([name, v]) => ({ name, acc: Math.round((v.correct / v.total) * 100) })).sort((a, b) => b.acc - a.acc);
  const trend = rows.map((r, i) => ({ n: i + 1, accuracy: r.accuracy }));
  if (!rows.length) return <div className="up"><h1 className="mb-4 text-2xl font-bold">Results</h1><p className="text-muted">No quizzes taken yet.</p></div>;
  return (<div className="up space-y-4"><h1 className="text-2xl font-bold">Results</h1>
    <div className="card h-64"><p className="text-muted mb-2 text-sm">Score trend (accuracy %)</p><ResponsiveContainer><LineChart data={trend}><XAxis dataKey="n" stroke="#9CA3AF" /><YAxis domain={[0, 100]} stroke="#9CA3AF" /><Tooltip /><Line dataKey="accuracy" stroke="#00E676" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
    <div className="card h-64"><p className="text-muted mb-2 text-sm">Topic performance (%)</p><ResponsiveContainer><BarChart data={topics.slice(0, 10)}><XAxis dataKey="name" stroke="#9CA3AF" /><YAxis domain={[0, 100]} stroke="#9CA3AF" /><Tooltip /><Bar dataKey="acc" fill="#00E676" radius={8} /></BarChart></ResponsiveContainer></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="card"><b>Strong topics</b><p className="text-muted">{topics.filter(t => t.acc >= 70).map(t => t.name).join(", ") || "none yet"}</p></div><div className="card"><b>Weak topics</b><p className="text-muted">{topics.filter(t => t.acc < 50).map(t => t.name).join(", ") || "none"}</p></div></div>
    <div className="card"><b>Quiz history</b>{[...rows].reverse().map((r, k) => <p key={k} className="text-muted text-sm">{new Date(r.created_at).toLocaleString()} · {r.score}/{r.total} · {r.accuracy}%</p>)}</div></div>);
}
