import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, statusColor, ORDER_STATUSES } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — CHEFSTATION Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminOrders,
});

const ALL_STATUSES = [...ORDER_STATUSES, "cancelled", "refunded"];

function AdminOrders() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: orders } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Order updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gold-gradient">Orders</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 border-input bg-input-bg"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => {
              const items = (o.items as { name: string; quantity: number }[]) ?? [];
              return (
                <tr key={o.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold text-primary">#{o.order_number}</td>
                  <td className="px-4 py-3 text-foreground">{o.customer_name ?? "Guest"}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{o.order_type.replace("_", " ")}</td>
                  <td className="max-w-56 px-4 py-3 text-xs text-muted-foreground">
                    {items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={o.status} onValueChange={(s) => setStatus(o.id, s)}>
                      <SelectTrigger className={`h-8 w-32 border text-xs capitalize ${statusColor(o.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {ALL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{formatINR(o.total_amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                </tr>
              );
            })}
            {(orders ?? []).length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No orders match this filter</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
