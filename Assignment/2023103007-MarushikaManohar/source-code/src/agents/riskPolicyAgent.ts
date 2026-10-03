import { PolicyTool, RiskMatrixTool, fmt } from "@/tools/dataTools";
import type { ToolContext } from "@/tools/core";
import type { RiskLevel, RiskOutput } from "@/types";

/** POLICY_CHECK stage: hard limits that block the request outright. */
export function runPolicyCheck(
  ctx: ToolContext,
  input: { orderValue: number },
): { output: { hardViolation: string | null; hardSpendCeiling: number }; evidence: string[] } {
  const policy = PolicyTool.get(ctx, {});
  const breached = input.orderValue > policy.hardSpendCeiling;
  return {
    output: { hardViolation: breached ? "HARD_SPEND_CEILING_EXCEEDED" : null, hardSpendCeiling: policy.hardSpendCeiling },
    evidence: [
      `Order value ($${fmt(input.orderValue)}) ${breached ? ">" : "≤"} Hard spend ceiling ($${fmt(policy.hardSpendCeiling)})`,
      breached ? "Hard policy violation → request blocked" : "No hard policy violation",
    ],
  };
}

/** RISK_ASSESSMENT stage: HITL required if ANY rule triggers. */
export function runRiskAssessment(
  ctx: ToolContext,
  input: { orderValue: number; stockoutRisk: RiskLevel; supplierReliability: number; emergency: boolean },
): { output: RiskOutput; evidence: string[] } {
  const policy = PolicyTool.get(ctx, {});
  const rules = RiskMatrixTool.evaluate(ctx, {
    ...input,
    spendingLimit: policy.spendingLimit,
    minReliability: policy.minReliability,
  });
  const triggers = rules.filter((r) => r.triggered).map((r) => r.rule);
  return {
    output: { orderValue: input.orderValue, approvalRequired: triggers.length > 0, triggers, hardViolation: null },
    evidence: [
      ...rules.map((r) => `${r.triggered ? "TRIGGERED" : "pass"} · ${r.evidence}`),
      triggers.length ? `Human approval required: ${triggers.join(", ")}` : "All rules pass → auto-approval eligible",
    ],
  };
}
