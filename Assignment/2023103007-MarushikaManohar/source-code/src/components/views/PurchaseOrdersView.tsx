import React, { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { can, ROLE_LABEL } from "@/services/rbac";
import { receivePurchaseOrder, testPoIdempotency } from "@/services/actions";
import { Receipt, CheckCircle, PackageCheck, Repeat, ShieldAlert, AlertTriangle, Key, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const PurchaseOrdersView: React.FC = () => {
  const state = useAppState();
  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? state.users[0];
  const canExecutePo = can(currentUser.role, "EXECUTE_PO");

  const [search, setSearch] = useState("");
  const [replayResult, setReplayResult] = useState<{
    poId: string;
    idempotentHit: boolean;
    key: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReceive = (poId: string) => {
    setErrorMsg(null);
    try {
      receivePurchaseOrder(poId);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleVerifyIdempotency = async (workflowId: string, poId: string) => {
    setErrorMsg(null);
    try {
      const res = await testPoIdempotency(workflowId);
      setReplayResult({
        poId,
        idempotentHit: !res.created,
        key: res.po.idempotencyKey,
      });
      setTimeout(() => setReplayResult(null), 6000);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const filteredPos = state.purchaseOrders.filter((po) => {
    const s = search.toLowerCase();
    return (
      po.id.toLowerCase().includes(s) ||
      po.workflowId.toLowerCase().includes(s) ||
      po.idempotencyKey.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Purchase Orders & Idempotency</h1>
          <p className="text-sm text-muted-foreground">
            Contractual replenishment orders issued by the Procurement Agent, guarded by SHA-256 idempotency locks.
          </p>
        </div>
      </div>

      {!canExecutePo && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Procurement Execution Notice</div>
            <p className="mt-0.5">
              Current active persona (<strong>{currentUser.name}</strong> – {ROLE_LABEL[currentUser.role]}) has read-only access to Purchase Orders. Receiving orders or triggering replay tests requires the <code>EXECUTE_PO</code> permission (assigned to <strong>Procurement Officer</strong> Sarah Chen or <strong>Administrator</strong> Alex Mercer).
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {replayResult && (
        <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3 animate-in fade-in">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">Idempotency Lock Verified for {replayResult.poId}</div>
            <p>
              The Procurement Agent re-executed procurement with identical inputs. Idempotency check intercepted the request and returned the existing PO without duplicate issuance or double inventory decrement.
            </p>
            <div className="font-mono text-[10px] bg-background/80 px-2 py-1 rounded border inline-block">
              SHA256 Idempotency Key: {replayResult.key}
            </div>
          </div>
        </div>
      )}

      {/* Filter and stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PO ID, workflow, or idempotency hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Total Issued: <strong>{state.purchaseOrders.length}</strong> · Active In-Transit:{" "}
          <strong>{state.purchaseOrders.filter((p) => p.status === "ISSUED").length}</strong>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">PO ID</th>
                  <th className="px-3 py-3">Workflow ID</th>
                  <th className="px-3 py-3">Product / SKU</th>
                  <th className="px-3 py-3">Supplier</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-right">Unit Price</th>
                  <th className="px-3 py-3 text-right">Total ($)</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Idempotency Key (SHA256)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No purchase orders recorded yet. Submit a replenishment or run an auto-approved scenario.
                    </td>
                  </tr>
                ) : (
                  filteredPos.slice().reverse().map((po) => {
                    const prod = state.products.find((p) => p.id === po.productId);
                    const sup = state.suppliers.find((s) => s.id === po.supplierId);

                    return (
                      <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">{po.id}</td>
                        <td className="px-3 py-3 font-mono text-primary font-semibold">{po.workflowId}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-foreground">{prod?.name ?? po.productId}</div>
                          <div className="text-[10px] text-muted-foreground">{prod?.sku}</div>
                        </td>
                        <td className="px-3 py-3 text-foreground font-medium">{sup?.name ?? po.supplierId}</td>
                        <td className="px-3 py-3 text-right font-medium">{po.quantity.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-muted-foreground">${po.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-bold text-foreground">
                          ${po.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge
                            variant={po.status === "RECEIVED" ? "secondary" : "default"}
                            className={`text-[9px] uppercase font-bold ${
                              po.status === "RECEIVED" ? "bg-emerald-500/10 text-emerald-600" : ""
                            }`}
                          >
                            {po.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                            title={po.idempotencyKey}
                          >
                            {po.idempotencyKey.slice(0, 14)}...
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {po.status === "ISSUED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!canExecutePo}
                                onClick={() => handleReceive(po.id)}
                                className="h-7 text-[11px] gap-1"
                                title={!canExecutePo ? "Requires EXECUTE_PO permission" : "Mark shipment received at facility"}
                              >
                                <PackageCheck className="h-3 w-3 text-emerald-600" />
                                <span>Receive</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={!canExecutePo}
                              onClick={() => handleVerifyIdempotency(po.workflowId, po.id)}
                              className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                              title={!canExecutePo ? "Requires EXECUTE_PO permission" : "Replay procurement to test idempotency"}
                            >
                              <Repeat className="h-3 w-3" />
                              <span>Test Replay</span>
                            </Button>
                          </div>
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
