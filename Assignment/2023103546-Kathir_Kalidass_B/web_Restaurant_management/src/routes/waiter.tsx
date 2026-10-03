import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ConciergeBell, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatINR, statusColor, tableStatusColor, minutesSince } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/waiter")({
  head: () => ({
    meta: [
      { title: "Waiter Terminal — CHEFSTATION" },
      { name: "description", content: "Table map and order management for CHEFSTATION wait staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WaiterPage,
});

type Table = {
  id: string;
  table_number: string;
  capacity: number;
  status: string;
  section: string;
};

type ReadyOrder = {
  id: string;
  order_number: string;
  table_number: string | null;
  status: string;
  total_amount: number;
  created_at: string;
};

const TABLE_STATUSES = ["available", "occupied", "reserved", "cleaning"];

function WaiterPage() {
  const { user, roles, loading } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = roles.some((r) => ["waiter", "admin", "super_admin"].includes(r));

  const { data: tables } = useQuery({
    queryKey: ["waiter-tables"],
    queryFn: async () => {
      const { data } = await supabase.from("tables").select("*").order("table_number");
      return (data ?? []) as Table[];
    },
    enabled: isStaff,
  });

  const { data: readyOrders } = useQuery({
    queryKey: ["waiter-ready-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, table_number, status, total_amount, created_at")
        .in("status", ["ready", "confirmed", "preparing"])
        .order("created_at");
      return (data ?? []) as ReadyOrder[];
    },
    enabled: isStaff,
  });

  useEffect(() => {
    if (!isStaff) return;
    const channel = supabase
      .channel("waiter-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () =>
        queryClient.invalidateQueries({ queryKey: ["waiter-tables"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["waiter-ready-orders"] });
        const row = payload.new as { status?: string };
        if (row?.status === "ready") toast.success("An order is ready to serve!");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isStaff, queryClient]);

  const setTableStatus = async (table: Table, status: string) => {
    const { error } = await supabase.from("tables").update({ status }).eq("id", table.id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["waiter-tables"] });
  };

  const markServed = async (order: ReadyOrder) => {
    const { error } = await supabase.from("orders").update({ status: "served" }).eq("id", order.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Order #${order.order_number} marked served`);
      queryClient.invalidateQueries({ queryKey: ["waiter-ready-orders"] });
    }
  };

  if (loading) return null;
  if (!user || !isStaff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <ConciergeBell className="h-12 w-12 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">Wait Staff Only</h1>
        <p className="text-sm text-muted-foreground">Sign in with a waiter or admin account to view the terminal.</p>
        <Link to="/login" className="rounded-md bg-primary px-5 py-2.5 font-bold text-primary-foreground btn-glow">
          Sign In
        </Link>
      </div>
    );
  }

  const sections = ["indoor", "outdoor", "bar"];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-gradient">Waiter Terminal</h1>
          <p className="text-xs text-muted-foreground">Table map & ready orders · live</p>
        </div>
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">Exit</Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Table map */}
        <div className="space-y-6">
          {sections.map((section) => {
            const sectionTables = (tables ?? []).filter((t) => t.section === section);
            if (sectionTables.length === 0) return null;
            return (
              <div key={section}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{section}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {sectionTables.map((t) => (
                    <div key={t.id} className={`rounded-xl border p-4 transition-colors ${tableStatusColor(t.status)}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xl font-bold">{t.table_number}</span>
                        <span className="flex items-center gap-1 text-xs">
                          <Users className="h-3.5 w-3.5" /> {t.capacity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold capitalize">{t.status}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {TABLE_STATUSES.filter((s) => s !== t.status).map((s) => (
                          <button
                            key={s}
                            onClick={() => setTableStatus(t, s)}
                            className="rounded border border-border bg-background/60 px-2 py-0.5 text-[10px] capitalize text-muted-foreground hover:border-primary/50 hover:text-primary"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ready / in-progress orders */}
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Orders to Serve</h2>
          <div className="space-y-3">
            {(readyOrders ?? []).map((o) => (
              <div key={o.id} className="surface-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary">#{o.order_number}</span>
                  <Badge variant="outline" className={`capitalize ${statusColor(o.status)}`}>{o.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.table_number ? `Table ${o.table_number} · ` : ""}
                  {formatINR(o.total_amount)} · {minutesSince(o.created_at)}m ago
                </p>
                {o.status === "ready" && (
                  <Button size="sm" className="mt-3 w-full bg-primary font-bold text-primary-foreground" onClick={() => markServed(o)}>
                    Mark Served
                  </Button>
                )}
              </div>
            ))}
            {(readyOrders ?? []).length === 0 && (
              <p className="rounded-lg border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
                No active orders
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
