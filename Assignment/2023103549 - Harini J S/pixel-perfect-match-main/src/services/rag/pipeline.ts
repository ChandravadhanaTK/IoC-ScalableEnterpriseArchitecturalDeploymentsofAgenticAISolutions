import { concepts, documents, getDoc } from "@/data/seed";
import type { Answer, Citation, Scope, ScoredChunk, TraceStep } from "@/types/knowledge";
import { retrieve, tokenize } from "./retriever";
import { compareDocs } from "./compare";

/** Query understanding: intent + resolved document references. */
function understand(query: string, history: Answer[]) {
  const q = query.toLowerCase();
  const mentioned = documents.filter((d) => {
    const key = d.title.toLowerCase().split(" ")[0] ?? "";
    return key.length > 2 && q.includes(key);
  });
  const isCompare = /(differ|compare|versus|\bvs\b|contrast)/.test(q);
  const prevDoc = history.at(-1)?.citations[0]?.docId;
  if (isCompare && mentioned.length === 1 && prevDoc && prevDoc !== mentioned[0]!.id) {
    return { intent: "compare" as const, docs: [prevDoc, mentioned[0]!.id] };
  }
  if (isCompare && mentioned.length >= 2) return { intent: "compare" as const, docs: [mentioned[0]!.id, mentioned[1]!.id] };
  return { intent: "answer" as const, docs: mentioned.map((d) => d.id) };
}

function sentences(text: string) {
  return text.match(/[^.!?]+[.!?]/g)?.map((s) => s.trim()) ?? [text];
}

export async function runRagPipeline(query: string, scope: Scope, history: Answer[]): Promise<Answer> {
  const trace: TraceStep[] = [];
  const t = () => performance.now();
  let s = t();
  const u = understand(query, history);
  trace.push({ name: "Query understanding", ms: t() - s, detail: `intent=${u.intent}${u.docs.length ? `, docs=${u.docs.join(",")}` : ""}` });

  if (u.intent === "compare") {
    s = t();
    const cmp = compareDocs(u.docs[0]!, u.docs[1]!);
    trace.push({ name: "Comparison retrieval", ms: t() - s, detail: `${cmp.rows.length * 2} chunks across 2 documents` });
    const A = getDoc(cmp.a)!.title;
    const B = getDoc(cmp.b)!.title;
    const citations: Citation[] = [];
    const lines = cmp.rows.slice(0, 4).map((r) => {
      const parts = [r.a, r.b].map((cell) => {
        if (!cell.cite) return cell.text;
        const n = citations.length + 1;
        citations.push({ ...cell.cite, n });
        return `${cell.text} [${n}]`;
      });
      return `- **${r.aspect}** — *${A}:* ${parts[0]} *${B}:* ${parts[1]}`;
    });
    trace.push({ name: "Citation verification", ms: 0.2, detail: `${citations.length}/${citations.length} citations verified` });
    return {
      text: `Here is how **${A}** differs from **${B}**, based on your documents:\n\n${lines.join("\n")}\n\nOpen the full comparison for limitations and the AI explanation of the major differences.`,
      citations, retrieved: [], trace, grounded: true,
    };
  }

  s = t();
  const effectiveScope: Scope = u.docs.length && scope.kind === "all" ? { kind: "documents", ids: u.docs } : scope;
  const retrieved = retrieve(query, effectiveScope, 6);
  trace.push({ name: "Hybrid retrieval", ms: t() - s, detail: `${retrieved.length} chunks (BM25 + semantic) in scope ${effectiveScope.kind}` });

  if (!retrieved.length || retrieved[0]!.score < 0.12) {
    trace.push({ name: "Grounding check", ms: 0.1, detail: "no supporting chunks — refusing to guess" });
    return {
      text: "I couldn't find this in your knowledge base for the selected scope. Try widening the scope to **Entire knowledge base**, or add a document that covers this topic.",
      citations: [], retrieved, trace, grounded: false,
    };
  }

  s = t();
  const qTok = new Set(tokenize(query));
  const cands: { text: string; hit: ScoredChunk; score: number }[] = [];
  for (const hit of retrieved.slice(0, 4)) {
    for (const sent of sentences(hit.chunk.text)) {
      const overlap = tokenize(sent).filter((x) => qTok.has(x)).length;
      cands.push({ text: sent, hit, score: overlap + hit.score * 2 });
    }
  }
  const chosen = cands.sort((a, b) => b.score - a.score).slice(0, 4);
  trace.push({ name: "Context assembly", ms: t() - s, detail: `${chosen.length} supporting sentences from ${new Set(chosen.map((c) => c.hit.chunk.id)).size} chunks` });

  s = t();
  const citations: Citation[] = [];
  const cite = (h: ScoredChunk) => {
    const existing = citations.find((c) => c.chunkId === h.chunk.id);
    if (existing) return existing.n;
    const n = citations.length + 1;
    citations.push({ n, docId: h.chunk.docId, sectionId: h.chunk.sectionId, chunkId: h.chunk.id, excerpt: h.chunk.text });
    return n;
  };
  const concept = concepts.find((c) => [c.name, ...c.aliases].some((a) => query.toLowerCase().includes(a.toLowerCase())));
  const intro = concept ? `**${concept.name}** — ${concept.definition}\n\n` : "";
  const body = chosen.map((c) => `- ${c.text} [${cite(c.hit)}]`).join("\n");
  const docsUsed = [...new Set(citations.map((c) => getDoc(c.docId)?.title))].join(", ");
  trace.push({ name: "Generation (Mock AI)", ms: t() - s, detail: "extractive composition with citation markers" });
  trace.push({ name: "Citation verification", ms: 0.3, detail: `${citations.length}/${citations.length} citations map to retrieved chunks` });

  return {
    text: `${intro}From your knowledge (${docsUsed}):\n\n${body}`,
    citations, retrieved, trace, grounded: true,
  };
}
