import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CategoryBadge, PageHeader, btnGhost, btnPrimary } from "@/components/kf/bits";
import { documents, getDoc } from "@/data/seed";
import { useCollectionMutations, useCollections } from "@/hooks/use-knowledge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/collections/")({
  head: () => ({
    meta: [
      { title: "Collections — KnowFlow" },
      { name: "description", content: "Group documents into collections and scope AI answers to them." },
      { property: "og:title", content: "Collections — KnowFlow" },
      { property: "og:description", content: "Group documents into collections and scope AI answers to them." },
    ],
  }),
  component: Collections,
});

function Collections() {
  const { data, isLoading, error } = useCollections();
  const { create } = useCollectionMutations();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = await create.mutateAsync({ name: name.trim(), description: desc.trim(), docIds: picked });
    navigate({ to: "/app/collections/$id", params: { id } });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Collections" sub="Each collection can be used as the AI Assistant's scope.">
        <button onClick={() => setOpen(!open)} className={btnPrimary}><Plus className="h-4 w-4" />New collection</button>
      </PageHeader>
      {open && (
        <form onSubmit={submit} className="card-surface mb-6 space-y-3 p-5">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-1.5">
            {documents.map((d) => {
              const on = picked.includes(d.id);
              return <button type="button" key={d.id} onClick={() => setPicked(on ? picked.filter((x) => x !== d.id) : [...picked, d.id])} className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-primary bg-primary/15 text-primary" : "bg-background text-muted-foreground")}>{d.title}</button>;
            })}
          </div>
          <div className="flex gap-2">
            <button disabled={create.isPending} className={btnPrimary}>{create.isPending ? "Creating…" : "Create"}</button>
            <button type="button" onClick={() => setOpen(false)} className={btnGhost}>Cancel</button>
          </div>
          {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
        </form>
      )}
      {error && <p className="text-sm text-destructive">Couldn't load your collections. {error.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading && [0, 1].map((i) => <div key={i} className="card-surface h-40 animate-pulse" />)}
        {data?.map((c) => (
          <Link key={c.id} to="/app/collections/$id" params={{ id: c.id }} className="card-surface hover-lift p-5">
            <div className="flex items-center justify-between gap-2"><p className="text-lg font-medium">{c.name}</p>{c.custom ? <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Yours</span> : <CategoryBadge c={c.category} />}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.description || "No description"}</p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {c.docIds.map((id) => <li key={id}>· {getDoc(id)?.title ?? "Missing document"}</li>)}
              {!c.docIds.length && <li>No documents yet</li>}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}
