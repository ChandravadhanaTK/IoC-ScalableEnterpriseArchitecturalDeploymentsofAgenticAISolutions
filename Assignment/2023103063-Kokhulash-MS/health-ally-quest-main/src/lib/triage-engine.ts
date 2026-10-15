// Rule-based simulation of the four clinical agents. No real diagnosis is performed.

export type AgentName =
  | "Symptom Triage Agent"
  | "Scheduling Agent"
  | "Doctor Summary Agent"
  | "Follow-Up Reminder Agent"
  | "Orchestrator";

export type Msg = {
  role: "patient" | "agent" | "system";
  agent?: AgentName;
  text: string;
  flags?: string[];
  tone?: "emergency" | "info";
};

export type Intake = { complaint: string; onset: string; pain: number | null; history: string };

export type Esi = 1 | 2 | 3 | 4 | 5;

export type Classification = {
  esi: Esi;
  specialty: string;
  redFlags: string[];
  risk: number;
  confidence: number;
  rationale: string;
  disposition: string;
};

export type Soap = { subjective: string; objective: string; assessment: string; plan: string };
export type Sbar = { situation: string; background: string; assessment: string; recommendation: string };

export const QUESTIONS = [
  "Hello, I'm the Symptom Triage Agent. In your own words, what's bothering you today?",
  "Thank you. When did this start, and has it been getting better, worse, or staying the same?",
  "On a scale of 1 to 10, how would you rate your pain or discomfort right now?",
  "Do you have any medical conditions, allergies, or medications you currently take?",
];

