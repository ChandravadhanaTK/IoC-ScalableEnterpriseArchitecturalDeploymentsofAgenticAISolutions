import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/reservations")({
  head: () => ({ meta: [{ title: "Reservations — CHEFSTATION Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminReservations,
});

const RES_STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"];

function resColor(s: string) {
  switch (s) {
    case "confirmed": return "border-success/40 bg-success/10 text-success";
    case "seated": return "border-info/40 bg-info/10 text-info";
    case "cancelled":
    case "no_show": return "border-danger/40 bg-danger/10 text-danger";
    default: return "border-warning/40 bg-warning/10 text-warning";
  }
}

function AdminReservations() {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: reservations } = useQuery({
    queryKey: ["admin-reservations", dateFilter],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("*, tables(table_number)")
        .eq("reservation_date", dateFilter)
        .order("reservation_time");
      return data ?? [];
    },
  });

  const { data: tables } = useQuery({
    queryKey: ["admin-res-tables"],
    queryFn: async () => {
      const { data } = await supabase.from("tables").select("id, table_number, capacity").order("table_number");
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
  };

  const assignTable = async (id: string, tableId: string) => {
    const { error } = await supabase.from("reservations").update({ table_id: tableId, status: "confirmed" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Table assigned & reservation confirmed");
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gold-gradient">Reservations</h1>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-md border border-input bg-input-bg px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="mt-6 space-y-3">
        {(reservations ?? []).map((r) => (
          <div key={r.id} className="surface-card flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-32">
              <p className="font-mono text-lg font-bold text-primary">
                {format(new Date(`2000-01-01T${r.reservation_time}`), "h:mm a")}
              </p>
              <p className="text-xs text-muted-foreground">{r.party_size} guests</p>
            </div>
            <div className="min-w-40 flex-1">
              <p className="font-semibold text-foreground">{r.customer_name}</p>
              <p className="text-xs text-muted-foreground">
                {r.customer_phone ?? ""} {r.occasion && r.occasion !== "casual" ? `· ${r.occasion}` : ""}
              </p>
              {r.special_requests && <p className="mt-1 text-xs text-warning">{r.special_requests}</p>}
            </div>
            <Badge variant="outline" className={`capitalize ${resColor(r.status)}`}>{r.status.replace("_", " ")}</Badge>
            <div className="flex items-center gap-2">
              <Select
                value={r.table_id ?? ""}
                onValueChange={(t) => assignTable(r.id, t)}
              >
                <SelectTrigger className="h-8 w-36 border-input bg-input-bg text-xs">
                  <SelectValue placeholder={r.tables?.table_number ? `Table ${r.tables.table_number}` : "Assign table"} />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {(tables ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.table_number} ({t.capacity} seats)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {r.status === "pending" && (
                <Button size="sm" className="bg-primary font-bold text-primary-foreground" onClick={() => setStatus(r.id, "confirmed")}>
                  Confirm
                </Button>
              )}
              {r.status === "confirmed" && (
                <Button size="sm" variant="outline" className="border-info/40 text-info" onClick={() => setStatus(r.id, "seated")}>
                  Seat
                </Button>
              )}
            </div>
          </div>
        ))}
        {(reservations ?? []).length === 0 && (
          <p className="rounded-lg border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            No reservations for {format(new Date(dateFilter + "T00:00"), "EEEE, d MMMM")}
          </p>
        )}
      </div>
    </div>
  );
}
