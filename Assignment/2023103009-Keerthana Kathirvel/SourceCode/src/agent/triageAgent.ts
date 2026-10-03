/**
 * Application / Agent layer.
 * Pure, UI-free triage logic. In production this module would call a
 * server-side endpoint that runs the LLM; the signature stays identical.
 */
import { DEPARTMENTS, PRIORITIES, type Category, type Priority, type TriageResult } from "@/types/domain";

const CATEGORY_SIGNALS: Record<Category, string[]> = {
  IT: ["wi-fi", "wifi", "network", "projector", "computer", "laptop", "printer", "login", "portal", "server", "internet", "email", "software", "lms"],
  Infrastructure: ["power", "outage", "electric", "elevator", "lift", "water supply", "generator", "building", "roof", "hvac", "air conditioning"],
  Security: ["access card", "badge", "theft", "stolen", "intruder", "cctv", "unauthorized", "harass", "suspicious", "door lock", "breach"],
  Maintenance: ["leak", "broken", "chair", "desk", "toilet", "clean", "paint", "ceiling", "fan", "light", "window", "pest", "equipment"],
  Academic: ["exam", "timetable", "grade", "lecture", "course", "syllabus", "attendance", "faculty", "assignment"],
};

const URGENCY: { words: string[]; weight: number }[] = [
  { words: ["fire", "smoke", "injur", "gas", "electrocut", "sparking", "flood", "breach", "intruder", "harass"], weight: 3 },
  { words: ["outage", "entire", "all students", "hostel", "exam", "stolen", "no access", "down"], weight: 2 },
  { words: ["broken", "not working", "failure", "urgent", "today"], weight: 1 },
];

const ACTIONS: Record<Category, string[]> = {
  IT: ["Open a ticket with the network operations desk", "Dispatch on-site technician with spare hardware", "Notify affected users via campus app"],
  Infrastructure: ["Isolate affected circuit and verify backup supply", "Dispatch facilities engineer", "Post status update for affected buildings"],
  Security: ["Alert duty security officer immediately", "Preserve CCTV footage for the reported window", "Temporarily revoke / reissue affected credentials"],
  Maintenance: ["Schedule maintenance crew within SLA window", "Cordon off area if a safety risk exists", "Log asset for replacement review"],
  Academic: ["Forward to the department academic coordinator", "Confirm schedule impact with faculty", "Inform affected students of any change"],
};

export function analyzeIncident(input: { title: string; description: string; location: string; severity?: Priority }): TriageResult {
  const started = performance.now();
  const text = `${input.title} ${input.description} ${input.location}`.toLowerCase();

  const scores = (Object.keys(CATEGORY_SIGNALS) as Category[]).map((c) => {
    const hits = CATEGORY_SIGNALS[c].filter((w) => text.includes(w));
    return { c, hits };
  });
  scores.sort((a, b) => b.hits.length - a.hits.length);
  const top = scores[0]!;
  const category: Category = top.hits.length ? top.c : "Maintenance";

  let urgency = 0;
  const urgentHits: string[] = [];
  for (const tier of URGENCY) for (const w of tier.words) if (text.includes(w)) { urgency += tier.weight; urgentHits.push(w); }
  if (category === "Security") urgency += 1;
  const reported = input.severity ? PRIORITIES.indexOf(input.severity) : 1;
  const derived = urgency >= 5 ? 3 : urgency >= 3 ? 2 : urgency >= 1 ? 1 : 0;
  const priority: Priority = PRIORITIES[Math.round((derived * 2 + reported) / 3)] ?? "Medium";

  const total = scores.reduce((s, x) => s + x.hits.length, 0) || 1;
  const confidence = Math.min(0.97, Math.max(0.52, 0.55 + (top.hits.length / total) * 0.3 + Math.min(top.hits.length, 3) * 0.04));
  const requiresApproval = priority === "Critical" || category === "Security" || confidence < 0.7;

  const signals = [...top.hits.slice(0, 4), ...urgentHits.slice(0, 3)];
  const reasoning = top.hits.length
    ? `Detected ${category.toLowerCase()} signals (${top.hits.slice(0, 3).join(", ")})${urgentHits.length ? ` with urgency indicators (${urgentHits.slice(0, 2).join(", ")})` : ""}. Reported location "${input.location}" and impact suggest ${priority.toLowerCase()} priority.`
    : `No strong category signals found; defaulting to Maintenance with reduced confidence. Human review recommended.`;

  return {
    category,
    priority,
    department: DEPARTMENTS[category],
    actions: ACTIONS[category],
    reasoning,
    confidence: Math.round(confidence * 100) / 100,
    requiresApproval,
    signals,
    latencyMs: Math.round(performance.now() - started + 820 + text.length * 2),
    model: "campusflow-triage-v2",
  };
}

export const WORKFLOW_STEPS = [
  "Incident Received",
  "Validate",
  "AI Classification",
  "Priority Assessment",
  "Department Routing",
  "Human Approval",
  "Resolution",
] as const;
