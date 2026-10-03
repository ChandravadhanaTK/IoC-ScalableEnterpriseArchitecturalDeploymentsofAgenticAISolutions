// AI Agent / Application Layer — deterministic mock pipeline (no real model calls, no diagnosis).
import { CATEGORY_DEPT, SLA_BY_PRIORITY, type Category, type Department, type Priority } from "./data";

export const PIPELINE = ["Request", "Validation", "Classification", "Priority", "Department Routing", "SLA Analysis", "Recommendation", "Human Approval", "Resolution", "Audit"] as const;

export const AGENT_COMPONENTS = [
  { name: "Input Validator", desc: "Schema checks, PII redaction, length limits" },
  { name: "Classifier", desc: "Maps request to operational category" },
  { name: "Priority Analyzer", desc: "Scores urgency & operational impact" },
  { name: "Department Router", desc: "Selects owning department & team" },
  { name: "SLA Analyzer", desc: "Predicts breach risk from workload" },
  { name: "Recommendation Engine", desc: "Suggests next workflow action" },
  { name: "Human Approval Gateway", desc: "Requires sign-off for high-impact actions" },
  { name: "Audit Logger", desc: "Immutable trail of every decision" },
];

export interface Analysis {
  valid: boolean; issues: string[];
  classification: Category; priority: Priority; department: Department;
  action: string; slaRisk: "Low" | "Moderate" | "High"; confidence: number; approval: boolean; slaHours: number;
}

const KEYWORDS: [Category, string[]][] = [
  ["IT", ["network", "wi-fi", "wifi", "printer", "computer", "workstation", "login", "software", "email", "system"]],
  ["Security", ["unauthorized", "access", "cctv", "camera", "badge door", "intruder", "theft", "alarm"]],
  ["Equipment", ["pump", "monitor", "ultrasound", "defibrillator", "calibration", "device", "probe", "bed"]],
  ["Housekeeping", ["spill", "clean", "linen", "waste", "trash", "sanitize"]],
  ["Transportation", ["transport", "wheelchair", "stretcher", "shuttle", "porter"]],
  ["Facilities", ["hvac", "leak", "elevator", "lighting", "power", "plumbing", "temperature", "door"]],
  ["Administration", ["roster", "badge", "booking", "invoice", "schedule", "form"]],
  ["Patient Services", ["meal", "interpreter", "visitor", "kiosk", "comfort"]],
];

export function analyze(title: string, description: string): Analysis {
  const text = `${title} ${description}`.toLowerCase();
  const issues: string[] = [];
  if (title.trim().length < 5) issues.push("Title too short");
  if (description.trim().length < 10) issues.push("Description needs more detail");
  if (/\b(diagnos|prescri|dosage|symptom)/.test(text)) issues.push("Clinical content detected — out of scope for operations AI");

  let classification: Category = "Facilities", best = 0;
  for (const [cat, words] of KEYWORDS) {
    const hits = words.filter((w) => text.includes(w)).length;
    if (hits > best) { best = hits; classification = cat; }
  }
  const critical = /(fire|flood|outage|stuck|unauthorized|failure|or suite|icu|emergency)/.test(text);
  const high = /(urgent|asap|leak|offline|broken|damaged|shortage|er )/.test(text);
  const priority: Priority = critical ? "Critical" : high ? "High" : best > 0 ? "Medium" : "Low";
  const department = CATEGORY_DEPT[classification];
  const slaRisk = priority === "Critical" ? "High" : priority === "High" ? "Moderate" : "Low";
  const confidence = Math.min(98, 62 + best * 11 + (critical || high ? 6 : 0));
  const action = {
    Critical: `Dispatch on-call ${department} lead immediately and notify duty manager`,
    High: `Assign to ${department} priority queue within 30 minutes`,
    Medium: `Route to ${department} standard queue`,
    Low: `Batch into next scheduled ${department} round`,
  }[priority];
  return { valid: issues.length === 0, issues, classification, priority, department, action, slaRisk, confidence, approval: priority === "Critical" || priority === "High" || confidence < 75, slaHours: SLA_BY_PRIORITY[priority] };
}
