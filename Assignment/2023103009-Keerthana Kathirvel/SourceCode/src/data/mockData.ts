/** Data layer: seed records standing in for a real database. */
import { analyzeIncident } from "@/agent/triageAgent";
import type { AuditEntry, Incident, Priority, Status } from "@/types/domain";

export const BASE_TIME = Date.parse("2026-10-03T09:00:00Z");
const h = (hoursAgo: number) => new Date(BASE_TIME - hoursAgo * 3600_000).toISOString();

type Seed = [string, string, string, Priority, string, Status, number, string | null, number | null];

const SEEDS: Seed[] = [
  ["Projector failure in CS Lab 3", "The ceiling projector in CS Lab 3 is not working; display flickers then shuts down. Lecture at 11am today needs it.", "Computer Science Block, Lab 3", "Medium", "Ananya Rao", "In Progress", 3, "Rahul Menon", null],
  ["Wi-Fi outage in Hostel B", "Entire Hostel B floor 2-4 has no internet since last night. Students cannot submit assignments on the LMS.", "Hostel B, Floors 2-4", "High", "Karthik S", "Assigned", 6, "Priya Nair", null],
  ["Broken centrifuge in Biotech Lab", "Centrifuge rotor making grinding noise and stopped mid-run. Equipment is broken and samples at risk.", "Life Sciences, Lab 2.14", "High", "Dr. Meera Iyer", "Under Review", 9, null, null],
  ["Security access card failure at Library gate", "Access card readers at the main library gate reject valid student badges. Doors stuck, no access for students.", "Central Library, Main Gate", "High", "Library Desk", "Assigned", 12, "Officer Vikram", null],
  ["Power outage in Admin Block", "Complete power outage across the Admin Block. Generator did not start; lift stuck between floors.", "Admin Block", "Critical", "Facilities Desk", "In Progress", 2, "Suresh Kumar", null],
  ["Classroom ceiling fan broken in Room 204", "Ceiling fan in Room 204 is broken and wobbling dangerously during lectures.", "Academic Block A, Room 204", "Medium", "Prof. Arjun Das", "Resolved", 30, "Maintenance Team 2", 5.5],
  ["Water leak near Chemistry store", "Water leak from ceiling pipe dripping onto chemical store shelves.", "Chemistry Dept, Store Room", "High", "Lab Assistant Joseph", "Resolved", 52, "Maintenance Team 1", 3.2],
  ["Exam timetable clash for CSE Sem 5", "Two exams scheduled at the same time in the published exam timetable for CSE semester 5.", "Examination Cell", "Medium", "Class Rep - CSE 5A", "Closed", 70, "Dr. Lakshmi", 18],
  ["Suspicious person near Girls Hostel", "Unidentified suspicious person loitering near the girls hostel back entrance after 10pm.", "Girls Hostel, Rear Gate", "Critical", "Warden Office", "Resolved", 40, "Officer Vikram", 1.1],
  ["Printer not working in Library", "Library printer shows paper jam error constantly; not working for 2 days.", "Central Library, Level 1", "Low", "Divya P", "Closed", 96, "Rahul Menon", 26],
  ["LMS login failing for students", "Multiple students report login errors on the LMS portal since this morning. Server returns 502.", "Online - LMS Portal", "High", "IT Helpdesk", "Resolved", 20, "Priya Nair", 2.4],
  ["Broken chairs in Seminar Hall", "Around 12 chairs broken in Seminar Hall 1 ahead of next week's conference.", "Seminar Hall 1", "Low", "Events Office", "Assigned", 28, "Maintenance Team 2", null],
  ["Air conditioning failure in Server Room", "HVAC unit in the data center server room failed; temperature rising above 30C.", "IT Building, Server Room", "Critical", "NOC Team", "Resolved", 60, "Suresh Kumar", 2.0],
  ["Stolen laptop from Mechanical Lab", "A department laptop was stolen from Mechanical Lab between 2pm and 4pm.", "Mechanical Dept, Lab 1", "High", "Dr. Ramesh", "Under Review", 15, null, null],
  ["Pest issue in Canteen kitchen", "Pest sightings in canteen kitchen area; requires immediate cleaning and pest control.", "Main Canteen", "Medium", "Canteen Manager", "In Progress", 22, "Maintenance Team 1", null],
  ["Course registration portal down", "Course registration portal is down during the add/drop window.", "Online - ERP", "High", "Academic Office", "Resolved", 84, "Priya Nair", 4.8],
  ["Streetlights not working on Ring Road", "Several streetlights on the campus ring road are not working, area is dark at night.", "Campus Ring Road", "Medium", "Student Council", "New", 1, null, null],
  ["Lift out of service in Library", "The library lift is not working; students with disabilities cannot reach Level 3.", "Central Library", "High", "Accessibility Office", "New", 0.5, null, null],
  ["Smart board unresponsive in Room 112", "Interactive smart board does not respond to touch; software update may be needed.", "Academic Block B, Room 112", "Low", "Prof. Kavya", "Resolved", 110, "Rahul Menon", 7],
  ["CCTV camera offline at Parking Lot 2", "CCTV camera covering parking lot 2 has been offline for two days.", "Parking Lot 2", "Medium", "Security Control", "Assigned", 44, "Officer Vikram", null],
  ["Attendance system not syncing", "Biometric attendance not syncing with ERP for faculty in Science Block.", "Science Block", "Medium", "HR Office", "Closed", 130, "Priya Nair", 12],
  ["Toilet flooding in Hostel A", "Toilet overflow flooding the corridor on Hostel A ground floor.", "Hostel A, Ground Floor", "High", "Hostel Warden", "Resolved", 36, "Maintenance Team 1", 2.7],
  ["Lab equipment calibration overdue", "Oscilloscopes in Electronics Lab need calibration; readings are inconsistent.", "Electronics Lab", "Low", "Lab In-charge", "Under Review", 18, null, null],
  ["Faculty email not receiving messages", "Faculty email accounts in Physics dept are not receiving external email.", "Physics Dept", "Medium", "Dr. Nikhil", "In Progress", 8, "Rahul Menon", null],
];

