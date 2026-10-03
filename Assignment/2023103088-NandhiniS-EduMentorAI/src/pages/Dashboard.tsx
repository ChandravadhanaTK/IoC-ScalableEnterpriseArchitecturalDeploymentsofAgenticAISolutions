import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { mergeTopics } from "../lib/agents";
const Card = ({ t, v }: { t: string; v: string | number }) => <div className="card up"><p className="text-muted text-sm">{t}</p><p className="count-up mt-2 text-3xl font-bold">{v}</p></div>;
export default function Dashboard() {
  const { session } = useAuth(); const uid = session!.user.id;
  const [pdfCount, setPdf] = useState(0); const [rows, setRows] = useState<{ accuracy: number; topic_stats: any }[]>([]);
  useEffect(() => {
    supabase.from("pdf_documents").select("id", { count: "exact", head: true }).eq("user_id", uid).then(r => setPdf(r.count ?? 0));
    supabase.from("quiz_results").select("accuracy,topic_stats").eq("user_id", uid).order("created_at").then(({ data }) => setRows(data ?? []));
  }, []);
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.accuracy, 0) / rows.length) : 0;
  const best = rows.length ? Math.max(...rows.map(r => r.accuracy)) : 0;
  const topics = Object.entries(mergeTopics(rows.map(r => r.topic_stats))).map(([k, v]) => ({ k, a: v.correct / v.total })).sort((a, b) => b.a - a.a);
  return (<div><h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card t="PDFs" v={pdfCount} /><Card t="Quizzes" v={rows.length} /><Card t="Best score" v={best + "%"} /><Card t="Overall accuracy" v={avg + "%"} /></div>
    <div className="card mt-6 h-64"><p className="text-muted mb-2 text-sm">Score trend</p><ResponsiveContainer><LineChart data={rows.map((r, i) => ({ n: i + 1, accuracy: r.accuracy }))}><XAxis dataKey="n" stroke="#9CA3AF" /><YAxis domain={[0, 100]} stroke="#9CA3AF" /><Tooltip /><Line dataKey="accuracy" stroke="#00E676" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
    <div className="card mt-6"><b>AI insights</b><p className="text-muted mt-1 text-sm">{topics.length ? `Strongest topic: ${topics[0].k}. Needs work: ${topics[topics.length - 1].k}.` : "Take a quiz to see strengths and weaknesses."}</p></div></div>);
}
