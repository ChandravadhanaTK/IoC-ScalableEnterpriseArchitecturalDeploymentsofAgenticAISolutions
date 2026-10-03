import { useEffect, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { extractPdfText } from "../lib/pdf";
export interface Pdf { id: string; title: string; file_path: string; size_bytes: number; content: string | null; question_count: number; created_at: string }
export default function PdfLibrary() {
  const { session } = useAuth(); const uid = session!.user.id;
  const [pdfs, setPdfs] = useState<Pdf[]>([]); const [q, setQ] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const load = () => supabase.from("pdf_documents").select("*").eq("user_id", uid).order("created_at", { ascending: false }).then(({ data }) => setPdfs((data ?? []) as Pdf[]));
  useEffect(() => { load(); }, []);
  async function upload(file?: File) {
    if (!file) return; if (file.type !== "application/pdf") return setMsg("Please choose a PDF file.");
    setBusy(true); setMsg("Reading PDF…");
    try {
      const content = await extractPdfText(file);
      if (content.trim().length < 200) setMsg("Warning: little readable text found (scanned PDFs are not supported).");
      const path = `${uid}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("pdfs").upload(path, file); if (up.error) throw up.error;
      const ins = await supabase.from("pdf_documents").insert({ user_id: uid, title: file.name.replace(/\.pdf$/i, ""), file_path: path, size_bytes: file.size, content }); if (ins.error) throw ins.error;
      await supabase.from("audit_logs").insert({ user_id: uid, action: "pdf_upload", detail: { name: file.name } });
      setMsg("Uploaded."); load();
    } catch (e: any) { setMsg(e.message ?? "Upload failed"); } finally { setBusy(false); }
  }
  async function del(p: Pdf) { await supabase.storage.from("pdfs").remove([p.file_path]); await supabase.from("pdf_documents").delete().eq("id", p.id); load(); }
  const shown = pdfs.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
  return (<div className="up"><h1 className="mb-4 text-2xl font-bold">PDF Library</h1>
    <div className="mb-4 flex flex-wrap gap-3"><input className="input max-w-xs" placeholder="Search PDFs" value={q} onChange={e => setQ(e.target.value)} />
      <label className="btn flex cursor-pointer items-center gap-2"><Upload size={16} />{busy ? "Working…" : "Upload PDF"}<input type="file" accept="application/pdf" hidden disabled={busy} onChange={e => upload(e.target.files?.[0])} /></label></div>
    {msg && <p className="text-warn mb-3 text-sm">{msg}</p>}
    <div className="grid gap-3 sm:grid-cols-2">{shown.map(p => <div key={p.id} className="card flex items-start justify-between"><div><p className="font-semibold">{p.title}</p>
      <p className="text-muted text-sm">{new Date(p.created_at).toLocaleDateString()} · {(p.size_bytes / 1024).toFixed(0)} KB · {p.question_count} questions</p></div>
      <button onClick={() => del(p)} aria-label="Delete" className="text-bad"><Trash2 size={18} /></button></div>)}
      {!shown.length && <p className="text-muted">No PDFs yet. Upload one to begin.</p>}</div></div>);
}
