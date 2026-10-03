import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, FileText, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { PageHeader, StatusBadge, btnGhost, btnPrimary } from "@/components/kf/bits";
import { categoryLabel } from "@/data/seed";
import { logActivity } from "@/hooks/use-knowledge";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { userDocsQuery } from "@/lib/user-docs";
import { cn } from "@/lib/utils";
import { ACCEPTED, detectTags, ingestText } from "@/services/rag/ingest";
import type { Category } from "@/types/knowledge";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/app/upload")({
  head: () => ({
    meta: [
      { title: "Upload Documents — KnowFlow" },
      { name: "description", content: "Add your own notes and documents; KnowFlow chunks and indexes them for cited answers." },
      { property: "og:title", content: "Upload Documents — KnowFlow" },
      { property: "og:description", content: "Add documents and watch them get processed and indexed." },
    ],
  }),
  component: UploadPage,
});

const STAGES = ["Upload", "Extract text", "Chunk", "Embed", "Index"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Job { name: string; stage: number; state: "running" | "done" | "failed"; message?: string; docId?: string; chunks?: number }

function UploadPage() {
  const qc = useQueryClient();
  const { data: mine = [] } = useQuery(userDocsQuery);
  const [category, setCategory] = useState<Category>("personal");
  const [pasteTitle, setPasteTitle] = useState("");
  const [paste, setPaste] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const patch = (i: number, p: Partial<Job>) => setJobs((js) => js.map((j, k) => (k === i ? { ...j, ...p } : j)));

  async function process(name: string, read: () => Promise<string>, titleHint?: string) {
    let idx = 0;
    setJobs((js) => { idx = js.length; return [...js, { name, stage: 0, state: "running" }]; });
    await wait(0);
    const base = titleHint || name.replace(/\.[^.]+$/, "");
    const { data: row, error } = await supabase.from("user_documents").insert({ title: base, category, status: "queued" }).select("id").single();
    if (error || !row) { patch(idx, { state: "failed", message: "Could not save the document. Check your connection and try again." }); return; }
    const fail = async (message: string) => {
      await supabase.from("user_documents").update({ status: "failed", error: message }).eq("id", row.id);
      patch(idx, { state: "failed", message, docId: row.id });
      await qc.invalidateQueries({ queryKey: userDocsQuery.queryKey });
    };
    try {
      await wait(350);
      patch(idx, { stage: 1 });
      await supabase.from("user_documents").update({ status: "processing" }).eq("id", row.id);
      const ext = "." + (name.split(".").pop() ?? "").toLowerCase();
      if (name.includes(".") && !ACCEPTED.includes(ext)) return fail(`${ext.toUpperCase().slice(1)} files can't be read yet. Save it as plain text (.txt or .md) and upload again.`);
      const raw = await read();
      await wait(350);
      if (raw.trim().length < 40) return fail("The file has too little readable text to index (needs at least a few sentences).");
      patch(idx, { stage: 2 });
      const { title, sections } = ingestText(row.id, raw);
      await wait(350);
      const chunks = sections.reduce((n, s) => n + s.chunks.length, 0);
      patch(idx, { stage: 3, chunks });
      await wait(450);
      patch(idx, { stage: 4 });
      await supabase.from("user_documents").update({
        status: "ready", title: titleHint || title || base, sections: sections as unknown as Json, tags: detectTags(raw), error: null,
      }).eq("id", row.id);
      await qc.invalidateQueries({ queryKey: userDocsQuery.queryKey });
      logActivity("upload", `Uploaded ${titleHint || title || base}`, row.id);
      patch(idx, { stage: 5, state: "done", docId: row.id });
    } catch {
      await fail("Something went wrong while processing. Try again.");
    }
  }

  function onFiles(files: FileList | null) {
    for (const f of Array.from(files ?? [])) void process(f.name, () => f.text());
  }

  async function remove(id: string) {
    await supabase.from("user_documents").delete().eq("id", id);
    await qc.invalidateQueries({ queryKey: userDocsQuery.queryKey });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Upload Documents" sub="Plain text and Markdown are chunked, embedded and indexed so the Assistant can cite them." />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Category</span>
        {(Object.keys(categoryLabel) as Category[]).map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={cn("rounded-full border px-3 py-1 text-xs", category === c ? "border-primary bg-primary/15 text-primary" : "bg-card text-muted-foreground hover:bg-accent")}>{categoryLabel[c]}</button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
          className={cn("card-surface flex min-h-52 flex-col items-center justify-center gap-2 border-dashed p-6 text-center transition-colors", drag && "border-primary bg-primary/10")}
        >
          <UploadCloud className="h-8 w-8 text-primary" />
          <p className="font-medium">Drop files or click to choose</p>
          <p className="text-xs text-muted-foreground">.txt, .md — headings become sections</p>
          <input ref={input} type="file" multiple accept={ACCEPTED.join(",")} className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        </button>
        <div className="card-surface flex flex-col gap-2 p-4">
          <p className="text-sm font-medium">Or paste text</p>
          <input value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} placeholder="Title" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} placeholder="Paste notes or an article…" className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm" />
          <button disabled={!paste.trim() || !pasteTitle.trim()} onClick={() => { void process(pasteTitle.trim(), async () => paste, pasteTitle.trim()); setPaste(""); setPasteTitle(""); }} className={cn(btnPrimary, "self-end disabled:opacity-50")}>Process text</button>
        </div>
      </div>

      {jobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Processing</h2>
          {jobs.map((j, i) => (
            <div key={i} className="card-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-muted-foreground" />{j.name}</p>
                {j.state === "done" && j.docId && <Link to="/app/documents/$id" params={{ id: j.docId }} className="text-sm text-primary">Open →</Link>}
              </div>
              <ol className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {STAGES.map((s, k) => {
                  const done = k < j.stage, active = k === j.stage && j.state === "running", failed = k === j.stage && j.state === "failed";
                  return (
                    <li key={s} className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1", done && "border-success/40 text-success", active && "border-primary text-primary", failed && "border-destructive/50 text-destructive", !done && !active && !failed && "text-muted-foreground")}>
                      {done ? <Check className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : failed ? <AlertTriangle className="h-3 w-3" /> : null}{s}
                    </li>
                  );
                })}
              </ol>
              {j.chunks !== undefined && <p className="mt-2 font-mono text-[11px] text-muted-foreground">{j.chunks} chunks · 384-dim embeddings</p>}
              {j.message && <p className="mt-2 text-sm text-destructive">{j.message}</p>}
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Your uploads</h2>
        {mine.length === 0 ? (
          <div className="card-surface p-8 text-center text-sm text-muted-foreground">Nothing uploaded yet. Your documents appear in the library and Assistant once indexed.</div>
        ) : (
          <div className="card-surface divide-y">
            {mine.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <Link to="/app/documents/$id" params={{ id: d.id }} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.addedAt} · {d.sections.reduce((n, s) => n + s.chunks.length, 0)} chunks{d.error ? ` · ${d.error}` : ""}</p>
                </Link>
                <StatusBadge s={d.status} />
                <button onClick={() => remove(d.id)} className={cn(btnGhost, "px-2.5 py-1 text-xs")}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
