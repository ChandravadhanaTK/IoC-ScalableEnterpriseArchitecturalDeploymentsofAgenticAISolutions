export type EngineMode = "real" | "demo";

export type EventKind =
  | "Registration"
  | "Pre-Placement Talk"
  | "Online Assessment"
  | "Technical Round"
  | "HR Round"
  | "Other";

export interface RecEvent {
  kind: EventKind;
  label: string;
  start: string | null; // ISO with +05:30
  end: string | null;
  rawText: string | null; // original phrase when no concrete date (e.g. "Post-OA shortlist")
  tentative: boolean;
}

export interface Extraction {
  company: string | null;
  role: string | null;
  ctcLpa: number | null;
  ctcNote: string | null;
  stipend: string | null;
  employmentType: string | null;
  batch: string | null;
  degrees: string[];
  branches: string[];
  minCgpa: number | null;
  min10: number | null;
  min12: number | null;
  maxActiveBacklogs: number | null;
  bond: string | null;
  probation: string | null;
  locations: string[];
  skills: string[];
  events: RecEvent[];
}

export interface Student {
  name: string;
  degree: string;
  branch: string;
  batch: string;
  cgpa: number;
  tenth: number;
  twelfth: number;
  activeBacklogs: number;
  clearedBacklogs: number;
  skills: string[];
  targetRoles: string[];
  resumeText: string;
}

export type CriterionStatus = "pass" | "fail" | "borderline" | "unknown";
export interface Criterion {
  label: string;
  required: string;
  student: string;
  status: CriterionStatus;
}
export interface Eligibility {
  verdict: "Eligible" | "Borderline" | "Ineligible";
  criteria: Criterion[];
}

export interface ResumeMatch {
  score: number | null; // null = suppressed
  suppressedReason: string | null;
  matched: string[];
  gaps: string[];
  inferredFocus: string[];
}

export interface PlanItem {
  id: string;
  day: number;
  date: string;
  category: string;
  title: string;
  done: boolean;
}

export interface Reminder {
  id: string;
  event: string;
  offset: "24h" | "1h";
  at: string;
}

export interface Opportunity extends Extraction {
  id: string;
  raw: string;
  engine: EngineMode;
  fallbackReason: string | null;
  createdAt: string;
  eligibility: Eligibility;
  match: ResumeMatch;
  plan: PlanItem[];
  reminders: Reminder[];
  traceId: string;
}

export type AgentState =
  | "IDLE"
  | "PROCESSING"
  | "VALIDATING"
  | "AWAITING_APPROVAL"
  | "COMPLETED"
  | "FAILED"
  | "FALLBACK";

export interface Span {
  id: string;
  parentId: string | null;
  name: string;
  agent: string;
  state: AgentState;
  startOffsetMs: number;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  engine: EngineMode;
  note?: string;
}

export interface Trace {
  id: string;
  opportunityId: string;
  label: string;
  engine: EngineMode;
  startedAt: string;
  spans: Span[];
  safetyFlags: number;
}

export interface AuditEntry {
  seq: number;
  at: string;
  actor: string;
  action: string;
  detail: string;
  prevHash: string;
  hash: string;
}
