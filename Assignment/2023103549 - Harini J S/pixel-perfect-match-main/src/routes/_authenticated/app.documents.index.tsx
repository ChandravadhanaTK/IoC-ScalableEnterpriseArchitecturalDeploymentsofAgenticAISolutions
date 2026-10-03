import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CategoryBadge, PageHeader, StatusBadge } from "@/components/kf/bits";
import { categoryLabel, collections, documents } from "@/data/seed";
import type { Category } from "@/types/knowledge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/documents/")({
  head: () => ({
    meta: [
      { title: "Knowledge Library — KnowFlow" },
      { name: "description", content: "Browse and filter every document in your knowledge base." },
      { property: "og:title", content: "Knowledge Library — KnowFlow" },
      { property: "og:description", content: "Browse and filter every document in your knowledge base." },
    ],
  }),
  component: Library,
});

function Library() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const cats = [...new Set(documents.map((d) => d.category))];
  const list = documents.filter((d) => (cat === "all" || d.category === cat) && d.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="All Documents" sub={`${documents.length} documents across ${collections.length} collections`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title…" className="w-full rounded-lg border bg-card px-3 py-2 text-sm sm:w-64" />
        {(["all", ...cats] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-3 py-1.5 text-xs", cat === c ? "border-primary bg-primary/15 text-primary" : "bg-card text-muted-foreground hover:bg-accent")}>
            {c === "all" ? "All" : categoryLabel[c]}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="card-surface p-10 text-center text-sm text-muted-foreground">No documents match. <button className="text-primary" onClick={() => { setQ(""); setCat("all"); }}>Clear filters</button></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <Link key={d.id} to="/app/documents/$id" params={{ id: d.id }} className="card-surface hover-lift flex flex-col p-4">
              <div className="flex items-center justify-between gap-2"><CategoryBadge c={d.category} /><StatusBadge s={d.status} /></div>
              <p className="mt-3 font-medium">{d.title}</p>
              <p className="text-xs text-muted-foreground">{d.author}</p>
              <p className="mt-auto pt-4 font-mono text-[11px] text-muted-foreground">{d.sections.length} sections · {d.sections.reduce((n, s) => n + s.chunks.length, 0)} chunks</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
