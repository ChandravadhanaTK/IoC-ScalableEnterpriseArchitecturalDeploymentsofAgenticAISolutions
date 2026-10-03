import { z } from "zod";
import { getState, mutate, replaceWithSeed, transaction } from "./db";
import { appendAudit, appendNotification, SYSTEM_ACTOR } from "./ledger";
import { authorize } from "./rbac";
import { transition } from "./workflowEngine";
import { executeWorkflow, procure, replayProcurementForIdempotency } from "@/agents/orchestrator";
import { markPoReceived } from "@/tools/actionTools";
import type { FaultInjection, Policy } from "@/types";

export const replenishmentSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  quantity: z.number({ invalid_type_error: "Enter a quantity" }).int().positive().max(100000),
  emergency: z.boolean(),
  preferredDate: z.string().min(1, "Choose a date"),
  notes: z.string().max(500),
});
export type ReplenishmentInput = z.infer<typeof replenishmentSchema>;

function currentActor(): string {
  return getState().sessionUserId;
}

export function switchPersona(userId: string): void {
  const user = getState().users.find((u) => u.id === userId);
  if (!user) throw new Error("Unknown user");
  mutate((s) => { s.sessionUserId = userId; });
  appendAudit({ userId, action: "SESSION_PERSONA_SWITCH", result: "SUCCESS", severity: "INFO", details: { name: user.name } });
}

/** Creates a replenishment request + workflow, then starts the orchestrator. */
export function submitReplenishment(
  raw: ReplenishmentInput,
  opts: { scenario?: string; fault?: FaultInjection } = {},
): string {
  const actorId = currentActor();
  authorize(actorId, "REQUEST_REPLENISHMENT", "SUBMIT_REPLENISHMENT");
  const input = replenishmentSchema.parse(raw);
  const s = getState();
  if (!s.inventory.some((r) => r.productId === input.productId && r.warehouseId === input.warehouseId)) {
    throw new Error("No inventory record exists for that product at that warehouse");
  }
  let workflowId = "";
  transaction(() => {
    mutate((st) => {
      st.counters.workflow += 1;
      workflowId = `WF-${st.counters.workflow}`;
      const now = new Date().toISOString();
      const requestId = `REQ-${st.counters.workflow}`;
      st.requests.push({ id: requestId, ...input, requestedBy: actorId, createdAt: now, workflowId });
      st.workflows.push({
        id: workflowId, requestId, ...input, requestedBy: actorId, scenario: opts.scenario,
        state: "CREATED", history: [{ from: null, to: "CREATED", at: now, actorId, role: getState().users.find((u) => u.id === actorId)!.role, reason: "Replenishment request submitted" }],
        retries: 0, createdAt: now, updatedAt: now, fault: opts.fault,
      });
    });
    appendAudit({
      userId: actorId, workflowId, action: "REPLENISHMENT_REQUESTED", toState: "CREATED", result: "SUCCESS", severity: "INFO",
      details: { ...input, scenario: opts.scenario ?? null, faultInjection: opts.fault ?? null },
    });
  });
  void executeWorkflow(workflowId);
  return workflowId;
}

export async function approveWorkflow(workflowId: string, comment: string): Promise<void> {
  const actorId = currentActor();
  const user = authorize(actorId, "REVIEW_APPROVE", "APPROVE_WORKFLOW", workflowId);
  const wf = getState().workflows.find((w) => w.id === workflowId);
  if (!wf || !["AWAITING_APPROVAL", "ESCALATED"].includes(wf.state)) throw new Error("Workflow is not awaiting a decision");
  if (!wf.supplier?.selected) throw new Error("Cannot approve: no supplier recommendation exists (escalate to sourcing)");
  // Atomic: approval record + state transition + audit event.
  transaction(() => {
    mutate((s) => {
      s.counters.id += 1;
      s.approvals.push({
        id: `APR_${s.counters.id}`, workflowId, decision: "APPROVED", decidedBy: actorId, role: user.role,
        reason: comment || "Approved", at: new Date().toISOString(),
      });
    });
    transition(workflowId, "APPROVED", { actorId, reason: `Approved by ${user.name}${comment ? `: ${comment}` : ""}` });
    appendAudit({
      userId: actorId, workflowId, action: "APPROVAL_DECISION", result: "SUCCESS", severity: "INFO",
      details: { decision: "APPROVED", triggers: wf.risk?.triggers ?? [], comment },
    });
  });
  await procure(workflowId);
}

export const rejectionSchema = z.string().trim().min(10, "A rejection reason of at least 10 characters is required").max(500);

