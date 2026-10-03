import type { Answer, Scope } from "@/types/knowledge";
import { compareDocs, type Comparison } from "@/services/rag/compare";
import { runRagPipeline } from "@/services/rag/pipeline";

/** Provider-agnostic AI layer. A live provider can implement this behind server functions later. */
export interface AIProvider {
  readonly label: "Mock AI" | "Live AI";
  answer(query: string, scope: Scope, history: Answer[]): Promise<Answer>;
  compare(a: string, b: string): Promise<Comparison>;
}

export class MockAIProvider implements AIProvider {
  readonly label = "Mock AI" as const;
  async answer(query: string, scope: Scope, history: Answer[]) {
    return runRagPipeline(query, scope, history);
  }
  async compare(a: string, b: string) {
    return compareDocs(a, b);
  }
}

let provider: AIProvider | null = null;
export const getAIProvider = (): AIProvider => (provider ??= new MockAIProvider());
