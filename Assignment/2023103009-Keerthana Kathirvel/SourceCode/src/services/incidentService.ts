/**
 * Service / API layer. All UI data access goes through here.
 * Swap the in-memory store for fetch() calls / server functions when a backend exists;
 * secrets (LLM keys, DB creds) must live server-side only — never in this file.
 */
import { z } from "zod";
import { analyzeIncident } from "@/agent/triageAgent";
import { seedAudit, seedIncidents } from "@/data/mockData";
import { CATEGORIES, PRIORITIES, type AuditEntry, type Incident, type NewIncidentInput, type Role, type Status } from "@/types/domain";

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

let incidents: Incident[] = seedIncidents();
let audit: AuditEntry[] = seedAudit();
let counter = 2400 + incidents.length;

export const newIncidentSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().trim().min(20, "Please describe the issue in at least 20 characters").max(2000),
  location: z.string().trim().min(2, "Location is required").max(120),
  category: z.enum(CATEGORIES),
  severity: z.enum(PRIORITIES),
  reporter: z.string().trim().min(2, "Reporter name is required").max(80),
  attachmentName: z.string().max(200).optional(),
});

export interface Actor { name: string; role: Role }

export function recordAudit(actor: Actor, action: string, target: string, outcome: AuditEntry["outcome"] = "success") {
  audit = [{ id: `AUD-${9200 + audit.length}`, at: new Date().toISOString(), actor: actor.name, role: actor.role, action, target, outcome, ip: "10.12.0.14" }, ...audit];
}

export const incidentService = {
  async list(): Promise<Incident[]> {
    await delay();
    return [...incidents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async get(id: string): Promise<Incident | null> {
    await delay(300);
    return incidents.find((i) => i.id === id) ?? null;
  },
  async create(raw: NewIncidentInput, actor: Actor): Promise<Incident> {
    const input = newIncidentSchema.parse(raw);
    await delay(900);
    const analysis = analyzeIncident(input);
    const now = new Date().toISOString();
    const inc: Incident = {
      id: `INC-${String(counter++).padStart(5, "0")}`,
      ...input,
      category: analysis.category,
      priority: analysis.priority,
      reportedSeverity: input.severity,
      department: analysis.department,
      status: "New",
      createdAt: now,
      assignee: null,
      resolutionHours: null,
      approval: analysis.requiresApproval ? "pending" : "not_required",
      analysis,
      timeline: [{ status: "New", at: now, by: input.reporter }],
      activity: [
        { at: now, actor: input.reporter, message: "Reported incident", kind: "human" },
        { at: now, actor: "CampusFlow Agent", message: `Classified as ${analysis.category} · ${analysis.priority}`, kind: "agent" },
      ],
    };
    incidents = [inc, ...incidents];
    recordAudit(actor, "incident.create", inc.id);
    return inc;
  },
  async updateStatus(id: string, status: Status, actor: Actor): Promise<Incident> {
    await delay(400);
    const inc = incidents.find((i) => i.id === id);
    if (!inc) throw new Error("Incident not found");
    const now = new Date().toISOString();
    Object.assign(inc, {
      status,
      timeline: [...inc.timeline, { status, at: now, by: actor.name }],
      activity: [...inc.activity, { at: now, actor: actor.name, message: `Changed status to ${status}`, kind: "human" }],
    });
    recordAudit(actor, "incident.status", id);
    return { ...inc };
  },
  async decideApproval(id: string, approve: boolean, actor: Actor): Promise<Incident> {
    await delay(500);
    const inc = incidents.find((i) => i.id === id);
    if (!inc) throw new Error("Incident not found");
    const now = new Date().toISOString();
    inc.approval = approve ? "approved" : "rejected";
    inc.activity = [...inc.activity, { at: now, actor: `${actor.name} (${actor.role})`, message: approve ? "Approved AI recommendation" : "Rejected AI recommendation — manual triage", kind: "human" }];
    if (approve && inc.status === "New") {
      inc.status = "Assigned";
      inc.timeline = [...inc.timeline, { status: "Assigned", at: now, by: actor.name }];
    }
    recordAudit(actor, approve ? "incident.approve" : "incident.reject", id);
    return { ...inc };
  },
  async listAudit(): Promise<AuditEntry[]> {
    await delay(300);
    return audit;
  },
};
