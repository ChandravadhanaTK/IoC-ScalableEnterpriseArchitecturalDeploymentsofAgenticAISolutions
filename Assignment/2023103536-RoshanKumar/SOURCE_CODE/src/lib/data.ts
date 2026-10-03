import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = supabase as any;

async function q<T = any[]>(p: any): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

const LIVE = 1500;

export function useNetwork() {
  return useQuery({
    queryKey: ["network"],
    queryFn: async () => {
      const [ports, routes, suppliers, pos] = await Promise.all([
        q(sb.from("ports").select("*").order("id")),
        q(sb.from("routes").select("*").order("id")),
        q(sb.from("suppliers").select("*").order("id")),
        q(sb.from("purchase_orders").select("id,status,current_route_id,original_route_id,supplier_id,original_supplier_id,disruption_status")),
      ]);
      return { ports, routes, suppliers, pos } as { ports: any[]; routes: any[]; suppliers: any[]; pos: any[] };
    },
    refetchInterval: LIVE,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      q(
        sb
          .from("purchase_orders")
          .select("*, product:products(name,category), supplier:suppliers!purchase_orders_supplier_id_fkey(name,region), original_supplier:suppliers!purchase_orders_original_supplier_id_fkey(name), route:routes!purchase_orders_current_route_id_fkey(name,transport_mode,associated_port_id), original_route:routes!purchase_orders_original_route_id_fkey(name)")
          .order("id"),
      ),
    refetchInterval: LIVE,
  });
}

export function useDisruptions() {
  return useQuery({ queryKey: ["disruptions"], queryFn: () => q(sb.from("disruptions").select("*").order("created_at")), refetchInterval: LIVE });
}

export function useRuns(disruptionId?: string) {
  return useQuery({
    queryKey: ["runs", disruptionId ?? "all"],
    queryFn: () => {
      let p = sb.from("agent_runs").select("*, disruption:disruptions(title,type,severity)").order("started_at", { ascending: false }).limit(50);
      if (disruptionId) p = p.eq("disruption_id", disruptionId);
      return q(p);
    },
    refetchInterval: 1000,
  });
}

export function useActions(runId?: string | null) {
  return useQuery({
    queryKey: ["actions", runId ?? "all"],
    queryFn: () => {
      let p = sb.from("agent_actions").select("*, po:purchase_orders(id,quantity,product:products(name))").order("created_at");
      if (runId) p = p.eq("agent_run_id", runId);
      else p = p.limit(200);
      return q(p);
    },
    enabled: runId !== null,
    refetchInterval: 1000,
  });
}

export function useLogs(runId?: string | null, limit = 300) {
  return useQuery({
    queryKey: ["logs", runId ?? "all", limit],
    queryFn: () => {
      let p = sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
      if (runId) p = p.eq("agent_run_id", runId);
      return q(p);
    },
    enabled: runId !== null,
    refetchInterval: 800,
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["pending"],
    queryFn: () => q(sb.from("agent_actions").select("*, po:purchase_orders(id,quantity,product:products(name))").eq("approval_status", "PENDING")),
    refetchInterval: 1000,
  });
}

export function useInventory() {
  return useQuery({ queryKey: ["inventory"], queryFn: () => q(sb.from("inventory").select("*, product:products(name)").eq("location", "Pune Plant")) });
}
