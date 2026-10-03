import { allChunks, concepts, documents, getDoc } from "@/data/seed";
import type { Chunk, Scope, ScoredChunk } from "@/types/knowledge";

const STOP = new Set("a an the of in on to is are was what how why does do and or for with this that it its be by as at from which who role between".split(" "));

export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)).map(stem);
}
function stem(t: string) {
  return t.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "") || t;
}

/** Deterministic mock embedding: hashed tokens + concept expansion, 384 dims. */
const DIM = 384;
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}
export function embed(text: string): Float32Array {
  const v = new Float32Array(DIM);
  const toks = tokenize(text);
  const lower = text.toLowerCase();
  for (const t of toks) v[hash(t) % DIM]! += 1;
  for (const c of concepts) {
    if ([c.name, ...c.aliases].some((a) => lower.includes(a.toLowerCase()))) v[hash("concept:" + c.id) % DIM]! += 3;
  }
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}
const cos = (a: Float32Array, b: Float32Array) => a.reduce((s, x, i) => s + x * b[i]!, 0);

const embCache = new Map<string, Float32Array>();
const chunkEmb = (c: Chunk) => {
  let e = embCache.get(c.id);
  if (!e) { e = embed(c.text); embCache.set(c.id, e); }
  return e;
};

export function scopeChunks(scope: Scope): Chunk[] {
  const all = allChunks().filter((c) => getDoc(c.docId)?.status === "ready");
  if (scope.kind === "all") return all;
  if (scope.kind === "collection") {
    const ids = new Set(documents.filter((d) => d.collectionId === scope.id).map((d) => d.id));
    return all.filter((c) => ids.has(c.docId));
  }
  const ids = new Set(scope.ids);
  return all.filter((c) => ids.has(c.docId));
}

export type Mode = "hybrid" | "keyword" | "semantic";

export function retrieve(query: string, scope: Scope, k = 6, mode: Mode = "hybrid"): ScoredChunk[] {
  const qTok = tokenize(query);
  const qEmb = embed(query);
  const pool = scopeChunks(scope);
  const N = pool.length || 1;
  const df = new Map<string, number>();
  for (const t of new Set(qTok)) df.set(t, pool.filter((c) => tokenize(c.text).includes(t)).length);

  const scored = pool.map((chunk) => {
    const toks = tokenize(chunk.text);
    const title = tokenize(getDoc(chunk.docId)?.title ?? "");
    let kw = 0;
    const matched: string[] = [];
    for (const t of new Set(qTok)) {
      const tf = toks.filter((x) => x === t).length + (title.includes(t) ? 1 : 0);
      if (tf) {
        matched.push(t);
        const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
        kw += (idf * tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (toks.length / 40)));
      }
    }
    const sem = cos(qEmb, chunkEmb(chunk));
    const kwN = Math.min(kw / 8, 1);
    const score = mode === "keyword" ? kwN : mode === "semantic" ? sem : 0.5 * kwN + 0.5 * sem;
    const reasons: string[] = [];
    if (matched.length) reasons.push(`keywords: ${matched.join(", ")}`);
    if (sem > 0.2) reasons.push(`semantic ${(sem * 100).toFixed(0)}%`);
    const conceptHits = concepts.filter((c) => qTok.some((t) => tokenize(c.name).includes(t)) && c.docs.includes(chunk.docId));
    if (conceptHits.length) reasons.push(`concept: ${conceptHits.map((c) => c.name).join(", ")}`);
    return { chunk, keyword: kwN, semantic: sem, score, reasons };
  });

  return scored.filter((s) => s.score > 0.05).sort((a, b) => b.score - a.score).slice(0, k);
}
