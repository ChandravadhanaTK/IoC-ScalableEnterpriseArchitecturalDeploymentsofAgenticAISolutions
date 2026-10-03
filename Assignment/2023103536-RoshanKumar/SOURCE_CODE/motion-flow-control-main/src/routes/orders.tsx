import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useActions, useOrders } from "@/lib/data";
import { motion } from "motion/react";
import { PageHeader, Panel, StatusBadge } from "@/components/detour/bits";
import { DecisionDrawer } from "@/components/detour/agent";
import { inr, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Purchase Orders — Detour" },
      { name: "description", content: "All 40 inbound purchase orders with supplier, route, dates and disruption status." },
      { property: "og:title", content: "Purchase Orders — Detour" },
      { property: "og:description", content: "Inbound purchase orders and their disruption status." },
    ],
  }),
  component: OrdersPage,
});

const FILTERS = ["ALL", "AT_RISK", "REROUTED", "EXPEDITED", "SUBSTITUTED", "ESCALATED", "IN_TRANSIT", "PLANNED", "DELIVERED"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: actions = [] } = useActions();
  const [f, setF] = useState("ALL");
  const [sel, setSel] = useState<any>(null);
  const rows = orders.filter((o: any) => f === "ALL" || o.status === f);
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Inbound" title="Purchase Orders" />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((x) => (
          <button key={x} onClick={() => setF(x)} className={cn("rounded border px-2.5 py-1 font-mono text-[11px]", f === x ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
            {x.replace("_", " ")} {x !== "ALL" && <span className="opacity-60">{orders.filter((o: any) => o.status === x).length}</span>}
          </button>
        ))}
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="label-mono border-b border-border text-left">
              {["PO", "Product", "Qty", "Supplier", "Route", "Value", "Required", "ETA", "Status"].map((h) => <th key={h} className="px-4 py-2.5 font-normal">{h}</th>)}
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Loading orders…</td></tr>}
              {rows.map((o: any, i: number) => {
                const changedSup = o.supplier_id !== o.original_supplier_id;
                const changedRoute = o.current_route_id !== o.original_route_id;
                return (
                  <motion.tr key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.025, 0.6) }} onClick={() => setSel(o)} className="cursor-pointer border-b border-border/50 hover:bg-accent/40">
                      <td className="px-4 py-2.5 font-mono">{o.id}</td>
                      <td className="px-4 py-2.5">{o.product?.name}</td>
                      <td className="px-4 py-2.5 font-mono">{o.quantity}</td>
                      <td className="px-4 py-2.5">{changedSup && <span className="mr-1 text-xs text-muted-foreground line-through">{o.original_supplier?.name}</span>}<span className={changedSup ? "text-agent" : ""}>{o.supplier?.name}</span></td>
                      <td className="px-4 py-2.5">{changedRoute && <span className="mr-1 text-xs text-muted-foreground line-through">{o.original_route?.name}</span>}<span className={changedRoute ? "text-agent" : ""}>{o.route?.name}</span></td>
                      <td className="px-4 py-2.5 font-mono">{inr(o.quantity * o.unit_cost)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{shortDate(o.required_date)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{shortDate(o.expected_arrival)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                    </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <DecisionDrawer po={sel} actions={actions} onClose={() => setSel(null)} />
    </div>
  );
}
