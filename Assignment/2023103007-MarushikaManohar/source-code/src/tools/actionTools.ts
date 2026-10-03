import { z } from "zod";
import { getState, mutate } from "@/services/db";
import { appendAudit, appendNotification, appendTelemetry } from "@/services/ledger";
import { sha256 } from "@/lib/sha256";
import { defineTool } from "./core";
import type { PurchaseOrder } from "@/types";

export function poIdempotencyKey(workflowId: string, supplierId: string, quantity: number): string {
  return sha256(`${workflowId}_${supplierId}_${quantity}`);
}

// 7. Purchase Order Tool — idempotent by SHA256(workflowId_supplierId_quantity)
export const PurchaseOrderTool = {
  create: defineTool(
    "PurchaseOrderTool",
    "create",
    z.object({
      workflowId: z.string().min(1),
      supplierId: z.string().min(1),
      productId: z.string().min(1),
      warehouseId: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    }),
    (input, ctx): { po: PurchaseOrder; created: boolean } => {
      const key = poIdempotencyKey(input.workflowId, input.supplierId, input.quantity);
      const existing = getState().purchaseOrders.find((p) => p.idempotencyKey === key);
      if (existing) return { po: existing, created: false };
      let po!: PurchaseOrder;
      mutate((s) => {
        s.counters.po += 1;
        po = {
          id: `PO-${s.counters.po}`,
          idempotencyKey: key,
          ...input,
          total: Math.round(input.quantity * input.unitPrice * 100) / 100,
          status: "ISSUED",
          createdAt: new Date().toISOString(),
          createdBy: ctx.actorId,
        };
        s.purchaseOrders.push(po);
      });
      return { po, created: true };
    },
  ),
};

// 8. Notification Tool
export const NotificationTool = {
  notify: defineTool(
    "NotificationTool",
    "notify",
    z.object({
      kind: z.enum(["APPROVAL_REQUIRED", "ESCALATION", "FAILURE", "INFO"]),
      message: z.string().min(1).max(300),
      workflowId: z.string().optional(),
      targetRoles: z.array(z.enum(["INVENTORY_OPERATOR", "SUPPLY_CHAIN_MANAGER", "PROCUREMENT_OFFICER", "ADMINISTRATOR"])),
    }),
    (n) => {
      appendNotification(n);
      return { ok: true as const };
    },
  ),
};

// 9. Audit Tool
export const AuditTool = {
  record: defineTool(
    "AuditTool",
    "record",
    z.object({
      action: z.string().min(1),
      result: z.enum(["SUCCESS", "FAILURE", "DENIED"]),
      severity: z.enum(["INFO", "WARN", "CRITICAL"]),
      details: z.record(z.unknown()),
    }),
    (e, ctx) => appendAudit({ ...e, userId: ctx.actorId, workflowId: ctx.workflowId, agent: ctx.agent }),
  ),
};

// 10. Telemetry Tool
export const TelemetryTool = {
  record: defineTool(
    "TelemetryTool",
    "record",
    z.object({ source: z.string().min(1), latencyMs: z.number().nonnegative(), ok: z.boolean() }),
    (e, ctx) => {
      appendTelemetry({ kind: "agent", ...e, workflowId: ctx.workflowId });
      return { ok: true as const };
    },
  ),
};

export function markPoReceived(poId: string, actorId: string): void {
  mutate((s) => {
    const po = s.purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status !== "ISSUED") throw new Error("PO not in ISSUED state");
    const rec = s.inventory.find((r) => r.productId === po.productId && r.warehouseId === po.warehouseId)!;
    rec.inTransit = Math.max(0, rec.inTransit - po.quantity);
    rec.onHand += po.quantity;
    rec.updatedAt = new Date().toISOString();
    po.status = "RECEIVED";
    po.receivedAt = rec.updatedAt;
    po.receivedBy = actorId;
  });
}
