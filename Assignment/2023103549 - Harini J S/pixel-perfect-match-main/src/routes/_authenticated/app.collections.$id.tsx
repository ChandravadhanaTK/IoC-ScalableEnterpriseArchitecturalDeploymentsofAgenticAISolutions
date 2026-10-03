import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Pencil, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { CategoryBadge, PageHeader, StatusBadge, btnGhost, btnPrimary } from "@/components/kf/bits";
import { concepts, documents, getDoc } from "@/data/seed";
import { useCollectionMutations, useCollections } from "@/hooks/use-knowledge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/collections/$id")({
  head: () => ({
    meta: [
      { title: "Collection — KnowFlow" },
      { name: "description", content: "Documents and concepts in this collection." },
      { property: "og:title", content: "Collection — KnowFlow" },
      { property: "og:description", content: "Documents and concepts in this collection." },
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useCollections();
  const { update, remove } = useCollectionMutations();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const c = data?.find((x) => x.id === id);

  if (isLoading) return <div className="card-surface mx-auto h-60 max-w-5xl animate-pulse" />;
  if (!c) return <p className="p-10 text-center text-muted-foreground">Collection not found. <Link to="/app/collections" className="text-primary">All collections</Link></p>;

  const docs = c.docIds.map(getDoc).filter((d) => !!d);
  const cs = concepts.filter((k) => k.docs.some((d) => c.docIds.includes(d)));
  const scope = c.custom ? { docs: c.docIds.join(",") } : { collection: c.id };
  const setDocs = (ids: string[]) => update.mutate({ id: c.id, docIds: ids });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-1 text-xs text-muted-foreground"><Link to="/app/collections" className="hover:text-foreground">Collections</Link> / {c.name}</p>
      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); update.mutate({ id: c.id, name }); setEditing(false); }} className="mb-6 flex gap-2">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-lg border bg-card px-3 py-2" />
          <button className={btnPrimary}>Save</button>
          <button type="button" onClick={() => setEditing(false)} className={btnGhost}>Cancel</button>
        </form>
      ) : (
        <PageHeader title={c.name} sub={c.description}>
          <div className="flex flex-wrap gap-2">
            {c.custom && <button onClick={() => { setName(c.name); setEditing(true); }} className={btnGhost}><Pencil className="h-4 w-4" />Rename</button>}
            {c.custom && <button onClick={async () => { if (confirm(`Delete "${c.name}"? Documents stay in your library.`)) { await remove.mutateAsync(c.id); navigate({ to: "/app/collections" }); } }} className={btnGhost}><Trash2 className="h-4 w-4" />Delete</button>}
            <Link to="/app/assistant" search={scope} className={cn(btnPrimary, !docs.length && "pointer-events-none opacity-50")}><Sparkles className="h-4 w-4" />Ask this collection</Link>
          </div>
        </PageHeader>
      )}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {cs.map((k) => <Link key={k.id} to="/app/graph" search={{ focus: k.id }} className="rounded-full border bg-card px-2.5 py-1 text-xs hover:border-primary">{k.name}</Link>)}
      </div>
      <div className="card-surface divide-y">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/40">
            <Link to="/app/documents/$id" params={{ id: d.id }} className="min-w-0 flex-1"><p className="font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.author} · {d.sections.length} sections</p></Link>
            <CategoryBadge c={d.category} /><StatusBadge s={d.status} />
            {c.custom && <button aria-label="Remove from collection" onClick={() => setDocs(c.docIds.filter((x) => x !== d.id))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
          </div>
        ))}
        {!docs.length && <p className="px-5 py-8 text-center text-sm text-muted-foreground">No documents yet — add some below.</p>}
      </div>
      {c.custom && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Add documents</p>
          <div className="flex flex-wrap gap-1.5">
            {documents.filter((d) => !c.docIds.includes(d.id)).map((d) => (
              <button key={d.id} onClick={() => setDocs([...c.docIds, d.id])} className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground">+ {d.title}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
