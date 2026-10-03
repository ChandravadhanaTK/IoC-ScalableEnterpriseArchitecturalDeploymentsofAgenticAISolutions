// Deterministic simulation: the AI only proposes assumptions; numbers are computed here.
import type { SimulationParams } from "./agent/types";

export interface SimRow { period: number; adoptionPct: number; value: number; change: number }

export function runSimulation(p: SimulationParams): SimRow[] {
  const periods = Math.min(12, Math.max(1, Math.round(p.periods)));
  const improvement = Math.min(100, Math.max(0, p.improvement_pct)) / 100;
  const step = Math.min(100, Math.max(0, p.adoption_step_pct));
  const sign = p.direction === "increase" ? 1 : -1;
  const rows: SimRow[] = [];
  for (let t = 1; t <= periods; t++) {
    const adoptionPct = Math.min(100, step * t);
    const value = p.baseline * (1 + sign * improvement * (adoptionPct / 100));
    rows.push({ period: t, adoptionPct, value: round(value), change: round(value - p.baseline) });
  }
  return rows;
}

const round = (n: number) => Math.round(n * 100) / 100;
