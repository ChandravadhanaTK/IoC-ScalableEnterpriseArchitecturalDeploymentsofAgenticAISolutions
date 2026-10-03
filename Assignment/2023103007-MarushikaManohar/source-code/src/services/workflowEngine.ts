import { getState, mutate } from "./db";
import { appendAudit, roleOf } from "./ledger";
import type { WorkflowRun, WorkflowState } from "@/types";

export const ALLOWED_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  CREATED: ["ANALYZING", "FAILED"],
  ANALYZING: ["POLICY_CHECK", "RETRYING", "ESCALATED", "FAILED"],
  POLICY_CHECK: ["RISK_ASSESSMENT", "RETRYING", "ESCALATED", "REJECTED", "FAILED"],
  RISK_ASSESSMENT: ["RECOMMENDATION_READY", "RETRYING", "FAILED"],
  RECOMMENDATION_READY: ["APPROVED", "AWAITING_APPROVAL"],
  AWAITING_APPROVAL: ["APPROVED", "REJECTED", "ESCALATED"],
  ESCALATED: ["APPROVED", "REJECTED"],
  APPROVED: ["PURCHASE_ORDER_CREATED", "RETRYING", "FAILED"],
  PURCHASE_ORDER_CREATED: ["COMPLETED"],
  RETRYING: ["ANALYZING", "POLICY_CHECK", "RISK_ASSESSMENT", "APPROVED", "FAILED"],
  COMPLETED: [],
  REJECTED: [],
  FAILED: [],
};

export const TERMINAL_STATES: WorkflowState[] = ["COMPLETED", "REJECTED", "FAILED"];

export class InvalidTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransitionError";
  }
}

export function canTransition(wf: WorkflowRun, to: WorkflowState): boolean {
  if (!ALLOWED_TRANSITIONS[wf.state].includes(to)) return false;
  if (wf.state === "RETRYING" && to !== "FAILED" && to !== wf.resumeState) return false;
  return true;
}

/** The only function allowed to change a workflow's state. */
export function transition(
  workflowId: string,
  to: WorkflowState,
  opts: { actorId: string; reason: string },
): void {
  const wf = getState().workflows.find((w) => w.id === workflowId);
  if (!wf) throw new InvalidTransitionError(`Workflow ${workflowId} not found`);
  const from = wf.state;
  if (!canTransition(wf, to)) {
    appendAudit({
      userId: opts.actorId,
      workflowId,
      agent: "OrchestratorAgent",
      action: "STATE_TRANSITION_REJECTED",
      fromState: from,
      toState: to,
      result: "FAILURE",
      severity: "CRITICAL",
      details: { reason: `Transition ${from} → ${to} is not in the allowed graph` },
    });
    throw new InvalidTransitionError(`Illegal transition ${from} → ${to}`);
  }
  const at = new Date().toISOString();
  mutate((s) => {
    const w = s.workflows.find((x) => x.id === workflowId)!;
    if (to === "RETRYING") w.resumeState = from;
    if (from === "RETRYING") w.resumeState = undefined;
    if (to === "AWAITING_APPROVAL") w.awaitingSince = at;
    w.state = to;
    w.updatedAt = at;
    w.history.push({ from, to, at, actorId: opts.actorId, role: roleOf(opts.actorId), reason: opts.reason });
  });
  appendAudit({
    userId: opts.actorId,
    workflowId,
    agent: "OrchestratorAgent",
    action: "STATE_TRANSITION",
    fromState: from,
    toState: to,
    result: "SUCCESS",
    severity: to === "FAILED" || to === "ESCALATED" || to === "REJECTED" ? "WARN" : "INFO",
    details: { reason: opts.reason },
  });
}