export function rejectWorkflow(workflowId: string, reason: string): void {
  const actorId = currentActor();
  const user = authorize(actorId, "REVIEW_APPROVE", "REJECT_WORKFLOW", workflowId);
  const r = rejectionSchema.parse(reason);
  const wf = getState().workflows.find((w) => w.id === workflowId);
  if (!wf || !["AWAITING_APPROVAL", "ESCALATED"].includes(wf.state)) throw new Error("Workflow is not awaiting a decision");
  transaction(() => {
    mutate((s) => {
      s.counters.id += 1;
      s.approvals.push({ id: `APR_${s.counters.id}`, workflowId, decision: "REJECTED", decidedBy: actorId, role: user.role, reason: r, at: new Date().toISOString() });
      s.workflows.find((w) => w.id === workflowId)!.outcomeReason = `Rejected by ${user.name}: ${r}`;
    });
    transition(workflowId, "REJECTED", { actorId, reason: r });
    appendAudit({
      userId: actorId, workflowId, action: "APPROVAL_DECISION", result: "SUCCESS", severity: "WARN",
      details: { decision: "REJECTED", reason: r, triggers: wf.risk?.triggers ?? [] },
    });
  });
}

/** Failure E: pending approvals past SLA are escalated. Runs on an interval. */
export function sweepApprovalSla(now = Date.now()): number {
  const { workflows, policy } = getState();
  let count = 0;
  for (const wf of workflows) {
    if (wf.state !== "AWAITING_APPROVAL" || !wf.awaitingSince) continue;
    const ageMin = (now - Date.parse(wf.awaitingSince)) / 60000;
    if (ageMin <= policy.approvalSlaMinutes) continue;
    transition(wf.id, "ESCALATED", { actorId: SYSTEM_ACTOR, reason: `APPROVAL_SLA_TIMEOUT: pending ${ageMin.toFixed(1)} min > SLA ${policy.approvalSlaMinutes} min` });
    mutate((s) => { s.workflows.find((w) => w.id === wf.id)!.outcomeReason = `Approval SLA (${policy.approvalSlaMinutes} min) exceeded`; });
    appendAudit({ userId: SYSTEM_ACTOR, workflowId: wf.id, action: "APPROVAL_SLA_TIMEOUT", result: "FAILURE", severity: "WARN", details: { ageMinutes: Number(ageMin.toFixed(1)), slaMinutes: policy.approvalSlaMinutes } });
    appendNotification({ kind: "ESCALATION", workflowId: wf.id, message: `${wf.id} escalated: approval SLA exceeded`, targetRoles: ["ADMINISTRATOR", "SUPPLY_CHAIN_MANAGER"] });
    count++;
  }
  return count;
}

export const policySchema = z
  .object({
    spendingLimit: z.number().positive().max(10_000_000),
    hardSpendCeiling: z.number().positive().max(100_000_000),
    minReliability: z.number().min(0).max(100),
    retryLimit: z.number().int().min(0).max(10),
    approvalSlaMinutes: z.number().min(0.5).max(10080),
    planningHorizonDays: z.number().int().min(1).max(90),
    weights: z.object({ price: z.number().min(0).max(1), lead: z.number().min(0).max(1), reliability: z.number().min(0).max(1) }),
  })
  .refine((p) => Math.abs(p.weights.price + p.weights.lead + p.weights.reliability - 1) < 0.001, { message: "Supplier weights must sum to 1" })
  .refine((p) => p.hardSpendCeiling > p.spendingLimit, { message: "Hard ceiling must exceed the spending limit" });

export function updatePolicy(patch: z.infer<typeof policySchema>): void {
  const actorId = currentActor();
  authorize(actorId, "ADMIN_POLICIES", "UPDATE_POLICY");
  const p = policySchema.parse(patch);
  const before = getState().policy;
  mutate((s) => { s.policy = { ...s.policy, ...p, updatedAt: new Date().toISOString(), updatedBy: actorId } as Policy; });
  appendAudit({ userId: actorId, action: "POLICY_UPDATED", result: "SUCCESS", severity: "WARN", details: { before: { ...before, seasonalFactors: undefined }, after: p } });
}

export function resetSeed(): void {
  const actorId = currentActor();
  authorize(actorId, "ADMIN_POLICIES", "RESET_SEED_DATA");
  replaceWithSeed();
  mutate((s) => { s.sessionUserId = actorId; });
  appendAudit({ userId: actorId, action: "SEED_DATA_RESET", result: "SUCCESS", severity: "CRITICAL", details: { note: "All operational data reset to deterministic seed" } });
}

export function receivePurchaseOrder(poId: string): void {
  const actorId = currentActor();
  authorize(actorId, "EXECUTE_PO", "RECEIVE_PURCHASE_ORDER");
  markPoReceived(poId, actorId);
  const po = getState().purchaseOrders.find((p) => p.id === poId)!;
  appendAudit({ userId: actorId, workflowId: po.workflowId, action: "PURCHASE_ORDER_RECEIVED", result: "SUCCESS", severity: "INFO", details: { poId, quantity: po.quantity } });
}

export async function testPoIdempotency(workflowId: string) {
  const actorId = currentActor();
  authorize(actorId, "EXECUTE_PO", "REPLAY_PROCUREMENT", workflowId);
  return replayProcurementForIdempotency(workflowId);
}

export function markNotificationsRead(): void {
  const role = getState().users.find((u) => u.id === currentActor())?.role;
  mutate((s) => s.notifications.forEach((n) => { if (role && n.targetRoles.includes(role)) n.read = true; }));
}
