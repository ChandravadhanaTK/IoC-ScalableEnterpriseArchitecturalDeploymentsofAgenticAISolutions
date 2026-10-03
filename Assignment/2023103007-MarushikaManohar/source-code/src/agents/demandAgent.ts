import { DemandHistoryTool } from "@/tools/dataTools";
import type { ToolContext } from "@/tools/core";
import type { DemandOutput } from "@/types";
import { demandTrend, expectedDemand, round1 } from "./formulas";

export interface DemandInput {
  productId: string;
  warehouseId: string;
  seasonalFactors: Record<string, number>;
  horizonDays: number;
  category: string;
}

/** Expected Demand = MovingAverage(30d daily) × horizon × Seasonal Factor. */
export function runDemandAgent(ctx: ToolContext, input: DemandInput): { output: DemandOutput; evidence: string[] } {
  const v = DemandHistoryTool.getVelocity(ctx, { productId: input.productId, warehouseId: input.warehouseId });
  const sf = input.seasonalFactors[input.category] ?? 1;
  const expected = expectedDemand(v.avg30, sf, input.horizonDays);
  const trend = demandTrend(v.avg30, v.avg90);
  const output: DemandOutput = {
    ma30: round1(v.avg30),
    ma60: round1(v.avg60),
    ma90: round1(v.avg90),
    seasonalFactor: sf,
    horizonDays: input.horizonDays,
    expectedDemand: expected,
    trend,
  };
  return {
    output,
    evidence: [
      `MA30 = ${output.ma30}/day, MA60 = ${output.ma60}/day, MA90 = ${output.ma90}/day`,
      `Expected demand = ${output.ma30} × ${input.horizonDays}d × ${sf} (${input.category}) = ${expected}`,
      `Trend = ${trend} (MA30 vs MA90 Δ ${round1(((v.avg30 - v.avg90) / (v.avg90 || 1)) * 100)}%)`,
    ],
  };
}
