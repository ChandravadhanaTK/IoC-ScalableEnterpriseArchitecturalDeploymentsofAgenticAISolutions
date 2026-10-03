import type { RiskLevel, Trend } from "@/types";

// Pure, deterministic decision formulas shared by agents and read-only views.
export const round1 = (n: number) => Math.round(n * 10) / 10;

export function expectedDemand(ma30Daily: number, seasonalFactor: number, horizonDays: number): number {
  return Math.round(ma30Daily * horizonDays * seasonalFactor);
}

export function demandTrend(ma30: number, ma90: number): Trend {
  if (ma90 === 0) return "STABLE";
  const delta = (ma30 - ma90) / ma90;
  if (delta > 0.05) return "UP";
  if (delta < -0.05) return "DOWN";
  return "STABLE";
}

export function projectedStock(onHand: number, expected: number, inTransit: number): number {
  return onHand - expected + inTransit;
}

export function stockoutRisk(projected: number, safety: number): RiskLevel {
  if (projected < safety) return "HIGH";
  if (projected < safety * 1.5) return "MEDIUM";
  return "LOW";
}
