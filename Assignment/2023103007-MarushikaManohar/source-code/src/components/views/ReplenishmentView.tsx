import React, { useState, useEffect } from "react";
import { useAppState } from "@/hooks/useAppState";
import { can, ROLE_LABEL } from "@/services/rbac";
import { submitReplenishment, type ReplenishmentInput } from "@/services/actions";
import { PlusCircle, ShieldAlert, ArrowRight, CheckCircle2, AlertTriangle, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { NavView } from "@/components/layout/Sidebar";

interface ReplenishmentViewProps {
  onNavigate: (view: NavView, params?: { workflowId?: string }) => void;
  prefillProduct?: string;
  prefillWarehouse?: string;
}

export const ReplenishmentView: React.FC<ReplenishmentViewProps> = ({
  onNavigate,
  prefillProduct,
  prefillWarehouse,
}) => {
  const state = useAppState();
  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? state.users[0];
  const canRequest = can(currentUser.role, "REQUEST_REPLENISHMENT");

  const [productId, setProductId] = useState<string>(prefillProduct || state.products[0]?.id || "P01");
  const [warehouseId, setWarehouseId] = useState<string>(prefillWarehouse || state.warehouses[0]?.id || "W01");
  const [quantity, setQuantity] = useState<number>(500);
  const [emergency, setEmergency] = useState<boolean>(false);
  const [preferredDate, setPreferredDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState<string>("Standard replenishment request initiated via console");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successWfId, setSuccessWfId] = useState<string | null>(null);

  useEffect(() => {
    if (prefillProduct) setProductId(prefillProduct);
    if (prefillWarehouse) setWarehouseId(prefillWarehouse);
  }, [prefillProduct, prefillWarehouse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessWfId(null);

    if (!canRequest) {
      setErrorMsg(`Authorization failure: ${ROLE_LABEL[currentUser.role]} is not permitted to request replenishments.`);
      return;
    }

    if (quantity <= 0) {
      setErrorMsg("Quantity must be a positive integer.");
      return;
    }

    setSubmitting(true);
    try {
      const input: ReplenishmentInput = {
        productId,
        warehouseId,
        quantity,
        emergency,
        preferredDate,
        notes,
      };

      const wfId = submitReplenishment(input);
      setSuccessWfId(wfId);
      setSubmitting(false);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setSubmitting(false);
    }
  };

  const selectedProduct = state.products.find((p) => p.id === productId);
  const currentInv = state.inventory.find((i) => i.productId === productId && i.warehouseId === warehouseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Replenishment Requests</h1>
          <p className="text-sm text-muted-foreground">
            Initiate automated multi-agent replenishment evaluation and view historical request orders.
          </p>
        </div>
      </div>

      {!canRequest && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Role Authorization Restriction</div>
            <p className="mt-0.5">
              The currently active persona (<strong>{currentUser.name}</strong> – {ROLE_LABEL[currentUser.role]}) lacks the <code>REQUEST_REPLENISHMENT</code> permission. Form submission is disabled. Switch to <strong>Elena Rostova</strong>, <strong>Marcus Vance</strong>, or <strong>Alex Mercer</strong> via the top-bar persona switcher to create requests.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Form and Live Inventory Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Submission Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">New Replenishment Proposal</CardTitle>
            <CardDescription className="text-xs">
              Triggers the Orchestrator to dispatch Demand, Inventory, Sourcing, and Risk agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successWfId && (
                <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="font-semibold">Workflow {successWfId} Dispatched</div>
                      <div className="text-[11px] text-muted-foreground">
                        Agents are actively calculating demand velocity, safety stock, and vendor scoring.
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 border-emerald-500/30"
                    onClick={() => onNavigate("agent-ops", { workflowId: successWfId })}
                  >
                    <span>View Execution</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Select Product SKU</Label>
                  <Select value={productId} onValueChange={setProductId} disabled={!canRequest || submitting}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Target Warehouse</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId} disabled={!canRequest || submitting}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Replenishment Quantity ({selectedProduct?.unit || "units"})</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100000}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={!canRequest || submitting}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Preferred Delivery Date</Label>
                  <Input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    disabled={!canRequest || submitting}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Emergency Expedition Flag</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Flag as critical rush delivery. Note: Emergency orders automatically trigger Human-in-the-Loop approval.
                  </p>
                </div>
                <Switch
                  checked={emergency}
                  onCheckedChange={setEmergency}
                  disabled={!canRequest || submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Business Justification / Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canRequest || submitting}
                  className="text-xs resize-none"
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={!canRequest || submitting} className="h-9 gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  <span>{submitting ? "Dispatching..." : "Submit to Orchestrator"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Target Inventory Context Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Target Facility Context</CardTitle>
            <CardDescription className="text-xs">
              Live operational metrics for selected destination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {currentInv ? (
              <>
                <div className="rounded-lg bg-muted/40 p-3 space-y-2 border">
                  <div className="font-semibold text-foreground">{selectedProduct?.name}</div>
                  <div className="text-[11px] text-muted-foreground">Category: {selectedProduct?.category}</div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                    <div>
                      <span className="text-muted-foreground">On Hand:</span>
                      <div className="font-bold text-foreground">{currentInv.onHand} {selectedProduct?.unit}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Safety Stock:</span>
                      <div className="font-bold text-foreground">{currentInv.safetyStock} {selectedProduct?.unit}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">In Transit:</span>
                      <div className="font-bold text-primary">{currentInv.inTransit} {selectedProduct?.unit}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reorder Point:</span>
                      <div className="font-bold text-foreground">{currentInv.reorderPoint} {selectedProduct?.unit}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="font-medium text-foreground">Orchestrator Evaluation Flow:</div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Demand Agent computes moving averages (30/60/90d)</li>
                    <li>Inventory Agent evaluates projected stockout risk</li>
                    <li>Supplier Agent scores vendors by price, lead time, & reliability</li>
                    <li>Risk & Policy Agent checks hard ceiling & HITL rules</li>
                    <li>If auto-approved or approved by manager, Procurement creates PO</li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground py-6 text-center">
                Select a product and warehouse to view live inventory metrics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Historical Replenishment Requests</CardTitle>
          <CardDescription className="text-xs">
            Logged request records correlated with orchestrator workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-3 py-3">Workflow ID</th>
                  <th className="px-3 py-3">Product / SKU</th>
                  <th className="px-3 py-3">Warehouse</th>
                  <th className="px-3 py-3 text-right">Quantity</th>
                  <th className="px-3 py-3 text-center">Emergency</th>
                  <th className="px-3 py-3">Requested By</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.requests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No replenishment requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  state.requests.slice().reverse().map((req) => {
                    const prod = state.products.find((p) => p.id === req.productId);
                    const wh = state.warehouses.find((w) => w.id === req.warehouseId);
                    const user = state.users.find((u) => u.id === req.requestedBy);
                    const wf = state.workflows.find((w) => w.id === req.workflowId);

                    return (
                      <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium">{req.id}</td>
                        <td className="px-3 py-3">
                          <span className="font-mono text-primary font-semibold">{req.workflowId}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-foreground">{prod?.name ?? req.productId}</div>
                          <div className="text-[10px] text-muted-foreground">{prod?.sku}</div>
                        </td>
                        <td className="px-3 py-3">{wh?.name ?? req.warehouseId}</td>
                        <td className="px-3 py-3 text-right font-medium">{req.quantity.toLocaleString()}</td>
                        <td className="px-3 py-3 text-center">
                          {req.emergency ? (
                            <Badge variant="destructive" className="text-[9px]">YES</Badge>
                          ) : (
                            <span className="text-muted-foreground">NO</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{user?.name ?? req.requestedBy}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onNavigate("agent-ops", { workflowId: req.workflowId })}
                          >
                            Trace
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
