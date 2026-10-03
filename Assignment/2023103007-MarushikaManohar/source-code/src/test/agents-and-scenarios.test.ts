import { beforeEach, describe, expect, it } from "vitest";
import { getState, replaceWithSeed } from "@/services/db";
import { approveWorkflow, rejectWorkflow, resetSeed, submitReplenishment, testPoIdempotency } from "@/services/actions";
import { runScenario, SCENARIOS } from "@/services/scenarios";
import { authorize } from "@/services/rbac";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForWorkflow(workflowId: string, maxWaitMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const wf = getState().workflows.find((w) => w.id === workflowId);
    if (wf && ["COMPLETED", "AWAITING_APPROVAL", "REJECTED", "ESCALATED", "FAILED"].includes(wf.state)) {
      return wf;
    }
    await sleep(50);
  }
  return getState().workflows.find((w) => w.id === workflowId)!;
}

describe("SupplyChainIQ Deterministic Engine & Scenarios", () => {
  beforeEach(() => {
    replaceWithSeed();
  });

  it("executes Scenario 1: Routine replenishment -> Auto-approved -> PO -> COMPLETED", async () => {
    const wfId = runScenario("S1");
    const wf = await waitForWorkflow(wfId);
    expect(wf).toBeDefined();
    expect(wf?.state).toBe("COMPLETED");
    expect(wf?.poId).toBeDefined();
    expect(wf?.risk?.approvalRequired).toBe(false);

    // Verify PO created
    const po = getState().purchaseOrders.find((p) => p.id === wf?.poId);
    expect(po).toBeDefined();
    expect(po?.status).toBe("ISSUED");
  });

  it("executes Scenario 2: High stockout risk -> AWAITING_APPROVAL -> Manager approves -> COMPLETED", async () => {
    const wfId = runScenario("S2");
    let wf = await waitForWorkflow(wfId);
    expect(wf?.state).toBe("AWAITING_APPROVAL");
    expect(wf?.risk?.approvalRequired).toBe(true);
    expect(wf?.risk?.triggers).toContain("HIGH_STOCKOUT_RISK");

    // Manager Elena Rostova approves
    getState().sessionUserId = "usr_987";
    await approveWorkflow(wfId, "Approved after reviewing regional safety buffer");
    wf = await waitForWorkflow(wfId);
    expect(wf?.state).toBe("COMPLETED");
    expect(wf?.poId).toBeDefined();
  });

  it("executes Scenario 3: Spending limit exceeded -> AWAITING_APPROVAL -> Manager rejects with reason -> REJECTED", async () => {
    const wfId = runScenario("S3");
    let wf = await waitForWorkflow(wfId);
    expect(wf?.state).toBe("AWAITING_APPROVAL");
    expect(wf?.risk?.triggers).toContain("ORDER_VALUE_THRESHOLD_EXCEEDED");

    // Manager Elena Rostova rejects with mandatory reason (>= 10 chars)
    getState().sessionUserId = "usr_987";
    rejectWorkflow(wfId, "Exceeds quarterly budget allocation for central warehouse");

    wf = getState().workflows.find((w) => w.id === wfId);
    expect(wf?.state).toBe("REJECTED");
    expect(wf?.outcomeReason).toContain("Exceeds quarterly budget allocation");
  });

  it("executes Failure A: No suitable supplier -> ESCALATED", async () => {
    const wfId = runScenario("A");
    const wf = await waitForWorkflow(wfId);
    expect(wf?.state).toBe("ESCALATED");
    expect(wf?.outcomeReason).toContain("No suitable supplier satisfies constraints");
  });

  it("executes Failure B: Primary lacks capacity -> auto-fallback to alternative", async () => {
    const wfId = runScenario("B");
    const wf = await waitForWorkflow(wfId);
    expect(wf?.supplier?.fallbackUsed).toBe(true);
    expect(wf?.supplier?.primaryUnavailable).toBeDefined();
  });

  it("executes Failure C: Hard policy violation -> REJECTED at POLICY_CHECK", async () => {
    const wfId = runScenario("C");
    const wf = await waitForWorkflow(wfId);
    expect(wf?.state).toBe("REJECTED");
    expect(wf?.risk?.triggers).toContain("HARD_SPEND_CEILING_EXCEEDED");
  });

  it("executes Scenario 5: Fault injection with retry backoff -> recovers and completes", async () => {
    const wfId = runScenario("S5");
    const wf = await waitForWorkflow(wfId, 10000);
    expect(wf?.retries).toBe(2);
    expect(wf?.state).toBe("COMPLETED");
  });

  it("executes Failure D: Retry exhaustion -> FAILED", async () => {
    const wfId = runScenario("D");
    const wf = await waitForWorkflow(wfId, 10000);
    expect(wf?.state).toBe("FAILED");
    expect(wf?.outcomeReason).toContain("exhausted");
  });

  it("enforces Purchase Order idempotency", async () => {
    const wfId = runScenario("S1");
    const wf = await waitForWorkflow(wfId);
    expect(wf.state).toBe("COMPLETED");
    const initialPoCount = getState().purchaseOrders.length;

    // Sarah Chen (Procurement Officer) replays procurement
    getState().sessionUserId = "usr_455";
    const res = await testPoIdempotency(wfId);
    expect(res.created).toBe(false);
    expect(res.po.id).toBe(wf.poId);
    expect(getState().purchaseOrders.length).toBe(initialPoCount);
  });

  it("enforces RBAC strictly in application logic", () => {
    // Marcus Vance is INVENTORY_OPERATOR
    expect(() => authorize("usr_101", "REVIEW_APPROVE", "APPROVE_WORKFLOW")).toThrow(/lacks permission/);
    expect(() => authorize("usr_101", "EXECUTE_PO", "RECEIVE_PO")).toThrow(/lacks permission/);
    expect(() => authorize("usr_101", "ADMIN_POLICIES", "UPDATE_POLICY")).toThrow(/lacks permission/);

    // Elena Rostova is SUPPLY_CHAIN_MANAGER
    expect(() => authorize("usr_987", "REVIEW_APPROVE", "APPROVE_WORKFLOW")).not.toThrow();
    expect(() => authorize("usr_987", "EXECUTE_PO", "RECEIVE_PO")).toThrow(/lacks permission/);

    // Sarah Chen is PROCUREMENT_OFFICER
    expect(() => authorize("usr_455", "EXECUTE_PO", "RECEIVE_PO")).not.toThrow();
    expect(() => authorize("usr_455", "REVIEW_APPROVE", "APPROVE_WORKFLOW")).toThrow(/lacks permission/);

    // Alex Mercer is ADMINISTRATOR
    expect(() => authorize("usr_001", "ADMIN_POLICIES", "UPDATE_POLICY")).not.toThrow();
    expect(() => authorize("usr_001", "REVIEW_APPROVE", "APPROVE_WORKFLOW")).not.toThrow();
    expect(() => authorize("usr_001", "EXECUTE_PO", "RECEIVE_PO")).not.toThrow();
  });
});
