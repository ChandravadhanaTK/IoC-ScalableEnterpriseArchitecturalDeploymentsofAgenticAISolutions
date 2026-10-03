import type { Student } from "./types";

export const SAMPLES: { id: string; label: string; text: string }[] = [
  {
    id: "ptum",
    label: "PTUM — Full Stack Engineer (primary demo)",
    text: `📢 Campus Recruitment Drive — 2027 Batch
Company: PTUM
Role: Full Stack Engineer
CTC: ₹18 Lakhs (UG/PG)
Eligible Batch: 2027
Eligible Degrees: B.E./B.Tech, MCA
Eligible Branches: CSE, EEE, ECE, IT, AI&DS, MCA
Registration: 30 Sep 2026 2:30 PM to 1 Oct 2026 2:30 PM
Online Assessment: 8 October 2026 1:00 PM
Pre-Placement Talk: 15 October 2026 9:00 AM
Technical & HR Rounds: Post-OA shortlist
Students must register on the placement portal before the deadline.`,
  },
  {
    id: "tentative",
    label: "Product company — tentative dates, strict criteria",
    text: `Dear Students, *Kovai Systems* is visiting for SDE Intern + PPO.
Role: Software Development Engineer Intern
Stipend: ₹40,000 per month
CTC: 12 LPA (on PPO)
Eligible Branches: CSE, IT
CGPA: 8.0 and above
10th: 80%
12th: 80%
Backlogs: No active backlogs
Skills: Java, Spring Boot, SQL, Data Structures, REST APIs
Bond: 1 year service agreement
Online Assessment: 20 October 2026 10:00 AM (tentative)
Technical Interview: Tentative - will be shared later
Location: Coimbatore, Bengaluru`,
  },
  {
    id: "sparse",
    label: "Sparse WhatsApp forward — missing fields",
    text: `Fwd: Hiring drive by Nimbus Analytics for Data Analyst role. More details soon. Register in portal.`,
  },
];

export const DEFAULT_STUDENT: Student = {
  name: "Arjun Raghavan",
  degree: "B.Tech",
  branch: "CSE",
  batch: "2027",
  cgpa: 8.42,
  tenth: 92.4,
  twelfth: 88.6,
  activeBacklogs: 0,
  clearedBacklogs: 1,
  skills: ["JavaScript", "React", "Node.js", "SQL", "Python", "Data Structures", "Git"],
  targetRoles: ["Full Stack Engineer", "Software Development Engineer"],
  resumeText:
    "Arjun Raghavan | arjun.r@example.com | +91 98765 43210\nB.Tech CSE, 2027, CGPA 8.42\nProjects: Campus event portal (React, Node.js, PostgreSQL); Expense tracker (Python, Flask)\nInternship: Web developer intern at a Chennai startup (2 months)\nSkills: JavaScript, React, Node.js, SQL, Python, Data Structures, Git",
};

export const AGENTS = [
  {
    id: "extraction",
    name: "Notification Extraction Agent",
    short: "Extraction",
    purpose: "Turns raw WhatsApp / email / circular text into a typed opportunity record.",
    input: { type: "object", required: ["raw_text"], properties: { raw_text: { type: "string" }, source: { type: "string", enum: ["whatsapp", "email", "circular"] } } },
    output: { type: "object", properties: { company: { type: ["string", "null"] }, role: { type: ["string", "null"] }, ctc_lpa: { type: ["number", "null"] }, branches: { type: "array", items: { type: "string" } }, events: { type: "array", items: { type: "object", properties: { kind: { type: "string" }, start: { type: ["string", "null"], format: "date-time" }, tentative: { type: "boolean" } } } } } },
    handoff: "eligibility",
    retries: "2 retries, exponential backoff 400ms → 1.6s, then FALLBACK to deterministic parser",
  },
  {
    id: "eligibility",
    name: "Eligibility Analysis Agent",
    short: "Eligibility",
    purpose: "Compares student credentials with company criteria; unknown criteria stay 'Not specified'.",
    input: { type: "object", required: ["opportunity", "student"], properties: { opportunity: { $ref: "#/Opportunity" }, student: { $ref: "#/Student" } } },
    output: { type: "object", properties: { verdict: { type: "string", enum: ["Eligible", "Borderline", "Ineligible"] }, criteria: { type: "array" } } },
    handoff: "timeline",
    retries: "Pure function — no retry needed; validation failure → FAILED",
  },
  {
    id: "timeline",
    name: "Recruitment Timeline Agent",
    short: "Timeline",
    purpose: "Orders milestones, preserves tentative flags, never invents dates.",
    input: { type: "object", properties: { events: { type: "array" } } },
    output: { type: "object", properties: { ordered: { type: "array" }, undated: { type: "array" } } },
    handoff: "resume",
    retries: "1 retry on schema mismatch",
  },
  {
    id: "resume",
    name: "Resume Matching Agent",
    short: "Resume",
    purpose: "Anonymizes resume PII, then matches skills; suppresses % when role specs are insufficient.",
    input: { type: "object", properties: { resume_anonymized: { type: "string" }, role_skills: { type: "array" } } },
    output: { type: "object", properties: { score: { type: ["number", "null"] }, gaps: { type: "array" } } },
    handoff: "planner",
    retries: "2 retries → FALLBACK keyword matcher",
  },
  {
    id: "planner",
    name: "Preparation Planner Agent",
    short: "Planner",
    purpose: "Builds a day-by-day company study plan until the Online Assessment.",
    input: { type: "object", properties: { gaps: { type: "array" }, oa_date: { type: ["string", "null"] } } },
    output: { type: "object", properties: { days: { type: "array" } } },
    handoff: "reminder",
    retries: "2 retries → FALLBACK template planner",
  },
  {
    id: "reminder",
    name: "Reminder & Alert Agent",
    short: "Reminders",
    purpose: "Schedules 24h and 1h alerts for every dated milestone.",
    input: { type: "object", properties: { events: { type: "array" } } },
    output: { type: "object", properties: { reminders: { type: "array" } } },
    handoff: null,
    retries: "Idempotent scheduling — dedup by event+offset",
  },
] as const;
