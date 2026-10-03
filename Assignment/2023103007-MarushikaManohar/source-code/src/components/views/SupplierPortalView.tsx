import React, { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Truck, CheckCircle, AlertTriangle, ShieldX, Info, ExternalLink, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export const SupplierPortalView: React.FC = () => {
  const state = useAppState();
  const [search, setSearch] = useState("");

  const filteredSuppliers = state.suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.country.toLowerCase().includes(search.toLowerCase()),
  );

  const { weights } = state.policy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Supplier Portal & Scorecards</h1>
          <p className="text-sm text-muted-foreground">
            Vendor profiles, quality performance ratings, production capacity, and automated multi-attribute scoring weights.
          </p>
        </div>
      </div>

      {/* Sourcing Algorithm Explanation Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground text-sm">Deterministic Sourcing Formula</div>
              <div className="text-muted-foreground mt-0.5">
                Suppliers are evaluated across three balanced dimensions rather than a lowest-price-wins rule:
              </div>
              <div className="font-mono bg-background/80 px-2.5 py-1.5 rounded border border-border mt-2 inline-block text-[11px]">
                Score = ({weights.price} × PriceScore) + ({weights.lead} × LeadScore) + ({weights.reliability} × ReliabilityRating)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs">
            <div className="text-center p-2 rounded bg-card border">
              <div className="text-muted-foreground text-[10px]">Price Weight</div>
              <div className="font-bold text-foreground">{Math.round(weights.price * 100)}%</div>
            </div>
            <div className="text-center p-2 rounded bg-card border">
              <div className="text-muted-foreground text-[10px]">Lead Time Weight</div>
              <div className="font-bold text-foreground">{Math.round(weights.lead * 100)}%</div>
            </div>
            <div className="text-center p-2 rounded bg-card border">
              <div className="text-muted-foreground text-[10px]">Reliability Weight</div>
              <div className="font-bold text-foreground">{Math.round(weights.reliability * 100)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="max-w-sm relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter vendors by name or country..."
          className="pl-8 text-xs h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Supplier Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map((supplier) => {
          const supplierProducts = state.supplierProducts.filter((sp) => sp.supplierId === supplier.id);
          const isUnderThreshold = supplier.reliability < state.policy.minReliability;

          return (
            <Card key={supplier.id} className={supplier.blacklisted ? "border-destructive/40 bg-destructive/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{supplier.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Origin: {supplier.country} · ID: <span className="font-mono">{supplier.id}</span>
                    </CardDescription>
                  </div>
                  {supplier.blacklisted ? (
                    <Badge variant="destructive" className="gap-1 text-[10px]">
                      <ShieldX className="h-3 w-3" />
                      <span>Blacklisted</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-[10px] text-emerald-600 bg-emerald-500/10">
                      <CheckCircle className="h-3 w-3" />
                      <span>Active</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Reliability Score */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Reliability Rating:</span>
                    <span className={`font-bold ${isUnderThreshold ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                      {supplier.reliability}% {isUnderThreshold && "(< 85% Min)"}
                    </span>
                  </div>
                  <Progress
                    value={supplier.reliability}
                    className={`h-2 ${isUnderThreshold ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
                  />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded-md border">
                  <div>
                    <span className="text-muted-foreground">Lead Time:</span>
                    <div className="font-bold text-foreground">{supplier.leadTimeDays} days</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Capacity:</span>
                    <div className="font-bold text-foreground">{supplier.capacity.toLocaleString()} units</div>
                  </div>
                </div>

                {/* Catalog items */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-[11px] text-muted-foreground uppercase">
                    Offered Catalog ({supplierProducts.length} items):
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {supplierProducts.map((sp) => {
                      const prod = state.products.find((p) => p.id === sp.productId);
                      return (
                        <div
                          key={sp.productId}
                          className="flex items-center justify-between p-1.5 rounded bg-muted/20 border border-border/50 text-[11px]"
                        >
                          <span className="truncate max-w-[170px]">{prod?.name ?? sp.productId}</span>
                          <span className="font-mono font-semibold">${sp.unitPrice.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
