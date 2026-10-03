import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
export default function Profile() {
  const { session, role } = useAuth(); const uid = session!.user.id;
  const [p, setP] = useState<any>({}); const [stats, setStats] = useState({ n: 0, best: 0, avg: 0 }); const [msg, setMsg] = useState("");
  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", uid).single().then(({ data }) => setP(data ?? {}));
    supabase.from("quiz_results").select("accuracy").eq("user_id", uid).then(({ data }) => { const a = (data ?? []).map(r => r.accuracy); setStats({ n: a.length, best: a.length ? Math.max(...a) : 0, avg: a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0 }); });
  }, []);
  async function save() { const r = await supabase.from("profiles").update({ full_name: p.full_name, phone: p.phone }).eq("id", uid); setMsg(r.error?.message ?? "Saved."); }
  return (<div className="up max-w-lg space-y-4"><h1 className="text-2xl font-bold">Profile</h1>
    <div className="card space-y-3"><input className="input" placeholder="Full name" value={p.full_name ?? ""} onChange={e => setP({ ...p, full_name: e.target.value })} /><input className="input" placeholder="Phone" value={p.phone ?? ""} onChange={e => setP({ ...p, phone: e.target.value })} />
      <p className="text-muted text-sm">Email: {p.email} · Username: {p.username} · Role: {role}</p>{msg && <p className="text-warn text-sm">{msg}</p>}<button className="btn" onClick={save}>Save</button></div>
    <div className="grid grid-cols-3 gap-3"><div className="card"><p className="text-muted text-xs">Quizzes</p><p className="text-2xl font-bold">{stats.n}</p></div><div className="card"><p className="text-muted text-xs">Best</p><p className="text-2xl font-bold">{stats.best}%</p></div><div className="card"><p className="text-muted text-xs">Average</p><p className="text-2xl font-bold">{stats.avg}%</p></div></div></div>);
}
