import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, ClipboardList, LayoutGrid, CalendarDays, PackageX, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, statusColor } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — CHEFSTATION Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof IndianRupee; label: string; value: string; sub?: string }) {
  return (
    <div className="surface-card surface-card-hover p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AdminDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: stats } = useQuery({
    queryKey: ["admin-stats", today],
    queryFn: async () => {
      const [orders, tables, reservations, lowStock] = await Promise.all([
        supabase.from("orders").select("total_amount, status").gte("created_at", today),
        supabase.from("tables").select("status"),
        supabase.from("reservations").select("id, status").eq("reservation_date", today),
        supabase.from("inventory_items").select("id").filter("current_stock", "lte", 5),
      ]);
      const all = orders.data ?? [];
      const revenue = all.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0);
      const tbls = tables.data ?? [];
      return {
        revenue,
        orderCount: all.length,
        occupied: tbls.filter((t) => t.status === "occupied").length,
        totalTables: tbls.length,
        reservationsToday: (reservations.data ?? []).length,
        lowStockCount: (lowStock.data ?? []).length,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, order_type, total_amount, customer_name, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-gold-gradient">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={IndianRupee} label="Today's Revenue" value={formatINR(stats?.revenue ?? 0)} sub="Excluding cancelled orders" />
        <StatCard icon={ClipboardList} label="Today's Orders" value={String(stats?.orderCount ?? 0)} />
        <StatCard icon={LayoutGrid} label="Tables Occupied" value={`${stats?.occupied ?? 0}/${stats?.totalTables ?? 0}`} />
        <StatCard icon={CalendarDays} label="Reservations Today" value={String(stats?.reservationsToday ?? 0)} />
        <StatCard icon={PackageX} label="Low Stock Items" value={String(stats?.lowStockCount ?? 0)} sub="At or below minimum level" />
        <StatCard icon={TrendingUp} label="Avg. Order Value" value={formatINR(stats?.orderCount ? stats.revenue / stats.orderCount : 0)} />
      </div>

      <h2 className="mt-8 mb-4 text-lg font-bold text-foreground">Recent Orders</h2>
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(recentOrders ?? []).map((o) => (
              <tr key={o.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-mono font-semibold text-primary">#{o.order_number}</td>
                <td className="px-4 py-3 text-foreground">{o.customer_name ?? "Guest"}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{o.order_type.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`capitalize ${statusColor(o.status)}`}>{o.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">{formatINR(o.total_amount)}</td>
              </tr>
            ))}
            {(recentOrders ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No orders yet today</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
