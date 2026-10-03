import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import { can, ROLE_LABEL } from "@/services/rbac";
import { projectedStock, stockoutRisk } from "@/agents/formulas";
import { Search, Filter, PlusCircle, ArrowUpDown, AlertCircle, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { NavView } from "@/components/layout/Sidebar";

interface InventoryViewProps {
  onNavigate: (view: NavView, params?: { productId?: string; warehouseId?: string }) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onNavigate }) => {
  const state = useAppState();
  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? state.users[0];
  const canRequest = can(currentUser.role, "REQUEST_REPLENISHMENT");

  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");

  // Computed inventory items with projected stock and risk badge
  const rows = useMemo(() => {
    return state.inventory.map((inv) => {
      const prod = state.products.find((p) => p.id === inv.productId)!;
      const wh = state.warehouses.find((w) => w.id === inv.warehouseId)!;

      // Expected demand calculation (14 days horizon)
      const dh = state.demandHistory.find((d) => d.productId === inv.productId && d.warehouseId === inv.warehouseId);
      const avg30 = dh ? dh.daily.slice(-30).reduce((a, b) => a + b, 0) / 30 : 10;
      const sf = state.policy.seasonalFactors[prod.category] ?? 1.0;
      const expDemand = Math.round(avg30 * state.policy.planningHorizonDays * sf);

      const projected = projectedStock(inv.onHand, expDemand, inv.inTransit);
      const risk = stockoutRisk(projected, inv.safetyStock);

      return {
        ...inv,
        product: prod,
        warehouse: wh,
        expectedDemand: expDemand,
        projected,
        risk,
      };
    });
  }, [state.inventory, state.products, state.warehouses, state.demandHistory, state.policy]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch =
        r.product.name.toLowerCase().includes(search.toLowerCase()) ||
        r.product.sku.toLowerCase().includes(search.toLowerCase()) ||
        r.product.category.toLowerCase().includes(search.toLowerCase());

      const matchesWarehouse = warehouseFilter === "ALL" || r.warehouseId === warehouseFilter;
      const matchesRisk = riskFilter === "ALL" || r.risk === riskFilter;

      return matchesSearch && matchesWarehouse && matchesRisk;
    });
  }, [rows, search, warehouseFilter, riskFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory Catalog & Health</h1>
          <p className="text-sm text-muted-foreground">
            Multi-facility SKU inventory balances, safety buffers, and automated projected stock calculations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!canRequest && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              <span>Replenishment locked for {ROLE_LABEL[currentUser.role]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SKU, product name, or category..."
              className="pl-8 text-xs h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-48 text-xs h-9">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Warehouses</SelectItem>
              {state.warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name} ({w.region})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40 text-xs h-9">
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Risk Levels</SelectItem>
              <SelectItem value="HIGH">High Stockout Risk</SelectItem>
              <SelectItem value="MEDIUM">Medium Risk</SelectItem>
              <SelectItem value="LOW">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <strong>{filteredRows.length}</strong> of {rows.length} catalog items
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b">
              <tr>
                <th className="px-4 py-3">Product / SKU</th>
                <th className="px-3 py-3">Warehouse</th>
                <th className="px-3 py-3 text-right">On Hand</th>
                <th className="px-3 py-3 text-right">In Transit</th>
                <th className="px-3 py-3 text-right">Safety Stock</th>
                <th className="px-3 py-3 text-right">Exp. Demand</th>
                <th className="px-3 py-3 text-right">Projected</th>
                <th className="px-3 py-3 text-center">Risk Badge</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No matching inventory records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{item.product.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{item.product.sku}</span>
                        <span className="bg-muted px-1 rounded">{item.product.category}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-foreground">{item.warehouse.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.warehouse.region}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{item.onHand.toLocaleString()} {item.product.unit}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">
                      {item.inTransit > 0 ? (
                        <span className="text-primary font-medium">+{item.inTransit.toLocaleString()}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-muted-foreground">{item.safetyStock.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">~{item.expectedDemand.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold">
                      <span className={item.projected < item.safetyStock ? "text-destructive" : "text-foreground"}>
                        {item.projected.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge
                        variant={
                          item.risk === "HIGH"
                            ? "destructive"
                            : item.risk === "MEDIUM"
                            ? "outline"
                            : "secondary"
                        }
                        className={`text-[10px] uppercase font-bold ${
                          item.risk === "MEDIUM" ? "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10" : ""
                        }`}
                      >
                        {item.risk}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={item.risk === "HIGH" ? "default" : "outline"}
                        disabled={!canRequest}
                        onClick={() =>
                          onNavigate("replenishment", {
                            productId: item.productId,
                            warehouseId: item.warehouseId,
                          })
                        }
                        className="h-7 text-xs gap-1"
                        title={!canRequest ? "Requires REQUEST_REPLENISHMENT permission" : "Order replenishment for this item"}
                      >
                        <PlusCircle className="h-3 w-3" />
                        <span>Replenish</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
