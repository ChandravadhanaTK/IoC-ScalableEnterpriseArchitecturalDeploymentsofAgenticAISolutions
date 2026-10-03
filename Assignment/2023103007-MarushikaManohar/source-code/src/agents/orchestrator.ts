import { getState, mutate } from "@/services/db";
import { SYSTEM_ACTOR } from "@/services/ledger";
import { transition } from "@/services/workflowEngine";
import { NotificationTool, TelemetryTool, AuditTool } from "@/tools/actionTools";
import { PolicyTool } from "@/tools/dataTools";
import { isTransientToolError } from "./errors";
import type { ToolContext } from "@/tools/core";
import type { AgentName, WorkflowRun } from "@/types";
import { runDemandAgent } from "./demandAgent";
import { runInventoryAgent } from "./inventoryAgent";
import { NoSuitableSupplierError, runSupplierAgent } from "./supplierAgent";
import { runPolicyCheck, runRiskAssessment } from "./riskPolicyAgent";
import { replayProcurement, runProcurementAgent } from "./procurementAgent";

const STAGE_PACING_MS = 220;
const BACKOFF_BASE_MS = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class WorkflowHalted extends Error {
  override name = "WorkflowHalted";
}

const orch = (workflowId: string): ToolContext => ({ actorId: SYSTEM_ACTOR, agent: "OrchestratorAgent", workflowId });
const wfOf = (id: string): WorkflowRun => getState().workflows.find((w) => w.id === id)!;

function recordExecution(
  workflowId: string, agent: AgentName, attempt: number, startedAt: string, durationMs: number,
  status: "SUCCESS" | "FAILED", calls: ToolContext["calls"], input: unknown, output: unknown, evidence: string[], error?: string,
) {
  mutate((s) => {
    s.counters.id += 1;
    s.agentExecutions.push({
      id: `EXE_${s.counters.id}`, workflowId, agent, attempt, startedAt, durationMs: Math.round(durationMs * 100) / 100,
      status, toolCalls: calls ?? [], input, output, evidence, error,
    });
  });
  TelemetryTool.record(orch(workflowId), { source: agent, latencyMs: durationMs, ok: status === "SUCCESS" });
}

/**
 * Executes one agent with structured recording and retry/backoff on transient
 * tool failures. `maxAttempts` re-arms the retry ceiling for workflows resumed
 * after RESET_RETRIES, so a resumed run is not instantly terminal.
 */
async function runAgent<T>(
  workflowId: string, agent: AgentName, input: unknown,
  fn: (ctx: ToolContext) => { output: T; evidence: string[] },
  maxAttempts = 4,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    attempt += 1;
    const ctx: ToolContext = { actorId: SYSTEM_ACTOR, agent, workflowId, calls: [] };
    const startedAt = new Date().toISOString();
    const t0 = performance.now();
    try {
      const { output, evidence } = fn(ctx);
      recordExecution(workflowId, agent, attempt, startedAt, performance.now() - t0, "SUCCESS", ctx.calls, input, output, evidence);
      return output;
    } catch (e) {
      const err = e as Error;
      const evidence = e instanceof NoSuitableSupplierError ? e.evidence : [`${err.name}: ${err.message}`];
      recordExecution(workflowId, agent, attempt, startedAt, performance.now() - t0, "FAILED", ctx.calls, input, null, evidence, err.message);
      if (!isTransientToolError(e)) throw e;

      const limit = PolicyTool.get(orch(workflowId), {}).retryLimit;
      const wf = wfOf(workflowId);
      if (wf.retries >= limit || attempt >= maxAttempts) {
        transition(workflowId, "RETRYING", { actorId: SYSTEM_ACTOR, reason: `${e.tool} failure; retry budget exhausted` });
        transition(workflowId, "FAILED", { actorId: SYSTEM_ACTOR, reason: `Retries exhausted (${wf.retries}/${limit}) after ${e.tool} failure` });
        mutate((s) => { s.workflows.find((w) => w.id === workflowId)!.outcomeReason = `Retry limit ${limit} exhausted: ${err.message}`; });
        NotificationTool.notify(orch(workflowId), {
          kind: "FAILURE", workflowId, message: `${workflowId} FAILED: ${e.tool} retries exhausted`,
          targetRoles: ["ADMINISTRATOR", "SUPPLY_CHAIN_MANAGER"],
        });
        throw new WorkflowHalted();
      }
      const n = wf.retries + 1;
      const delay = BACKOFF_BASE_MS * 2 ** (n - 1);
      transition(workflowId, "RETRYING", { actorId: SYSTEM_ACTOR, reason: `${err.message}; retry ${n}/${limit} after ${delay}ms backoff` });
      mutate((s) => { s.workflows.find((w) => w.id === workflowId)!.retries = n; });
      await sleep(delay);
      transition(workflowId, wfOf(workflowId).resumeState!, { actorId: SYSTEM_ACTOR, reason: `Resuming after backoff (attempt ${attempt + 1})` });
    }
  }
}

