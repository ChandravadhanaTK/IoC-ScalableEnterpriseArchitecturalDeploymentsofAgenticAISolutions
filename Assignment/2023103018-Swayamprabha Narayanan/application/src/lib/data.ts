// Data Layer — mock/demo data only. No real patient data.
export const CATEGORIES = ["Facilities", "IT", "Housekeeping", "Equipment", "Security", "Transportation", "Administration", "Patient Services"] as const;
export const STATUSES = ["New", "AI Analyzing", "Awaiting Approval", "Assigned", "In Progress", "Escalated", "Resolved", "Closed"] as const;
export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export const DEPARTMENTS = ["Facilities", "IT", "Housekeeping", "Security", "Equipment Maintenance", "Patient Services", "Administration"] as const;
export const LOCATIONS = ["Main Tower · L2", "East Wing · L4", "ER · Ground", "Radiology · B1", "ICU · L5", "Pharmacy · L1", "Admin Block · L3", "Parking Deck B"];

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Department = (typeof DEPARTMENTS)[number];

export interface OpsRequest {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  department: Department;
  location: string;
  status: Status;
  team: string;
  createdAt: number; // epoch ms
  slaHours: number;
  notes?: string | undefined;
}

export interface AuditEvent { id: string; at: number; actor: string; action: string; target: string; level: "info" | "warn" | "critical" }

// Fixed reference time keeps server & client render identical.
export const NOW = Date.UTC(2026, 9, 3, 16, 0, 0);
const H = 3600_000;

export const CATEGORY_DEPT: Record<Category, Department> = {
  Facilities: "Facilities", IT: "IT", Housekeeping: "Housekeeping", Equipment: "Equipment Maintenance",
  Security: "Security", Transportation: "Patient Services", Administration: "Administration", "Patient Services": "Patient Services",
};
export const DEPT_TEAM: Record<Department, string> = {
  Facilities: "Plant Ops Alpha", IT: "Service Desk T2", Housekeeping: "EVS Night Crew", Security: "Security Patrol",
  "Equipment Maintenance": "Biomed Engineering", "Patient Services": "Patient Transport", Administration: "Admin Office",
};
export const SLA_BY_PRIORITY: Record<Priority, number> = { Critical: 1, High: 4, Medium: 12, Low: 48 };

const seeds: [string, Category, Priority, Status][] = [
  ["HVAC failure in OR suite 3", "Facilities", "Critical", "In Progress"],
  ["Nurse station workstation offline", "IT", "High", "Assigned"],
  ["Spill cleanup required at ER entrance", "Housekeeping", "High", "Resolved"],
  ["Infusion pump calibration overdue", "Equipment", "Medium", "Awaiting Approval"],
  ["Unauthorized access attempt at pharmacy door", "Security", "Critical", "Escalated"],
  ["Wheelchair transport to Radiology", "Transportation", "Medium", "In Progress"],
  ["Badge reprint for new staff cohort", "Administration", "Low", "New"],
  ["Visitor wayfinding kiosk not responding", "Patient Services", "Low", "AI Analyzing"],
  ["Elevator 4 stuck between floors", "Facilities", "Critical", "Resolved"],
  ["Wi-Fi dead zone in East Wing L4", "IT", "Medium", "In Progress"],
  ["Linen restock for ICU", "Housekeeping", "Medium", "Closed"],
  ["Ultrasound probe cable damaged", "Equipment", "High", "Assigned"],
  ["Parking deck lighting outage", "Security", "Medium", "New"],
  ["Stretcher shortage on L2", "Transportation", "High", "Awaiting Approval"],
  ["Shift roster export failing", "Administration", "Medium", "Resolved"],
  ["Meal tray delivery delay, East Wing", "Patient Services", "Medium", "Assigned"],
  ["Water leak above Pharmacy ceiling", "Facilities", "High", "In Progress"],
  ["Printer queue jammed in Admissions", "IT", "Low", "Closed"],
  ["Terminal cleaning for room 512", "Housekeeping", "High", "In Progress"],
  ["Defibrillator battery check", "Equipment", "High", "Resolved"],
  ["CCTV camera 12 offline", "Security", "Medium", "AI Analyzing"],
  ["Shuttle schedule update request", "Transportation", "Low", "Resolved"],
  ["Conference room booking conflict", "Administration", "Low", "Closed"],
  ["Interpreter scheduling request", "Patient Services", "Medium", "New"],
];

