import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Outcome =
  | { ok: true; status: string; poNumber?: string; message: string }
  | { ok: false; error: string };

const ActInput = z.object({
  role: z.string(),
  action: z.enum(["approve", "reject", "changes"]),
  comment: z.string().max(1000),
  currentStatus: z.string(),
});

// Role & state checks are enforced here on the server, not only in the UI.
export const actOnRequest = createServerFn({ method: "POST" })
  .validator((d) => ActInput.parse(d))
  .handler(async ({ data }): Promise<Outcome> => {
    if (data.role !== "Manager") return { ok: false, error: "Not authorized: only a Manager can approve, reject or request changes." };
    if (data.currentStatus !== "pending_manager") return { ok: false, error: "This request is not awaiting manager review." };
    if (data.action !== "approve" && data.comment.trim().length < 3) return { ok: false, error: "Please add a short comment explaining your decision." };
    const status = data.action === "approve" ? "approved" : data.action === "reject" ? "rejected" : "changes_requested";
    return { ok: true, status, message: `Request ${status.replace("_", " ")}.` };
  });

const PoInput = z.object({
  role: z.string(),
  currentStatus: z.string(),
  existingPo: z.string().optional(),
  allPoNumbers: z.array(z.string()).max(1000),
});

export const createPurchaseOrder = createServerFn({ method: "POST" })
  .validator((d) => PoInput.parse(d))
  .handler(async ({ data }): Promise<Outcome> => {
    if (data.role !== "Procurement Officer") return { ok: false, error: "Not authorized: only a Procurement Officer can create purchase orders." };
    if (data.existingPo) return { ok: false, error: `Duplicate blocked: ${data.existingPo} already exists for this request.` };
    if (data.currentStatus !== "approved") return { ok: false, error: "A purchase order can only be created after manager approval." };
    const max = data.allPoNumbers.reduce((m, p) => Math.max(m, Number(p.split("-")[2]) || 0), 0);
    const poNumber = `PO-2026-${String(max + 1).padStart(4, "0")}`;
    return { ok: true, status: "po_created", poNumber, message: `${poNumber} created.` };
  });