function saveOutputs(id: string, patch: Partial<WorkflowRun>) {
  mutate((s) => Object.assign(s.workflows.find((w) => w.id === id)!, patch));
}

/** Full pipeline: CREATED → … → COMPLETED / AWAITING_APPROVAL / ESCALATED / REJECTED / FAILED. */
export async function executeWorkflow(workflowId: string): Promise<void> {
  try {
    const sys = { actorId: SYSTEM_ACTOR };
    const policy = PolicyTool.get(orch(workflowId), {});
    const product = getState().products.find((p) => p.id === wfOf(workflowId).productId)!;

    transition(workflowId, "ANALYZING", { ...sys, reason: "Dispatching Demand, Inventory and Supplier agents" });
    await sleep(STAGE_PACING_MS);
    const wf = wfOf(workflowId);

    const demand = await runAgent(workflowId, "DemandAgent", { productId: wf.productId, warehouseId: wf.warehouseId }, (ctx) =>
      runDemandAgent(ctx, {
        productId: wf.productId, warehouseId: wf.warehouseId, category: product.category,
        seasonalFactors: policy.seasonalFactors, horizonDays: policy.planningHorizonDays,
      }),
    );
    saveOutputs(workflowId, { demand });
    await sleep(STAGE_PACING_MS);

    const inventory = await runAgent(workflowId, "InventoryAgent", { expectedDemand: demand.expectedDemand }, (ctx) =>
      runInventoryAgent(ctx, { productId: wf.productId, warehouseId: wf.warehouseId, expectedDemand: demand.expectedDemand }),
    );
    saveOutputs(workflowId, { inventory });
    await sleep(STAGE_PACING_MS);

    let supplier;
    try {
      supplier = await runAgent(workflowId, "SupplierAgent", { productId: wf.productId, quantity: wf.quantity }, (ctx) =>
        runSupplierAgent(ctx, { productId: wf.productId, quantity: wf.quantity, weights: policy.weights }),
      );
    } catch (e) {
      if (!(e instanceof NoSuitableSupplierError)) throw e;
      saveOutputs(workflowId, { supplier: e.partial, outcomeReason: e.message });
      transition(workflowId, "ESCALATED", { ...sys, reason: `NO_SUITABLE_SUPPLIER: ${e.message}` });
      NotificationTool.notify(orch(workflowId), {
        kind: "ESCALATION", workflowId, message: `${workflowId} escalated: ${e.message}`,
        targetRoles: ["SUPPLY_CHAIN_MANAGER", "ADMINISTRATOR"],
      });
      return;
    }
    saveOutputs(workflowId, { supplier });
    const sel = supplier.selected!;
    const orderValue = Math.round(wf.quantity * sel.unitPrice * 100) / 100;

    transition(workflowId, "POLICY_CHECK", { ...sys, reason: "Evaluating hard policy limits" });
    await sleep(STAGE_PACING_MS);
    const pc = await runAgent(workflowId, "RiskAndPolicyAgent", { orderValue }, (ctx) => runPolicyCheck(ctx, { orderValue }));
    if (pc.hardViolation) {
      saveOutputs(workflowId, {
        risk: { orderValue, approvalRequired: false, triggers: [pc.hardViolation], hardViolation: pc.hardViolation },
        outcomeReason: `Policy violation: order value $${orderValue.toLocaleString()} exceeds hard ceiling $${pc.hardSpendCeiling.toLocaleString()}`,
      });
      transition(workflowId, "REJECTED", { ...sys, reason: `POLICY_VIOLATION: ${pc.hardViolation}` });
      AuditTool.record(orch(workflowId), {
        action: "POLICY_VIOLATION_BLOCKED", result: "DENIED", severity: "CRITICAL",
        details: { orderValue, hardSpendCeiling: pc.hardSpendCeiling, rule: pc.hardViolation },
      });
      NotificationTool.notify(orch(workflowId), {
        kind: "ESCALATION", workflowId, message: `${workflowId} blocked by hard policy limit`,
        targetRoles: ["SUPPLY_CHAIN_MANAGER", "ADMINISTRATOR"],
      });
      return;
    }

    transition(workflowId, "RISK_ASSESSMENT", { ...sys, reason: "Evaluating HITL trigger rules" });
    await sleep(STAGE_PACING_MS);
    const riskInput = { orderValue, stockoutRisk: inventory.risk, supplierReliability: sel.reliability, emergency: wf.emergency };
    const risk = await runAgent(workflowId, "RiskAndPolicyAgent", riskInput, (ctx) => runRiskAssessment(ctx, riskInput));
    saveOutputs(workflowId, { risk });

    transition(workflowId, "RECOMMENDATION_READY", {
      ...sys, reason: `Recommend ${wf.quantity} units from ${sel.supplierName} ($${orderValue.toLocaleString()})`,
    });
    await sleep(STAGE_PACING_MS);

    if (risk.approvalRequired) {
      transition(workflowId, "AWAITING_APPROVAL", { ...sys, reason: `HITL triggers: ${risk.triggers.join(", ")}` });
      NotificationTool.notify(orch(workflowId), {
        kind: "APPROVAL_REQUIRED", workflowId,
        message: `${workflowId} needs approval: ${risk.triggers.join(", ")}`,
        targetRoles: ["SUPPLY_CHAIN_MANAGER", "ADMINISTRATOR"],
      });
      return;
    }

    mutate((s) => {
      s.counters.id += 1;
      s.approvals.push({
        id: `APR_${s.counters.id}`, workflowId, decision: "AUTO_APPROVED", decidedBy: SYSTEM_ACTOR,
        role: "SYSTEM", reason: "All policy and risk rules passed", at: new Date().toISOString(),
      });
    });
    transition(workflowId, "APPROVED", { ...sys, reason: "Auto-approval criteria passed" });
    await procure(workflowId);
  } catch (e) {
    if (e instanceof WorkflowHalted) return;
    const wf = wfOf(workflowId);
    if (wf && !["COMPLETED", "REJECTED", "FAILED"].includes(wf.state)) {
      mutate((s) => { s.workflows.find((w) => w.id === workflowId)!.outcomeReason = (e as Error).message; });
      try {
        transition(workflowId, "FAILED", { actorId: SYSTEM_ACTOR, reason: `Unhandled error: ${(e as Error).message}` });
      } catch {
        /* state does not allow FAILED; leave as-is, error is audited */
      }
    }
  }
}

/** Post-approval: Procurement Agent → PO → COMPLETED. */
export async function procure(workflowId: string): Promise<void> {
  try {
    await sleep(STAGE_PACING_MS);
    const res = await runAgent(workflowId, "ProcurementAgent", { workflowId }, (ctx) => runProcurementAgent(ctx));
    saveOutputs(workflowId, { poId: res.po.id });
    await sleep(STAGE_PACING_MS);
    transition(workflowId, "COMPLETED", { actorId: SYSTEM_ACTOR, reason: `Workflow closed with ${res.po.id}` });
  } catch (e) {
    if (!(e instanceof WorkflowHalted)) throw e;
  }
}

export async function replayProcurementForIdempotency(workflowId: string) {
  return runAgent(workflowId, "ProcurementAgent", { workflowId, replay: true }, (ctx) => replayProcurement(ctx));
}