export const seedRequests: OpsRequest[] = seeds.map(([title, category, priority, status], i) => {
  const department = CATEGORY_DEPT[category];
  return {
    id: `REQ-${String(2481 - i).padStart(5, "0")}`,
    title, category, priority, status, department,
    description: `${title}. Reported by operations staff at Northstar Medical Center. Demo record.`,
    location: LOCATIONS[i % LOCATIONS.length] ?? "Main Tower",
    team: DEPT_TEAM[department],
    createdAt: NOW - (i * 2.7 + 0.4) * H,
    slaHours: SLA_BY_PRIORITY[priority],
  };
});

export const seedAudit: AuditEvent[] = [
  { id: "a1", at: NOW - 0.2 * H, actor: "AI Agent", action: "Classified request", target: "REQ-02481", level: "info" },
  { id: "a2", at: NOW - 0.5 * H, actor: "m.okafor (Dept Manager)", action: "Approved routing", target: "REQ-02478", level: "info" },
  { id: "a3", at: NOW - 0.9 * H, actor: "System", action: "Failed login (3 attempts)", target: "user j.doe", level: "warn" },
  { id: "a4", at: NOW - 1.4 * H, actor: "AI Agent", action: "Escalated SLA breach risk", target: "REQ-02477", level: "critical" },
  { id: "a5", at: NOW - 2.1 * H, actor: "s.patel (Hospital Admin)", action: "Updated role permissions", target: "Operations Staff", level: "warn" },
  { id: "a6", at: NOW - 3.3 * H, actor: "System", action: "Encryption key rotated", target: "data-at-rest", level: "info" },
];

export const trend = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
  day: d, created: [142, 158, 171, 149, 186, 121, 98][i], resolved: [131, 150, 163, 155, 172, 126, 104][i],
}));

export const deptStats: { name: Department; open: number; high: number; avgMin: number; sla: number; load: number }[] = [
  { name: "Facilities", open: 38, high: 9, avgMin: 22, sla: 94.2, load: 82 },
  { name: "IT", open: 44, high: 7, avgMin: 14, sla: 97.1, load: 76 },
  { name: "Housekeeping", open: 29, high: 4, avgMin: 11, sla: 98.4, load: 58 },
  { name: "Security", open: 17, high: 6, avgMin: 6, sla: 99.0, load: 47 },
  { name: "Equipment Maintenance", open: 26, high: 8, avgMin: 31, sla: 91.6, load: 88 },
  { name: "Patient Services", open: 33, high: 5, avgMin: 9, sla: 96.3, load: 64 },
  { name: "Administration", open: 21, high: 1, avgMin: 45, sla: 95.5, load: 39 },
];

export const latency = Array.from({ length: 24 }, (_, i) => ({
  t: `${String(i).padStart(2, "0")}:00`,
  ai: Math.round(820 + 260 * Math.sin(i / 3) + (i % 5) * 30),
  api: Math.round(120 + 40 * Math.cos(i / 4) + (i % 3) * 12),
  errors: +(0.2 + 0.25 * Math.abs(Math.sin(i / 2.5))).toFixed(2),
}));

export function fmtTime(ms: number) {
  const d = new Date(ms);
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${m} ${d.getUTCDate()}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
export function slaRemaining(r: OpsRequest) {
  if (r.status === "Resolved" || r.status === "Closed") return { label: "Met", tone: "ok" as const };
  const left = r.createdAt + r.slaHours * H - NOW;
  if (left < 0) return { label: `Breached ${Math.round(-left / H)}h`, tone: "bad" as const };
  const h = left / H;
  return { label: h < 1 ? `${Math.round(h * 60)}m left` : `${h.toFixed(1)}h left`, tone: h < 2 ? ("warn" as const) : ("ok" as const) };
}
