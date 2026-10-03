import { getDoc } from "@/data/seed";
import type { Citation } from "@/types/knowledge";
import { retrieve } from "./retriever";

export interface ComparisonRow { aspect: string; a: { text: string; cite?: Citation }; b: { text: string; cite?: Citation } }
export interface Comparison { a: string; b: string; rows: ComparisonRow[]; narrative: string }

const ASPECTS: [string, string][] = [
  ["Core idea", "overview consensus problem definition statement idea"],
  ["Roles & structure", "roles leader follower proposer acceptor learner pod container control plane"],
  ["How agreement / work happens", "phases election vote majority prepare accept replication scheduling"],
  ["Guarantees", "safety guarantee consistency committed chosen"],
  ["Limitations", "difficult not specify cannot unavailable stale latency"],
];

function firstSentence(t: string) {
  const s = t.match(/[^.]+\./)?.[0] ?? t;
  return s.trim();
}

export function compareDocs(aId: string, bId: string): Comparison {
  let n = 0;
  const pick = (docId: string, q: string) => {
    const hit = retrieve(q, { kind: "documents", ids: [docId] }, 1)[0];
    if (!hit) return { text: "Not covered in this document." };
    return {
      text: firstSentence(hit.chunk.text),
      cite: { n: ++n, docId, sectionId: hit.chunk.sectionId, chunkId: hit.chunk.id, excerpt: hit.chunk.text },
    };
  };
  const rows = ASPECTS.map(([aspect, q]) => ({ aspect, a: pick(aId, q), b: pick(bId, q) }));
  const A = getDoc(aId)?.title ?? aId;
  const B = getDoc(bId)?.title ?? bId;
  const r1 = rows[1]!;
  const narrative = `Both ${A} and ${B} appear in your knowledge base. The main differences show up in how each structures its roles and how agreement or work is coordinated: ${r1.a.text.toLowerCase()} By contrast, in ${B}, ${r1.b.text.charAt(0).toLowerCase() + r1.b.text.slice(1)}`;
  return { a: aId, b: bId, rows, narrative };
}
