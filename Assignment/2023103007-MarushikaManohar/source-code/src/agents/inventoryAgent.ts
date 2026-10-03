import { InventoryTool } from "@/tools/dataTools";
import type { ToolContext } from "@/tools/core";
import type { InventoryOutput } from "@/types";
import { projectedStock, stockoutRisk } from "./formulas";

/** Projected Stock = Current Inventory − Expected Demand + In-Transit. */
export function runInventoryAgent(
  ctx: ToolContext,
  input: { productId: string; warehouseId: string; expectedDemand: number },
): { output: InventoryOutput; evidence: string[] } {
  const rec = InventoryTool.getBalance(ctx, { productId: input.productId, warehouseId: input.warehouseId });
  const projected = projectedStock(rec.onHand, input.expectedDemand, rec.inTransit);
  const risk = stockoutRisk(projected, rec.safetyStock);
  const cmp =
    risk === "HIGH"
      ? `Projected stock (${projected}) < Safety stock (${rec.safetyStock})`
      : risk === "MEDIUM"
        ? `Safety stock (${rec.safetyStock}) ≤ Projected stock (${projected}) < 1.5 × Safety (${rec.safetyStock * 1.5})`
        : `Projected stock (${projected}) ≥ 1.5 × Safety stock (${rec.safetyStock * 1.5})`;
  return {
    output: {
      onHand: rec.onHand,
      inTransit: rec.inTransit,
      safetyStock: rec.safetyStock,
      expectedDemand: input.expectedDemand,
      projectedStock: projected,
      risk,
    },
    evidence: [
      `Projected = ${rec.onHand} − ${input.expectedDemand} + ${rec.inTransit} = ${projected}`,
      `${cmp} → risk ${risk}`,
    ],
  };
}