const ORDER: Status[] = ["New", "Under Review", "Assigned", "In Progress", "Resolved", "Closed"];

export function buildIncident(s: Seed, idx: number): Incident {
  const [title, description, location, severity, reporter, status, hoursAgo, assignee, resolutionHours] = s;
  const analysis = analyzeIncident({ title, description, location, severity });
  const createdAt = h(hoursAgo);
  const reached = ORDER.slice(0, ORDER.indexOf(status) + 1);
  const span = resolutionHours ?? Math.max(hoursAgo * 0.8, 0.3);
  const timeline = reached.map((st, i) => ({
    status: st,
    at: new Date(Date.parse(createdAt) + (span * 3600_000 * i) / Math.max(reached.length - 1, 1)).toISOString(),
    by: i === 0 ? reporter : i === 1 ? "CampusFlow Agent" : assignee ?? "Ops Desk",
  }));
  const approval: Incident["approval"] = analysis.requiresApproval
    ? ORDER.indexOf(status) >= 2 ? "approved" : "pending"
    : "not_required";
  return {
    id: `INC-${String(2400 + idx).padStart(5, "0")}`,
    title, description, location,
    category: analysis.category,
    priority: analysis.priority,
    reportedSeverity: severity,
    department: analysis.department,
    status, createdAt, reporter, assignee, resolutionHours, approval, analysis, timeline,
    activity: [
      { at: createdAt, actor: reporter, message: "Reported incident", kind: "human" },
      { at: createdAt, actor: "CampusFlow Agent", message: `Classified as ${analysis.category} · ${analysis.priority} (${Math.round(analysis.confidence * 100)}% confidence)`, kind: "agent" },
      { at: createdAt, actor: "CampusFlow Agent", message: `Routed to ${analysis.department}`, kind: "agent" },
      ...(approval === "approved" ? [{ at: timeline[2]?.at ?? createdAt, actor: "Neha Kapoor (Dept. Manager)", message: "Approved AI recommendation", kind: "human" as const }] : []),
      ...(assignee ? [{ at: timeline[2]?.at ?? createdAt, actor: "System", message: `Assigned to ${assignee}`, kind: "system" as const }] : []),
    ],
  };
}

export const seedIncidents = (): Incident[] => SEEDS.map(buildIncident);

export const seedAudit = (): AuditEntry[] => [
  ["Neha Kapoor", "Department Manager", "incident.approve", "INC-02402", "success"],
  ["CampusFlow Agent", "Administrator", "agent.route", "INC-02404", "success"],
  ["Karthik S", "Student", "incident.assign", "INC-02401", "denied"],
  ["Admin Console", "Administrator", "role.update", "user:priya.nair", "success"],
  ["Ananya Rao", "Student", "incident.create", "INC-02400", "success"],
  ["Unknown", "Student", "auth.login", "sso", "failure"],
  ["Rahul Menon", "Staff", "incident.status", "INC-02423", "success"],
  ["CampusFlow Agent", "Administrator", "guardrail.block", "INC-02408", "denied"],
  ["Suresh Kumar", "Staff", "incident.resolve", "INC-02412", "success"],
  ["Neha Kapoor", "Department Manager", "export.audit", "audit_log", "success"],
].map(([actor = "", role, action = "", target = "", outcome], i) => ({
  id: `AUD-${9100 + i}`, at: h(i * 1.7 + 0.2), actor, role: role as AuditEntry["role"], action, target,
  outcome: outcome as AuditEntry["outcome"], ip: `10.12.${4 + i}.${20 + i * 7}`,
}));

export const trendData = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(BASE_TIME - (13 - i) * 86400_000);
  const reported = 18 + Math.round(8 * Math.sin(i / 2) + (i % 3) * 3);
  return { day: d.toISOString().slice(5, 10), reported, resolved: Math.max(8, reported - 4 + ((i * 7) % 6) - 2), critical: 1 + (i % 4 === 0 ? 2 : i % 3) };
});

export const monitoringSeries = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  latency: 180 + Math.round(60 * Math.sin(i / 3) + (i % 5) * 9),
  aiMs: 900 + Math.round(240 * Math.cos(i / 4) + (i % 4) * 30),
  volume: 4 + Math.round(10 * Math.abs(Math.sin((i - 6) / 5))) + (i > 8 && i < 18 ? 6 : 0),
  errors: (i % 7 === 0 ? 1.4 : 0.3) + (i % 3) * 0.1,
}));
