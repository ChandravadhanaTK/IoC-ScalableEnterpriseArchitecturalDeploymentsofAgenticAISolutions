export const CATEGORIES = ["IT", "Infrastructure", "Security", "Maintenance", "Academic"] as const;
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export const STATUSES = ["New", "Under Review", "Assigned", "In Progress", "Resolved", "Closed"] as const;
export const ROLES = ["Student", "Staff", "Department Manager", "Administrator"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];
export type Role = (typeof ROLES)[number];

export const DEPARTMENTS: Record<Category, string> = {
  IT: "IT Services",
  Infrastructure: "Facilities & Estates",
  Security: "Campus Security",
  Maintenance: "Maintenance Operations",
  Academic: "Academic Affairs",
};

export interface TriageResult {
  category: Category;
  priority: Priority;
  department: string;
  actions: string[];
  reasoning: string;
  confidence: number; // 0..1
  requiresApproval: boolean;
  signals: string[];
  latencyMs: number;
  model: string;
}

export interface TimelineEntry { status: Status; at: string; by: string }
export interface ActivityEntry { at: string; actor: string; message: string; kind: "agent" | "human" | "system" }

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  category: Category;
  priority: Priority;
  reportedSeverity: Priority;
  department: string;
  status: Status;
  createdAt: string;
  reporter: string;
  assignee: string | null;
  resolutionHours: number | null;
  attachmentName?: string | undefined;
  approval: "not_required" | "pending" | "approved" | "rejected";
  analysis: TriageResult;
  timeline: TimelineEntry[];
  activity: ActivityEntry[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  outcome: "success" | "denied" | "failure";
  ip: string;
}

export interface NewIncidentInput {
  title: string;
  description: string;
  location: string;
  category: Category;
  severity: Priority;
  reporter: string;
  attachmentName?: string | undefined;
}
