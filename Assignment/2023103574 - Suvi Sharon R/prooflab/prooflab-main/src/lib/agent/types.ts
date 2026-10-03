// Shared, client-safe types and stage metadata for the ProofLab agent.

export const STAGES = [
  { id: "understanding", title: "Idea Understanding" },
  { id: "star", title: "STAR Analysis" },
  { id: "proscons", title: "Pros & Cons" },
  { id: "existing", title: "Existing Work" },
  { id: "feasibility", title: "Feasibility" },
  { id: "gap", title: "Research Gap" },
  { id: "simulation", title: "Simulation" },
  { id: "architecture", title: "Architecture" },
  { id: "final", title: "Final Report" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];
export type StageStatus = "pending" | "running" | "completed" | "skipped" | "error";
export type Level = "low" | "medium" | "high";

export interface Understanding {
  summary: string;
  core_problem: string;
  technology: string;
  users: string;
  outcome: string;
  skip: { stage: StageId; reason: string }[];
}
export interface Star { situation: string; task: string; action: string; result: string }
export interface ProsCons {
  positives: { title: string; detail: string }[];
  negatives: { title: string; detail: string; category: string }[];
}
export interface ExistingWork {
  items: { name: string; description: string; certainty: "known" | "uncertain" }[];
  note: string;
}
export interface FeasibilityItem { rating: Level; summary: string }
export interface Feasibility {
  technical: FeasibilityItem;
  data: FeasibilityItem;
  infrastructure: FeasibilityItem;
  complexity: FeasibilityItem;
  resources: FeasibilityItem;
  verdict: string;
}
export interface Gap { gaps: { title: string; detail: string; confidence: Level }[] }
export interface SimulationParams {
  applicable: boolean;
  reason: string;
  title: string;
  metric_name: string;
  unit: string;
  baseline: number;
  direction: "decrease" | "increase";
  improvement_pct: number;
  adoption_step_pct: number;
  periods: number;
  period_label: string;
  assumptions: string[];
}
export interface Architecture {
  input: string[];
  processing: string[];
  storage: string[];
  output: string[];
  notes: string;
}
export interface FinalReport {
  summary: string;
  strengths: string[];
  risks: string[];
  existing_work: string;
  feasibility: string;
  gap: string;
  simulation: string;
  architecture: string;
  next_step: string;
}

export interface StageResults {
  understanding?: Understanding;
  star?: Star;
  proscons?: ProsCons;
  existing?: ExistingWork;
  feasibility?: Feasibility;
  gap?: Gap;
  simulation?: SimulationParams;
  architecture?: Architecture;
  final?: FinalReport;
}

export interface Analysis {
  id: string;
  idea: string;
  createdAt: number;
  results: StageResults;
  skipped: Partial<Record<StageId, string>>;
}
