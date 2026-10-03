import { getState } from "./db";
import { authorize } from "./rbac";
import { submitReplenishment, type ReplenishmentInput } from "./actions";
import type { FaultInjection } from "@/types";

export interface Scenario {
  id: string;
  title: string;
  expected: string;
  failureMode?: string;
  input: Omit<ReplenishmentInput, "preferredDate">;
  fault?: FaultInjection;
}

export const SCENARIOS: Scenario[] = [
  { id: "S1", title: "Routine replenishment", expected: "LOW risk → auto-approved → PO → COMPLETED",
    input: { productId: "P01", warehouseId: "W01", quantity: 500, emergency: false, notes: "Scenario 1: routine" } },
  { id: "S2", title: "High stockout risk", expected: "Projected < safety → AWAITING_APPROVAL → manager decides",
    input: { productId: "P02", warehouseId: "W02", quantity: 400, emergency: false, notes: "Scenario 2: high risk" } },
  { id: "S3", title: "Spending limit exceeded", expected: "Order value > limit → AWAITING_APPROVAL → manager rejects",
    input: { productId: "P03", warehouseId: "W01", quantity: 100, emergency: false, notes: "Scenario 3: policy flag" } },
  { id: "S4", title: "Low supplier reliability", expected: "Only supplier at 78% < 85% → approval required",
    input: { productId: "P04", warehouseId: "W03", quantity: 600, emergency: false, notes: "Scenario 4: supplier issue" } },
  { id: "S5", title: "Tool timeout, recovered", failureMode: "D", expected: "InventoryTool fails ×2 → RETRYING with backoff → COMPLETED",
    input: { productId: "P05", warehouseId: "W01", quantity: 40, emergency: false, notes: "Scenario 5: fault injection" },
    fault: { tool: "InventoryTool", remainingFailures: 2 } },
  { id: "A", title: "No suitable supplier", failureMode: "A", expected: "Only supplier blacklisted → ESCALATED",
    input: { productId: "P10", warehouseId: "W04", quantity: 10, emergency: false, notes: "Failure A" } },
  { id: "B", title: "Primary supplier lacks capacity", failureMode: "B", expected: "Top-scored supplier capacity 300 < 350 → alternative selected",
    input: { productId: "P06", warehouseId: "W02", quantity: 350, emergency: false, notes: "Failure B" } },
  { id: "C", title: "Hard policy violation", failureMode: "C", expected: "Order > hard ceiling → POLICY_CHECK → REJECTED",
    input: { productId: "P07", warehouseId: "W01", quantity: 150, emergency: false, notes: "Failure C" } },
  { id: "D", title: "Retry exhaustion", failureMode: "D", expected: "SupplierTool fails ×4 → retries exhausted → FAILED",
    input: { productId: "P01", warehouseId: "W02", quantity: 200, emergency: false, notes: "Failure D (exhaustion)" },
    fault: { tool: "SupplierTool", remainingFailures: 4 } },
  { id: "EMG", title: "Emergency order", expected: "Emergency flag → approval required",
    input: { productId: "P09", warehouseId: "W05", quantity: 120, emergency: true, notes: "Emergency" } },
];

export function runScenario(id: string): string {
  const actorId = getState().sessionUserId;
  authorize(actorId, "ADMIN_POLICIES", "RUN_SIMULATION_SCENARIO");
  const sc = SCENARIOS.find((s) => s.id === id);
  if (!sc) throw new Error("Unknown scenario");
  return submitReplenishment({ ...sc.input, preferredDate: "2026-10-20" }, { scenario: `${sc.id} · ${sc.title}`, fault: sc.fault });
}
