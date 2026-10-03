// One prompt builder per agent stage. Each returns the JSON shape the stage must produce.
import type { StageId, StageResults } from "./types";

export const SYSTEM = `You are ProofLab, a careful technology idea analyst.
Rules:
- Reply with ONE valid JSON object only, no markdown, no commentary.
- Be concise: each text field at most 2-3 sentences.
- Never invent papers, citations, statistics or results. If unsure, say "uncertain".
- Do not reveal private reasoning; give conclusions and short justifications only.`;

const shapes: Record<StageId, string> = {
  understanding: `{"summary":"one sentence","core_problem":"","technology":"","users":"","outcome":"","skip":[{"stage":"simulation","reason":""}]}
"skip" lists stages (only from: simulation, existing, gap) that genuinely do not apply; usually empty.`,
  star: `{"situation":"","task":"","action":"","result":"expected result, framed as hypothesis"}`,
  proscons: `{"positives":[{"title":"","detail":""}],"negatives":[{"title":"","detail":"","category":"technical|risk|ethical|cost"}]}
Give 3-5 of each.`,
  existing: `{"items":[{"name":"","description":"","certainty":"known|uncertain"}],"note":""}
List 3-6 widely known related technologies, products or research directions. Name only things you are confident exist; mark anything less certain as "uncertain". No fabricated paper titles or authors.`,
  feasibility: `{"technical":{"rating":"low|medium|high","summary":""},"data":{"rating":"","summary":""},"infrastructure":{"rating":"","summary":""},"complexity":{"rating":"","summary":""},"resources":{"rating":"","summary":""},"verdict":""}
For technical: rating = how feasible. For data, infrastructure, complexity, resources: rating = how demanding.`,
  gap: `{"gaps":[{"title":"","detail":"","confidence":"low|medium|high"}]}
2-4 POTENTIAL gaps compared with existing approaches. Do not claim definite novelty.`,
  simulation: `{"applicable":true,"reason":"","title":"","metric_name":"","unit":"","baseline":0,"direction":"decrease|increase","improvement_pct":0,"adoption_step_pct":0,"periods":6,"period_label":"month","assumptions":[""]}
Propose PARAMETERS for a simple illustrative projection: a metric with a baseline value per period, a hypothetical improvement % at full adoption, and how much adoption grows each period (%). The app computes the numbers deterministically. All values are assumptions; state them. periods between 3 and 12. If no meaningful quantitative metric exists, set applicable=false and explain in reason.`,
  architecture: `{"input":[""],"processing":[""],"storage":[""],"output":[""],"notes":""}
2-4 short component names per layer (Input -> Processing/AI -> Storage/Services -> Output).`,
  final: `{"summary":"","strengths":[""],"risks":[""],"existing_work":"","feasibility":"","gap":"","simulation":"","architecture":"","next_step":""}
Synthesize the previous stage findings concisely. 3 strengths, 3 risks.`,
};

export function buildPrompt(stage: StageId, idea: string, context: StageResults): string {
  const ctx = Object.keys(context).length ? `\nPrevious stage findings (JSON):\n${JSON.stringify(context)}` : "";
  return `Technology idea:\n"""${idea}"""\n${ctx}\n\nStage: ${stage}\nReturn JSON exactly in this shape:\n${shapes[stage]}`;
}
