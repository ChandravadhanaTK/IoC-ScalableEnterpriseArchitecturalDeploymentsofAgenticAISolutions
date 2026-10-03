import { z } from "zod";
import { getState, mutate } from "@/services/db";
import { defineTool } from "./core";

const id = z.string().min(1).max(40);

// 1. Inventory Tool
export const InventoryTool = {
  getBalance: defineTool(
    "InventoryTool",
    "getBalance",
    z.object({ productId: id, warehouseId: id }),
    ({ productId, warehouseId }) => {
      const rec = getState().inventory.find((r) => r.productId === productId && r.warehouseId === warehouseId);
      if (!rec) throw new Error(`No inventory record for ${productId} @ ${warehouseId}`);
      return { ...rec };
    },
  ),
  addInTransit: defineTool(
    "InventoryTool",
    "addInTransit",
    z.object({ productId: id, warehouseId: id, quantity: z.number().int().positive() }),
    ({ productId, warehouseId, quantity }) => {
      mutate((s) => {
        const rec = s.inventory.find((r) => r.productId === productId && r.warehouseId === warehouseId);
        if (!rec) throw new Error("Inventory record missing");
        rec.inTransit += quantity;
        rec.updatedAt = new Date().toISOString();
      });
      return { ok: true as const };
    },
  ),
};

// 2. Demand History Tool
export const DemandHistoryTool = {
  getVelocity: defineTool(
    "DemandHistoryTool",
    "getVelocity",
    z.object({ productId: id, warehouseId: id }),
    ({ productId, warehouseId }) => {
      const h = getState().demandHistory.find((d) => d.productId === productId && d.warehouseId === warehouseId);
      if (!h) throw new Error(`No demand history for ${productId} @ ${warehouseId}`);
      const avg = (n: number) => h.daily.slice(-n).reduce((a, b) => a + b, 0) / n;
      return { days: h.daily.length, avg30: avg(30), avg60: avg(60), avg90: avg(90) };
    },
  ),
};

// 3. Supplier Tool
export const SupplierTool = {
  listForProduct: defineTool(
    "SupplierTool",
    "listForProduct",
    z.object({ productId: id }),
    ({ productId }) => {
      const s = getState();
      return s.supplierProducts
        .filter((sp) => sp.productId === productId)
        .map((sp) => {
          const sup = s.suppliers.find((x) => x.id === sp.supplierId)!;
          return { ...sup, unitPrice: sp.unitPrice };
        });
    },
  ),
};

// 4. Availability Tool
export const AvailabilityTool = {
  check: defineTool(
    "AvailabilityTool",
    "check",
    z.object({ supplierId: id, quantity: z.number().int().positive() }),
    ({ supplierId, quantity }) => {
      const sup = getState().suppliers.find((x) => x.id === supplierId);
      if (!sup) throw new Error("Unknown supplier");
      return {
        supplierId,
        available: sup.active && sup.capacity >= quantity,
        capacity: sup.capacity,
        leadTimeDays: sup.leadTimeDays,
      };
    },
  ),
};

// 5. Policy Tool
export const PolicyTool = {
  get: defineTool("PolicyTool", "get", z.object({}), () => ({ ...getState().policy })),
};

// 6. Risk Matrix Tool — evaluates facts against the policy rule matrix.
export const RiskMatrixTool = {
  evaluate: defineTool(
    "RiskMatrixTool",
    "evaluate",
    z.object({
      orderValue: z.number().nonnegative(),
      stockoutRisk: z.enum(["LOW", "MEDIUM", "HIGH"]),
      supplierReliability: z.number().min(0).max(100),
      emergency: z.boolean(),
      spendingLimit: z.number().positive(),
      minReliability: z.number().min(0).max(100),
    }),
    (f) => [
      { rule: "ORDER_VALUE_THRESHOLD_EXCEEDED", triggered: f.orderValue > f.spendingLimit,
        evidence: `Order value ($${fmt(f.orderValue)}) ${f.orderValue > f.spendingLimit ? ">" : "≤"} Spending limit ($${fmt(f.spendingLimit)})` },
      { rule: "HIGH_STOCKOUT_RISK", triggered: f.stockoutRisk === "HIGH",
        evidence: `Stockout risk = ${f.stockoutRisk}` },
      { rule: "SUPPLIER_RELIABILITY_BELOW_THRESHOLD", triggered: f.supplierReliability < f.minReliability,
        evidence: `Supplier reliability (${f.supplierReliability}%) ${f.supplierReliability < f.minReliability ? "<" : "≥"} Minimum (${f.minReliability}%)` },
      { rule: "EMERGENCY_FLAG", triggered: f.emergency, evidence: `Emergency flag = ${f.emergency ? "TRUE" : "FALSE"}` },
    ],
  ),
};

export function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
