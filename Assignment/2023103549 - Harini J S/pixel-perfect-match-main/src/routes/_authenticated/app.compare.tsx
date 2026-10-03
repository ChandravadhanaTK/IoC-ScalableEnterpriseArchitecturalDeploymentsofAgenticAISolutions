import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { z } from "zod";
import { CitationChip, PageHeader, btnPrimary } from "@/components/kf/bits";
import { documents, getDoc } from "@/data/seed";
import { compareDocs } from "@/services/rag/compare";

export const Route = createFileRoute("/_authenticated/app/compare")({
  validateSearch: z.object({ a: z.string().optional(), b: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Compare Documents — KnowFlow" },
      { name: "description", content: "Side-by-side, cited comparison of any two documents in your knowledge." },
      { property: "og:title", content: "Compare Documents — KnowFlow" },
      { property: "og:description", content: "Side-by-side, cited comparison of any two documents." },
    ],
  }),
  component: Compare,
});

function Compare() {
  const { a = "raft", b = "paxos" } = Route.useSearch();
  const nav = Route.useNavigate();
  const ready = documents.filter((d) => d.status === "ready");
  const valid = getDoc(a) && getDoc(b) && a !== b;
  const cmp = valid ? compareDocs(a, b) : null;
  const pick = (key: "a" | "b", v: string) => (
    <select value={v} onChange={(e) => nav({ search: (s) => ({ ...s, [key]: e.target.value }) })} className="rounded-lg border bg-card px-3 py-2 text-sm">
      {ready.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
    </select>
  );
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Compare Documents" sub="Every cell is pulled from a cited chunk.">
        <div className="flex flex-wrap items-center gap-2">{pick("a", a)}<span className="text-muted-foreground">vs</span>{pick("b", b)}</div>
      </PageHeader>
      {!cmp ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">Pick two different documents to compare.</div>
      ) : (
        <>
          <div className="card-surface hero-surface mb-6 p-5">
            <p className="mb-1 flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" />AI explains the major differences</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{cmp.narrative}</p>
            <Link to="/app/assistant" search={{ docs: `${a},${b}` }} className={`${btnPrimary} mt-4`}>Ask follow-up</Link>
          </div>
          <div className="card-surface overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b text-left"><th className="w-44 p-4 font-medium text-muted-foreground">Aspect</th><th className="p-4 font-medium">{getDoc(a)!.title}</th><th className="p-4 font-medium">{getDoc(b)!.title}</th></tr></thead>
              <tbody>
                {cmp.rows.map((r) => (
                  <tr key={r.aspect} className="border-b align-top last:border-0">
                    <td className="p-4 font-medium text-muted-foreground">{r.aspect}</td>
                    {[r.a, r.b].map((c, i) => <td key={i} className="p-4 leading-relaxed">{c.text} {c.cite && <CitationChip c={c.cite} />}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
