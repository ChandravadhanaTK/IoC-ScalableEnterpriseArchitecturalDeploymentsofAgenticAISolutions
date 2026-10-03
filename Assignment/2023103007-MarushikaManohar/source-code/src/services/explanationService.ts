import type { WorkflowRun } from "@/types";

/**
 * Optional Explanation Service (Extension Point).
 *
 * Receives structured agent outputs and synthesizes an executive natural
 * language explanation. Strictly read-only: it CANNOT approve/reject, mutate
 * inventory, create purchase orders, or alter permissions.
 *
 * Includes a pure deterministic synthesis fallback that requires no external
 * API keys or network calls.
 */
export interface WorkflowExplanation {
  headline: string;
  summary: string;
  recommendation: string;
  riskFactors: string[];
  evidenceDigest: string[];
}

export function generateWorkflowExplanation(wf: WorkflowRun): WorkflowExplanation {
  const product = wf.productId;
  const qty = wf.quantity;
  const supplierName = wf.supplier?.selected?.supplierName ?? "Unknown Supplier";
  const orderValue = wf.supplier?.selected ? (wf.supplier.selected.unitPrice * qty).toLocaleString("en-US", { style: "currency", currency: "USD" }) : "N/A";
  
  const riskFactors: string[] = [];
  if (wf.risk?.triggers) {
    wf.risk.triggers.forEach((trigger) => {
      switch (trigger) {
        case "ORDER_VALUE_THRESHOLD_EXCEEDED":
          riskFactors.push(`Order value exceeds policy threshold ($10,000 baseline).`);
          break;
        case "HIGH_STOCKOUT_RISK":
          riskFactors.push(`Projected warehouse stock falls below safety stock buffer.`);
          break;
        case "SUPPLIER_RELIABILITY_BELOW_THRESHOLD":
          riskFactors.push(`Selected supplier reliability score is below minimum acceptable quality (85%).`);
          break;
        case "EMERGENCY_FLAG":
          riskFactors.push(`Request was flagged as an emergency expedition.`);
          break;
        case "HARD_SPEND_CEILING_EXCEEDED":
          riskFactors.push(`Order value exceeds corporate hard spend ceiling.`);
          break;
        default:
          riskFactors.push(`Policy trigger: ${trigger}`);
      }
    });
  }

  const evidenceDigest: string[] = [];
  if (wf.demand) {
    evidenceDigest.push(`Demand velocity: MA30=${wf.demand.ma30}/day with trend ${wf.demand.trend} (Expected horizon demand: ${wf.demand.expectedDemand} units).`);
  }
  if (wf.inventory) {
    evidenceDigest.push(`Inventory balance: On-hand ${wf.inventory.onHand} units vs Safety ${wf.inventory.safetyStock} units (Projected balance: ${wf.inventory.projectedStock} units).`);
  }
  if (wf.supplier?.selected) {
    evidenceDigest.push(`Sourcing evaluation: ${wf.supplier.selected.supplierName} ranked #1 with composite score ${wf.supplier.selected.total}/100 ($${wf.supplier.selected.unitPrice}/unit, ${wf.supplier.selected.leadTimeDays}d lead time).`);
    if (wf.supplier.fallbackUsed) {
      evidenceDigest.push(`Resilience note: Primary candidate (${wf.supplier.primaryUnavailable}) lacked capacity; automated fallback re-ranked alternatives.`);
    }
  }

  let headline = `Replenishment Request ${wf.id} · ${product}`;
  let summary = `Request for ${qty} units of ${product} at warehouse ${wf.warehouseId}.`;
  let recommendation = "";

  if (wf.state === "COMPLETED") {
    headline = `Replenishment ${wf.id} Successfully Procured`;
    summary = `Purchase Order ${wf.poId ?? "issued"} for ${qty} units from ${supplierName} (${orderValue}). All pipeline checks and gates satisfied.`;
    recommendation = "Replenishment is in-transit. Awaiting warehouse receiving confirmation.";
  } else if (wf.state === "AWAITING_APPROVAL") {
    headline = `Human-in-the-Loop Approval Required for ${wf.id}`;
    summary = `Specialized agents evaluated replenishment of ${qty} units from ${supplierName} (${orderValue}). Mandatory human authorization triggered.`;
    recommendation = `Review decision evidence and approve or reject order with audit justification. Triggered rules: ${wf.risk?.triggers?.join(", ") ?? "None"}.`;
  } else if (wf.state === "REJECTED") {
    headline = `Replenishment ${wf.id} Rejected`;
    summary = `The workflow was terminated and blocked. Reason: ${wf.outcomeReason ?? "Policy limit breach or manager rejection."}`;
    recommendation = "Adjust order parameters, re-evaluate sourcing limits, or submit a new proposal.";
  } else if (wf.state === "ESCALATED") {
    headline = `Replenishment ${wf.id} Escalated to Sourcing Team`;
    summary = `Automated agent execution could not resolve constraints: ${wf.outcomeReason ?? "No suitable supplier available or SLA timeout."}`;
    recommendation = "Requires manual vendor negotiations or capacity reallocation by Supply Chain leadership.";
  } else if (wf.state === "FAILED") {
    headline = `Workflow Execution Fault in ${wf.id}`;
    summary = `Operational failure during agent pipeline: ${wf.outcomeReason ?? "Transient tool errors exceeded maximum retry budget."}`;
    recommendation = "Verify downstream tool connectivity or reset retry limits in Policy Administration.";
  } else {
    headline = `Replenishment ${wf.id} in progress (${wf.state})`;
    summary = `Multi-agent pipeline is analyzing demand velocity, inventory thresholds, and vendor scoring.`;
    recommendation = "Monitoring agent execution timeline.";
  }

  return {
    headline,
    summary,
    recommendation,
    riskFactors,
    evidenceDigest,
  };
}
