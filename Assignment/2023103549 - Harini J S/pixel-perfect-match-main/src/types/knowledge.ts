export type Category = "research" | "academics" | "programming" | "devops" | "aiml" | "projects" | "personal";

export interface Chunk { id: string; docId: string; sectionId: string; text: string }
export interface Section { id: string; title: string; chunks: Chunk[] }
export interface KDocument {
  id: string; title: string; category: Category; collectionId: string; author: string; addedAt: string;
  status: "ready" | "processing" | "failed" | "queued"; tags: string[]; sections: Section[];
  /** true for documents the signed-in user uploaded */
  owned?: boolean; error?: string | null;
}
export interface Collection { id: string; name: string; description: string; category: Category }
export interface Concept { id: string; name: string; aliases: string[]; definition: string; docs: string[] }
export type RelationType = "discusses" | "related_to" | "references" | "contrasts_with" | "belongs_to" | "depends_on";
export interface Relation { from: string; to: string; type: RelationType }

export type Scope =
  | { kind: "all" }
  | { kind: "collection"; id: string }
  | { kind: "documents"; ids: string[] };

export interface ScoredChunk { chunk: Chunk; keyword: number; semantic: number; score: number; reasons: string[] }
export interface Citation { n: number; docId: string; sectionId: string; chunkId: string; excerpt: string }
export interface TraceStep { name: string; ms: number; detail: string }
export interface Answer { text: string; citations: Citation[]; retrieved: ScoredChunk[]; trace: TraceStep[]; grounded: boolean }