const RED_FLAGS: { label: string; re: RegExp }[] = [
  { label: "Chest pain / pressure", re: /crushing|chest (pain|pressure|tightness)/i },
  { label: "Acute dyspnea", re: /short(ness)? of breath|can'?t breathe|struggling to breathe|dyspn/i },
  { label: "Stroke signs", re: /face droop|slurred|stroke|numb(ness)? (on|in) one side|one side.*weak/i },
  { label: "Sudden severe neuro deficit", re: /worst headache|thunderclap|sudden (severe|vision loss)/i },
  { label: "Loss of consciousness", re: /unconscious|passed out|fainted|seizure/i },
  { label: "Self-harm risk", re: /suicid|kill myself|end my life/i },
  { label: "Severe bleeding", re: /bleeding (heavily|won'?t stop)|coughing (up )?blood/i },
];

export const CLINICAL_TERMS =
  /(chest|pain|breath|fever|rash|swollen|swelling|ankle|fracture|sprain|blood pressure|hypertension|lisinopril|amlodipine|ibuprofen|asthma|diabetes|allerg\w*|nausea|sweating|radiating|left arm|headache|cough|dizzy|\d{2,3}\/\d{2,3}|\d+(\.\d)?\s?°?F)/gi;

export function detectRedFlags(text: string): string[] {
  return RED_FLAGS.filter((f) => f.re.test(text)).map((f) => f.label);
}

export function parsePain(text: string): number | null {
  const m = text.match(/\b(10|[0-9])\b/);
  return m ? Number(m[1]) : null;
}

export function esiTone(esi: Esi): "emergency" | "urgent" | "routine" {
  return esi <= 2 ? "emergency" : esi === 3 ? "urgent" : "routine";
}

export function esiLabel(esi: Esi) {
  return ["", "Immediate", "Emergent", "Urgent", "Less urgent", "Non-urgent"][esi];
}

export function classify(intake: Intake, age = 35): Classification {
  const all = `${intake.complaint} ${intake.onset} ${intake.history}`;
  const flags = detectRedFlags(all);
  const pain = intake.pain ?? 0;
  const pediatric = age < 18 || /\b(son|daughter|child|toddler|baby|kid)\b/i.test(all);

  if (flags.length) {
    const esi: Esi = flags.includes("Loss of consciousness") || flags.length >= 3 ? 1 : 2;
    return {
      esi,
      specialty: "Emergency Medicine",
      redFlags: flags,
      risk: esi === 1 ? 98 : 92,
      confidence: 0.94,
      rationale: `Red-flag pattern detected: ${flags.join(", ")}. Time-critical pathology cannot be excluded remotely.`,
      disposition: "Call 911 / go to the nearest Emergency Department now",
    };
  }
  if (pediatric && /fever/i.test(all) && /rash/i.test(all)) {
    return {
      esi: 3,
      specialty: "Pediatrics",
      redFlags: ["Pediatric fever with rash (monitor for non-blanching rash)"],
      risk: 64,
      confidence: 0.86,
      rationale: "Febrile child with new rash. Needs same-day pediatric evaluation to exclude serious infection.",
      disposition: "Same-day pediatric priority visit",
    };
  }
  if (/fractur|sprain|swollen|swelling|can'?t (bear|put) weight|twisted|deform/i.test(all) || pain >= 7) {
    return {
      esi: 3,
      specialty: "Orthopedics",
      redFlags: [],
      risk: 52 + Math.min(pain, 10) * 2,
      confidence: 0.88,
      rationale: `Acute musculoskeletal injury, pain ${pain}/10. Imaging likely needed to rule out fracture.`,
      disposition: "Urgent same-day orthopedic / urgent care visit",
    };
  }
  if (/cough|wheez|asthma/i.test(all)) {
    return {
      esi: 4,
      specialty: "Pulmonology",
      redFlags: [],
      risk: 30,
      confidence: 0.81,
      rationale: "Respiratory complaint without distress indicators.",
      disposition: "Routine outpatient visit within 2–3 days",
    };
  }
  if (/blood pressure|hypertension|check ?up|refill|follow[- ]?up|routine/i.test(all)) {
    return {
      esi: 5,
      specialty: "Family Medicine",
      redFlags: [],
      risk: 12,
      confidence: 0.93,
      rationale: "Stable chronic condition follow-up. No acute symptoms reported.",
      disposition: "Routine scheduled outpatient appointment",
    };
  }
  return {
    esi: pain >= 4 ? 4 : 5,
    specialty: "Family Medicine",
    redFlags: [],
    risk: 18 + pain * 3,
    confidence: 0.74,
    rationale: "Non-specific complaint without red-flag features.",
    disposition: "Routine primary care appointment",
  };
}

export function buildSoap(intake: Intake, cls: Classification, age: number): Soap {
  return {
    subjective: `${age}-year-old reports: "${intake.complaint}". Onset/course: ${intake.onset || "not reported"}. History & medications: ${intake.history || "none reported"}.`,
    objective: `Patient-reported pain ${intake.pain ?? "n/a"}/10. No in-person vitals captured (remote intake). Red flags screened: ${cls.redFlags.length ? cls.redFlags.join("; ") : "none detected"}.`,
    assessment: `AI triage acuity ESI ${cls.esi} (${esiLabel(cls.esi)}), confidence ${Math.round(cls.confidence * 100)}%. ${cls.rationale} Differential to be determined by clinician.`,
    plan: `${cls.disposition}. Route to ${cls.specialty}. Clinician to confirm assessment, order diagnostic workup as indicated. Automated follow-up check-ins enrolled.`,
  };
}

export function buildSbar(intake: Intake, cls: Classification, name: string, age: number): Sbar {
  return {
    situation: `${name}, ${age}y, presenting with ${intake.complaint.toLowerCase().slice(0, 90)}.`,
    background: intake.history || "No significant history reported.",
    assessment: `ESI ${cls.esi} · risk ${cls.risk}/100 · ${cls.redFlags.length ? "red flags: " + cls.redFlags.join(", ") : "no red flags"}.`,
    recommendation: `${cls.disposition}; ${cls.specialty} review.`,
  };
}

export type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  expected: Esi;
  patient: { name: string; age: number };
  answers: string[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "cardiac",
    title: "Cardiac red flag",
    subtitle: "Chest pain & shortness of breath",
    expected: 2,
    patient: { name: "Robert Hale", age: 58 },
    answers: [
      "I have crushing chest pain radiating to my left arm and I'm short of breath, sweating a lot.",
    ],
  },
  {
    id: "msk",
    title: "Acute musculoskeletal",
    subtitle: "Severe sprain / suspected fracture",
    expected: 3,
    patient: { name: "Priya Nair", age: 27 },
    answers: [
      "I twisted my ankle playing football and it's really swollen, I can't put weight on it.",
      "About 3 hours ago, the swelling is getting worse.",
      "It's an 8 out of 10.",
      "No conditions. I took ibuprofen 400mg once. No allergies.",
    ],
  },
  {
    id: "htn",
    title: "Routine chronic follow-up",
    subtitle: "Hypertension checkup",
    expected: 5,
    patient: { name: "Margaret Ellis", age: 66 },
    answers: [
      "I need my routine blood pressure checkup and a refill, home readings around 132/84.",
      "It's my regular 3-month follow-up, nothing new, feeling fine.",
      "0, no pain at all.",
      "Hypertension for 8 years, I take lisinopril 10mg daily. Allergic to penicillin.",
    ],
  },
  {
    id: "peds",
    title: "Pediatric fever with rash",
    subtitle: "Pediatric clinic priority",
    expected: 3,
    patient: { name: "Leo Martinez (child)", age: 4 },
    answers: [
      "My son has a fever of 102.4F and a red rash spreading on his chest.",
      "Fever started yesterday, the rash appeared this morning and is spreading.",
      "He seems uncomfortable, maybe a 5.",
      "No conditions, vaccinations up to date, no allergies. Gave children's acetaminophen.",
    ],
  },
];

export function buildFollowUpSteps(cls: Classification) {
  const tone = esiTone(cls.esi);
  return [
    {
      label: "24h check-in",
      offset: "+24h",
      channel: "SMS" as const,
      message:
        tone === "urgent"
          ? "How are your symptoms since your visit? Reply WORSE if anything has escalated."
          : "Reminder: your appointment is coming up. Reply C to confirm.",
      status: "scheduled" as const,
    },
    {
      label: "48h symptom progression",
      offset: "+48h",
      channel: "Portal" as const,
      message: "Please complete a 3-question symptom progression check in your patient portal.",
      status: "scheduled" as const,
    },
    {
      label: "7-day adherence & red-flag re-check",
      offset: "+7d",
      channel: "Email" as const,
      message: "Are you following your care plan? Seek emergency care if any warning signs appear.",
      status: "scheduled" as const,
    },
  ];
}
