import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Flame, Clock, CheckCircle2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { minutesSince } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/kds")({
  head: () => ({
    meta: [
      { title: "Kitchen Display — CHEFSTATION" },
      { name: "description", content: "Live kitchen display system for CHEFSTATION staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KdsPage,
});

type KdsOrder = {
  id: string;
  order_number: string;
  status: string;
  order_type: string;
  table_number: string | null;
  items: { name: string; quantity: number; spice_level?: number; customizations?: string[] }[];
  priority: string;
  special_instructions: string | null;
  created_at: string;
};

const NEXT_STATUS: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
};

const ACTION_LABEL: Record<string, string> = {
  pending: "Accept Order",
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
};

function elapsedClass(mins: number) {
  if (mins >= 25) return "text-danger animate-pulse";
  if (mins >= 12) return "text-warning";
  return "text-muted-foreground";
}

function OrderCard({ order, onAdvance }: { order: KdsOrder; onAdvance: (o: KdsOrder) => void }) {
  const mins = minutesSince(order.created_at);
  return (
    <div className={`surface-card flex flex-col p-4 animate-order-slide ${order.priority === "urgent" ? "border-danger/60" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-bold text-primary">#{order.order_number}</span>
        <span className={`flex items-center gap-1 font-mono text-xs ${elapsedClass(mins)}`}>
          <Clock className="h-3.5 w-3.5" /> {mins}m
        </span>
      </div>
      <p className="mt-1 text-xs capitalize text-muted-foreground">
        {order.order_type.replace("_", " ")}
        {order.table_number ? ` · Table ${order.table_number}` : ""}
        {order.priority === "urgent" && (
          <span className="ml-2 inline-flex items-center gap-0.5 font-semibold text-danger">
            <Flame className="h-3 w-3" /> URGENT
          </span>
        )}
      </p>
      <div className="mt-3 flex-1 space-y-1.5">
        {order.items.map((i, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold text-foreground">{i.quantity}× {i.name}</span>
            {i.spice_level ? (
              <span className="ml-1.5 text-danger">{"🌶".repeat(Math.min(i.spice_level, 3))}</span>
            ) : null}
            {i.customizations && i.customizations.length > 0 && (
              <p className="text-xs text-muted-foreground">→ {i.customizations.join(", ")}</p>
            )}
          </div>
        ))}
      </div>
      {order.special_instructions && (
        <p className="mt-2 rounded-md bg-warning/10 px-2 py-1.5 text-xs text-warning">
          {order.special_instructions}
        </p>
      )}
      <Button
        className="mt-4 w-full bg-primary font-bold text-primary-foreground"
        onClick={() => onAdvance(order)}
      >
        {ACTION_LABEL[order.status] ?? "Advance"}
      </Button>
    </div>
  );
}

function KdsPage() {
  const { user, roles, loading } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = roles.some((r) => ["kitchen_staff", "admin", "super_admin"].includes(r));

  const { data: orders } = useQuery({
    queryKey: ["kds-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["pending", "confirmed", "preparing"])
        .order("created_at", { ascending: true });
      return (data ?? []) as unknown as KdsOrder[];
    },
    enabled: isStaff,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!isStaff) return;
    const channel = supabase
      .channel("kds-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
        if (payload.eventType === "INSERT") {
          toast.info("New order received!", { icon: <UtensilsCrossed className="h-4 w-4" /> });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isStaff, queryClient]);

  const advance = async (order: KdsOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", order.id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
  };

  const columns = useMemo(() => {
    const byStatus = (s: string) => (orders ?? []).filter((o) => o.status === s);
    return [
      { title: "New", status: "pending", orders: byStatus("pending") },
      { title: "Confirmed", status: "confirmed", orders: byStatus("confirmed") },
      { title: "Preparing", status: "preparing", orders: byStatus("preparing") },
    ];
  }, [orders]);

  if (loading) return null;
  if (!user || !isStaff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <UtensilsCrossed className="h-12 w-12 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">Kitchen Staff Only</h1>
        <p className="text-sm text-muted-foreground">Sign in with a kitchen or admin account to view the display.</p>
        <Link to="/login" className="rounded-md bg-primary px-5 py-2.5 font-bold text-primary-foreground btn-glow">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-gradient">Kitchen Display</h1>
          <p className="text-xs text-muted-foreground">
            {(orders ?? []).length} active orders · live
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <span className="h-2 w-2 rounded-full bg-success animate-glow-pulse" /> LIVE
          </span>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">Exit</Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <div key={col.status}>
            <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{col.title}</h2>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                {col.orders.length}
              </span>
            </div>
            <div className="space-y-3">
              {col.orders.map((o) => (
                <OrderCard key={o.id} order={o} onAdvance={advance} />
              ))}
              {col.orders.length === 0 && (
                <p className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  No orders
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        Orders advance: New → Confirmed → Preparing → Ready. Waiters mark orders as served.
      </div>
    </div>
  );
}
