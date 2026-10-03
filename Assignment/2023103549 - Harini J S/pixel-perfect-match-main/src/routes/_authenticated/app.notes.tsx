import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/kf/bits";
import { getDoc } from "@/data/seed";
import { useNotes } from "@/hooks/use-knowledge";

export const Route = createFileRoute("/_authenticated/app/notes")({
  head: () => ({
    meta: [
      { title: "My Notes — KnowFlow" },
      { name: "description", content: "Every note you've written on your documents, linked to the exact passage." },
      { property: "og:title", content: "My Notes — KnowFlow" },
      { property: "og:description", content: "Your notes, linked to the passages they're about." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { notes, isLoading, remove } = useNotes();
  const [q, setQ] = useState("");
  const list = notes.filter((n) => (n.body + n.quote + (getDoc(n.doc_id)?.title ?? "")).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="My Notes" sub={`${notes.length} notes`} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="mb-4 w-full rounded-lg border bg-card px-3 py-2 text-sm sm:w-72" />
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : list.length === 0 ? (
        <div className="card-surface p-10 text-center text-sm text-muted-foreground">
          {notes.length ? "No notes match." : <>No notes yet. Open a document and click <span className="text-foreground">Note</span> beside any passage.</>}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((n) => {
            const d = getDoc(n.doc_id);
            const chunk = d?.sections.flatMap((s) => s.chunks).find((c) => c.id === n.chunk_id);
            return (
              <div key={n.id} className="card-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  {d ? (
                    <Link to="/app/documents/$id" params={{ id: d.id }} search={chunk ? { sec: chunk.sectionId, chunk: chunk.id } : {}} className="text-sm font-medium text-primary">{d.title}</Link>
                  ) : <span className="text-sm text-muted-foreground">Deleted document</span>}
                  <button aria-label="Delete note" onClick={() => remove.mutate(n.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                {n.quote && <blockquote className="mt-2 border-l-2 border-primary/50 pl-3 text-xs italic text-muted-foreground">{n.quote}</blockquote>}
                <p className="mt-2 whitespace-pre-wrap text-sm">{n.body}</p>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
