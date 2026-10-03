import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle, GitCompare, Loader2, Sparkles, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { logActivity, useFavorites, useNotes } from "@/hooks/use-knowledge";
import { z } from "zod";
import { CategoryBadge, StatusBadge, btnGhost, btnPrimary } from "@/components/kf/bits";
import { collections, concepts, getDoc, relations } from "@/data/seed";
import { cn } from "@/lib/utils";

const search = z.object({ sec: z.string().optional(), chunk: z.string().optional() });

export const Route = createFileRoute("/_authenticated/app/documents/$id")({
  validateSearch: search,
  loader: ({ params }) => {
    const doc = getDoc(params.id);
    if (!doc) throw notFound();
    return { title: doc.title };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — KnowFlow` },
          { name: "description", content: `Read ${loaderData.title} with sections, concepts and cited AI answers.` },
          { property: "og:title", content: `${loaderData.title} — KnowFlow` },
          { property: "og:description", content: `Read ${loaderData.title} in KnowFlow.` },
        ]
      : [{ title: "Document not found — KnowFlow" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: DocNotFound,
  component: Reader,
});

function DocNotFound() {
  return (
    <div className="card-surface mx-auto mt-16 max-w-md p-8 text-center">
      <p className="font-medium">Document not found</p>
      <p className="mt-1 text-sm text-muted-foreground">It may have been deleted or moved.</p>
      <Link to="/app/documents" className={cn(btnPrimary, "mt-4")}>Back to library</Link>
    </div>
  );
}

function Reader() {
  const { id } = Route.useParams();
  const { sec, chunk } = Route.useSearch();
  const doc = getDoc(id)!;
  const col = collections.find((c) => c.id === doc.collectionId);
  const docConcepts = concepts.filter((c) => c.docs.includes(doc.id));
  const related = relations.filter((r) => (r.from === doc.id || r.to === doc.id) && r.type !== "discusses").map((r) => ({ r, other: getDoc(r.from === doc.id ? r.to : r.from) })).filter((x) => x.other);

  const fav = useFavorites();
  const { notes, add, remove } = useNotes(doc.id);
  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => { logActivity("view", `Viewed ${doc.title}`, doc.id); }, [doc.id, doc.title]);

  useEffect(() => {
    const el = document.getElementById(chunk ? `chunk-${chunk}` : sec ? `sec-${sec}` : "");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sec, chunk]);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[200px_minmax(0,1fr)_260px]">
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contents</p>
          {doc.sections.map((s) => (
            <Link key={s.id} to="." search={{ sec: s.id }} className={cn("block rounded-md px-2 py-1 text-sm hover:bg-accent", sec === s.id ? "text-primary" : "text-muted-foreground")}>{s.title}</Link>
          ))}
        </div>
      </aside>

      <article>
        <p className="text-xs text-muted-foreground">
          {doc.owned ? <Link to="/app/upload" className="hover:text-foreground">My uploads</Link> : <Link to="/app/collections/$id" params={{ id: doc.collectionId }} className="hover:text-foreground">{col?.name}</Link>} / {doc.title}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{doc.author} <CategoryBadge c={doc.category} /> <StatusBadge s={doc.status} /></div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/app/assistant" search={{ docs: doc.id }} className={btnPrimary}><Sparkles className="h-4 w-4" />Ask about this document</Link>
          <Link to="/app/compare" search={{ a: doc.id }} className={btnGhost}><GitCompare className="h-4 w-4" />Compare</Link>
          <button onClick={() => fav.toggle.mutate({ docId: doc.id, title: doc.title })} className={btnGhost} aria-pressed={fav.ids.includes(doc.id)}>
            <Star className={cn("h-4 w-4", fav.ids.includes(doc.id) && "fill-primary text-primary")} />{fav.ids.includes(doc.id) ? "Starred" : "Star"}
          </button>
        </div>

        {doc.status === "failed" && (
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
            <div><p className="font-medium">Processing failed</p><p className="text-muted-foreground">{doc.error ?? "Text extraction could not read this file. Re-upload a text-based version to index it."}</p></div>
          </div>
        )}
        {doc.status === "processing" && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-warning" /> Still indexing — partial content shown, and it is excluded from AI answers until ready.
          </div>
        )}

        <div className="reading mt-8 space-y-10">
          {doc.sections.map((s) => (
            <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-6">
              <h2 className="mb-3 font-sans text-xl font-semibold">{s.title}</h2>
              {s.chunks.map((c) => (
                <p key={c.id} id={`chunk-${c.id}`} className={cn("group mb-4 px-1 text-foreground/90", chunk === c.id && "passage-hit", target?.id === c.id && "passage-hit")}>
                  {c.text}
                  <button onClick={() => setTarget({ id: c.id, text: c.text })} className="ml-2 align-middle font-sans text-xs text-primary opacity-0 group-hover:opacity-100 focus:opacity-100">Note</button>
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>

      <aside className="space-y-6">
        <div className="card-surface p-4">
          <p className="mb-2 text-sm font-medium">Notes</p>
          {target && <p className="mb-2 line-clamp-2 border-l-2 border-primary/50 pl-2 text-xs italic text-muted-foreground">{target.text} <button className="not-italic text-primary" onClick={() => setTarget(null)}>×</button></p>}
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="Write a note…" className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm" />
          <button disabled={!draft.trim() || add.isPending} onClick={() => add.mutate({ docId: doc.id, title: doc.title, chunkId: target?.id, quote: target?.text.slice(0, 200), body: draft.trim() }, { onSuccess: () => { setDraft(""); setTarget(null); } })} className={cn(btnPrimary, "mt-2 w-full justify-center py-1.5 text-xs disabled:opacity-50")}>Save note</button>
          {add.isError && <p className="mt-1 text-xs text-destructive">Couldn't save the note. Try again.</p>}
          <div className="mt-3 space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg border bg-background/50 p-2 text-xs">
                <div className="flex justify-between gap-2"><p className="whitespace-pre-wrap">{n.body}</p><button aria-label="Delete note" onClick={() => remove.mutate(n.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-surface p-4">
          <p className="mb-2 text-sm font-medium">Concepts</p>
          <div className="flex flex-wrap gap-1.5">
            {docConcepts.map((c) => (
              <Link key={c.id} to="/app/graph" search={{ focus: c.id }} title={c.definition} className="rounded-full border bg-background px-2 py-0.5 text-xs hover:border-primary">{c.name}</Link>
            ))}
            {!docConcepts.length && <p className="text-xs text-muted-foreground">None extracted yet.</p>}
          </div>
        </div>
        <div className="card-surface p-4">
          <p className="mb-2 text-sm font-medium">Related documents</p>
          {related.length ? related.map(({ r, other }) => (
            <Link key={other!.id + r.type} to="/app/documents/$id" params={{ id: other!.id }} className="block rounded-md py-1.5 text-sm hover:text-primary">
              {other!.title}<span className="ml-1 font-mono text-[10px] text-muted-foreground">{r.type.replace("_", " ")}</span>
            </Link>
          )) : <p className="text-xs text-muted-foreground">No direct relations.</p>}
        </div>
      </aside>
    </div>
  );
}
