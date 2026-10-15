import { describe, expect, it } from "vitest";
import { runSimulation } from "./simulation";
import type { SimulationParams } from "./agent/types";

const base: SimulationParams = {
  applicable: true, reason: "", title: "", metric_name: "", unit: "min", baseline: 100,
  direction: "decrease", improvement_pct: 20, adoption_step_pct: 50, periods: 3, period_label: "month", assumptions: [],
};

describe("runSimulation", () => {
  it("applies improvement scaled by adoption and caps adoption at 100%", () => {
    const rows = runSimulation(base);
    expect(rows.map((r) => r.value)).toEqual([90, 80, 80]);
    expect(rows[2].adoptionPct).toBe(100);
  });
  it("increases the metric when direction is increase", () => {
    expect(runSimulation({ ...base, direction: "increase", periods: 1 })[0].value).toBe(110);
  });
});
