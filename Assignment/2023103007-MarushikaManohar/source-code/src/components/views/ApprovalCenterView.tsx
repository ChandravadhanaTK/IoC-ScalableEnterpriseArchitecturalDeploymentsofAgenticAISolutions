import React, { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { can, ROLE_LABEL } from "@/services/rbac";
import { approveWorkflow, rejectWorkflow } from "@/services/actions";
import { generateWorkflowExplanation } from "@/services/explanationService";
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  FileText,
  DollarSign,
  TrendingUp,
  Boxes,
  Truck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkflowRun } from "@/types";

interface ApprovalCenterViewProps {
  onNavigateToTrace?: (workflowId: string) => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({ onNavigateToTrace }) => {
  const state = useAppState();
  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? state.users[0];
  const canApprove = can(currentUser.role, "REVIEW_APPROVE");

  const pendingWorkflows = state.workflows.filter((w) => w.state === "AWAITING_APPROVAL");

  // Approval / Rejection dialog state
  const [selectedWf, setSelectedWf] = useState<WorkflowRun | null>(null);
  const [dialogAction, setDialogAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const openActionDialog = (wf: WorkflowRun, action: "APPROVE" | "REJECT") => {
    setSelectedWf(wf);
    setDialogAction(action);
    setComment("");
    setErrorMsg(null);
  };

  const handleConfirmDecision = async () => {
    if (!selectedWf || !dialogAction) return;
    setErrorMsg(null);

    if (!canApprove) {
      setErrorMsg(`Authorization denied: ${ROLE_LABEL[currentUser.role]} lacks REVIEW_APPROVE permission.`);
      return;
    }

    if (dialogAction === "REJECT" && comment.trim().length < 10) {
      setErrorMsg("A rejection justification of at least 10 characters is mandatory for enterprise compliance.");
      return;
    }

    setProcessing(true);
    try {
      if (dialogAction === "APPROVE") {
        await approveWorkflow(selectedWf.id, comment);
      } else {
        rejectWorkflow(selectedWf.id, comment);
      }
      setProcessing(false);
      setDialogAction(null);
      setSelectedWf(null);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Human-in-the-Loop Approval Center</h1>
          <p className="text-sm text-muted-foreground">
            Auditable oversight for high-impact replenishments triggering policy ceilings, stockout alerts, or supplier anomalies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={pendingWorkflows.length > 0 ? "destructive" : "secondary"} className="h-7 text-xs px-2.5">
            {pendingWorkflows.length} Pending Authorization
          </Badge>
        </div>
      </div>

      {/* RBAC Notice if user cannot approve */}
      {!canApprove && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Approval Authorization Notice</div>
            <p className="mt-0.5">
              Current active persona (<strong>{currentUser.name}</strong> – {ROLE_LABEL[currentUser.role]}) cannot authorize replenishments. Approvals are strictly governed by the <code>REVIEW_APPROVE</code> privilege assigned to <strong>Supply Chain Managers</strong> (Elena Rostova) and <strong>Administrators</strong> (Alex Mercer).
            </p>
          </div>
        </div>
      )}

      {/* Pending Workflows List */}
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-foreground">Pending Workflows Awaiting Authorization</h2>

        {pendingWorkflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/70 mb-3" />
              <div className="text-base font-semibold text-foreground">No Actions Required</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                All replenishment requests have either completed auto-approval or have already received human authorization.
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingWorkflows.map((wf) => {
            const product = state.products.find((p) => p.id === wf.productId);
            const warehouse = state.warehouses.find((w) => w.id === wf.warehouseId);
            const selSupplier = wf.supplier?.selected;
            const orderValue = selSupplier ? selSupplier.unitPrice * wf.quantity : 0;
            const explanation = generateWorkflowExplanation(wf);

            return (
              <Card key={wf.id} className="border-amber-500/30 overflow-hidden shadow-sm">
                {/* Workflow Summary Header */}
                <div className="bg-amber-50/40 dark:bg-amber-950/20 px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-primary">{wf.id}</span>
                    <span className="font-semibold text-foreground">
                      {product?.name ?? wf.productId} ({wf.quantity.toLocaleString()} {product?.unit})
                    </span>
                    <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                      AWAITING_APPROVAL
                    </Badge>
                    {wf.emergency && (
                      <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                        Emergency
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Awaiting since: {new Date(wf.awaitingSince || wf.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <CardContent className="p-5 space-y-5 text-xs">
                  {/* Rule Trigger Highlights */}
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                    <div className="font-semibold text-destructive flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Triggered HITL Governance Rules:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {wf.risk?.triggers.map((trigger) => (
                        <Badge key={trigger} variant="destructive" className="font-mono text-[10px]">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Read-only Agent Synthesis Briefing */}
                  <div className="rounded-md bg-muted/40 border p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Executive Decision Briefing</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{explanation.summary}</p>
                    <p className="text-[11px] font-medium text-primary">{explanation.recommendation}</p>
                  </div>

                  {/* 4 Agent Evidence Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Demand Evidence */}
                    <div className="p-3 rounded-lg border bg-card space-y-1.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span>Demand Agent</span>
                      </div>
                      {wf.demand ? (
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <div>MA30 Daily: <strong className="text-foreground">{wf.demand.ma30}/day</strong></div>
                          <div>Expected: <strong className="text-foreground">{wf.demand.expectedDemand} units</strong></div>
                          <div>Trend: <strong className="text-foreground">{wf.demand.trend}</strong></div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-[11px]">Analysis pending</div>
                      )}
                    </div>

                    {/* 2. Inventory Evidence */}
                    <div className="p-3 rounded-lg border bg-card space-y-1.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Boxes className="h-3.5 w-3.5 text-primary" />
                        <span>Inventory Agent</span>
                      </div>
                      {wf.inventory ? (
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <div>On Hand: <strong className="text-foreground">{wf.inventory.onHand}</strong></div>
                          <div>Safety Stock: <strong className="text-foreground">{wf.inventory.safetyStock}</strong></div>
                          <div>
                            Projected:{" "}
                            <strong className={wf.inventory.risk === "HIGH" ? "text-destructive" : "text-foreground"}>
                              {wf.inventory.projectedStock}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-[11px]">Analysis pending</div>
                      )}
                    </div>

                    {/* 3. Supplier Evidence */}
                    <div className="p-3 rounded-lg border bg-card space-y-1.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-primary" />
                        <span>Supplier Agent</span>
                      </div>
                      {selSupplier ? (
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <div className="truncate">Selected: <strong className="text-foreground">{selSupplier.supplierName}</strong></div>
                          <div>Score: <strong className="text-foreground">{selSupplier.total}/100</strong></div>
                          <div>Lead Time: <strong className="text-foreground">{selSupplier.leadTimeDays}d</strong> (${selSupplier.unitPrice}/u)</div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-[11px]">No supplier selected</div>
                      )}
                    </div>

                    {/* 4. Risk & Spend Evidence */}
                    <div className="p-3 rounded-lg border bg-card space-y-1.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                        <span>Financial Scope</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-muted-foreground">
                        <div>Total Value: <strong className="text-foreground">${orderValue.toLocaleString()}</strong></div>
                        <div>Policy Limit: <strong>${state.policy.spendingLimit.toLocaleString()}</strong></div>
                        <div>Destination: <strong className="text-foreground">{warehouse?.name}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
                    {onNavigateToTrace && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-muted-foreground"
                        onClick={() => onNavigateToTrace(wf.id)}
                      >
                        Inspect Full Multi-Agent Trace →
                      </Button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canApprove}
                        onClick={() => openActionDialog(wf, "REJECT")}
                        className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject with Reason
                      </Button>
                      <Button
                        size="sm"
                        disabled={!canApprove}
                        onClick={() => openActionDialog(wf, "APPROVE")}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Authorize & Procure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Historical Approvals Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Historical Authorization Ledger</CardTitle>
          <CardDescription className="text-xs">
            Append-only decision records for audit compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Approval ID</th>
                  <th className="px-3 py-3">Workflow ID</th>
                  <th className="px-3 py-3 text-center">Decision</th>
                  <th className="px-3 py-3">Decided By</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-4 py-3">Justification / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.approvals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No approval decisions recorded yet.
                    </td>
                  </tr>
                ) : (
                  state.approvals.slice().reverse().map((apr) => (
                    <tr key={apr.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">{apr.id}</td>
                      <td className="px-3 py-3 font-mono text-primary font-semibold">{apr.workflowId}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge
                          variant={
                            apr.decision === "APPROVED" || apr.decision === "AUTO_APPROVED"
                              ? "default"
                              : "destructive"
                          }
                          className="text-[9px] uppercase font-bold"
                        >
                          {apr.decision}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-foreground font-medium">{apr.decidedBy}</td>
                      <td className="px-3 py-3 text-muted-foreground">{apr.role}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {new Date(apr.at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={apr.reason}>
                        {apr.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Decision Modal (Approve / Reject) */}
      <Dialog open={dialogAction !== null} onOpenChange={(open) => !open && setDialogAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {dialogAction === "APPROVE" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Authorize Replenishment Order</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span>Reject Replenishment Order</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Workflow <strong>{selectedWf?.id}</strong> · Evaluated by {ROLE_LABEL[currentUser.role]} ({currentUser.name})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                {dialogAction === "APPROVE" ? "Authorization Note (Optional):" : "Mandatory Rejection Justification (Min 10 characters):"}
              </label>
              <Textarea
                placeholder={
                  dialogAction === "APPROVE"
                    ? "e.g., Authorized after verifying seasonal safety buffer..."
                    : "e.g., Exceeds department spending allocation for this quarter..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            {dialogAction === "APPROVE" && (
              <p className="text-[11px] text-muted-foreground">
                Confirming approval will immediately release the approval gate and dispatch the Procurement Agent to generate an idempotent Purchase Order.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDialogAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={dialogAction === "APPROVE" ? "default" : "destructive"}
              onClick={handleConfirmDecision}
              disabled={processing}
              className="gap-1.5"
            >
              {processing ? "Submitting..." : dialogAction === "APPROVE" ? "Confirm & Issue PO" : "Reject Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
