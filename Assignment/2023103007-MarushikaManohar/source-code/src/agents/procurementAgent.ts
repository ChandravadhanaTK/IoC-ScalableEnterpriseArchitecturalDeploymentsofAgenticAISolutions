import { AuditTool, PurchaseOrderTool } from "@/tools/actionTools";
import { InventoryTool } from "@/tools/dataTools";
import type { ToolContext } from "@/tools/core";
import { getState, transaction } from "@/services/db";
import { transition } from "@/services/workflowEngine";
import type { PurchaseOrder } from "@/types";

export class ApprovalGateError extends Error {
  override name = "ApprovalGateError";
}

function gate(workflowId: string, allowed: string[]) {
  const s = getState();
  const wf = s.workflows.find((w) => w.id === workflowId);
  if (!wf) throw new ApprovalGateError("Workflow not found");
  const approval = s.approvals.find((a) => a.workflowId === workflowId && a.decision !== "REJECTED");
  if (!allowed.includes(wf.state) || !approval) {
    throw new ApprovalGateError(`Approval gate closed: state ${wf.state}, approval ${approval ? "present" : "missing"}`);
  }
  if (!wf.supplier?.selected) throw new ApprovalGateError("No selected supplier");
  return { wf, approval, sel: wf.supplier.selected };
}

/**
 * Runs only after approval (auto or manual). PO creation + inventory in-transit
 * update + state transition + audit event commit atomically.
 */
export function runProcurementAgent(ctx: ToolContext): { output: { po: PurchaseOrder; created: boolean }; evidence: string[] } {
  const workflowId = ctx.workflowId!;
  return transaction(() => {
    const { wf, approval, sel } = gate(workflowId, ["APPROVED"]);
    const { po, created } = PurchaseOrderTool.create(ctx, {
      workflowId, supplierId: sel.supplierId, productId: wf.productId, warehouseId: wf.warehouseId,
      quantity: wf.quantity, unitPrice: sel.unitPrice,
    });
    if (created) InventoryTool.addInTransit(ctx, { productId: wf.productId, warehouseId: wf.warehouseId, quantity: wf.quantity });
    transition(workflowId, "PURCHASE_ORDER_CREATED", { actorId: ctx.actorId, reason: `${po.id} issued to ${sel.supplierName}` });
    AuditTool.record(ctx, {
      action: created ? "PURCHASE_ORDER_CREATED" : "PURCHASE_ORDER_IDEMPOTENT_HIT",
      result: "SUCCESS",
      severity: "INFO",
      details: { poId: po.id, idempotencyKey: po.idempotencyKey, total: po.total, approval: approval.decision },
    });
    return {
      output: { po, created },
      evidence: [
        `Approval gate open: ${approval.decision} by ${approval.decidedBy}`,
        `Idempotency key SHA256(${workflowId}_${sel.supplierId}_${wf.quantity}) = ${po.idempotencyKey.slice(0, 16)}…`,
        created ? `Created ${po.id}: ${wf.quantity} × $${sel.unitPrice} = $${po.total}` : `Existing ${po.id} returned (no duplicate)`,
      ],
    };
  });
}

/** Idempotency demonstration: re-executes PO creation for an already-procured workflow. */
export function replayProcurement(ctx: ToolContext): { output: { po: PurchaseOrder; created: boolean }; evidence: string[] } {
  const workflowId = ctx.workflowId!;
  const { wf, sel } = gate(workflowId, ["PURCHASE_ORDER_CREATED", "COMPLETED"]);
  const res = PurchaseOrderTool.create(ctx, {
    workflowId, supplierId: sel.supplierId, productId: wf.productId, warehouseId: wf.warehouseId,
    quantity: wf.quantity, unitPrice: sel.unitPrice,
  });
  if (res.created) InventoryTool.addInTransit(ctx, { productId: wf.productId, warehouseId: wf.warehouseId, quantity: wf.quantity });
  AuditTool.record(ctx, {
    action: "PROCUREMENT_REPLAY",
    result: "SUCCESS",
    severity: "INFO",
    details: { poId: res.po.id, duplicateCreated: res.created },
  });
  return {
    output: res,
    evidence: [res.created ? `Created ${res.po.id}` : `Idempotent: existing ${res.po.id} returned, inventory unchanged`],
  };
}
