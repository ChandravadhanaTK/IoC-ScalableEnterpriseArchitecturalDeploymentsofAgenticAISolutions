import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/kf/bits";
import { getDoc } from "@/data/seed";
import { retrieve, type Mode } from "@/services/rag/retriever";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/search")({
  head: () => ({
    meta: [
      { title: "Semantic Search — KnowFlow" },
      { name: "description", content: "Keyword, semantic and hybrid search across every chunk you own, with match reasons." },
      { property: "og:title", content: "Semantic Search — KnowFlow" },
      { property: "og:description", content: "Keyword, semantic and hybrid search across every chunk you own." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("leader election majority");
  const [mode, setMode] = useState<Mode>("hybrid");
  const results = useMemo(() => (q.trim() ? retrieve(q, { kind: "all" }, 10, mode) : []), [q, mode]);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Semantic Search" sub="Search chunks, not just titles." />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your knowledge…" className="w-full rounded-xl border bg-card px-4 py-3" autoFocus />
      <div className="mt-3 flex gap-1.5">
        {(["hybrid", "keyword", "semantic"] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn("rounded-full border px-3 py-1 text-xs capitalize", mode === m ? "border-primary bg-primary/15 text-primary" : "bg-card text-muted-foreground")}>{m}</button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {q.trim() && !results.length && <div className="card-surface p-8 text-center text-sm text-muted-foreground">No matches. Try “consensus”, “embeddings” or “pods”.</div>}
        {results.map((r) => {
          const d = getDoc(r.chunk.docId)!;
          const s = d.sections.find((x) => x.id === r.chunk.sectionId)!;
          return (
            <Link key={r.chunk.id} to="/app/documents/$id" params={{ id: d.id }} search={{ sec: s.id, chunk: r.chunk.id }} className="card-surface hover-lift block p-4">
              <div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium">{d.title} · §{s.title}</span><span className="font-mono text-primary">{r.score.toFixed(2)}</span></div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{r.chunk.text}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{r.reasons.map((x) => <span key={x} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{x}</span>)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
