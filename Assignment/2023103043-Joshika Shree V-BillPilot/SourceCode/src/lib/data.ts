import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

async function q(table: string, order = "created_at", asc = false) {
  const { data, error } = await sb.from(table).select("*").order(order, { ascending: asc });
  if (error) throw error;
  return data as any[];
}

export const useBills = () => useQuery({ queryKey: ["bills"], queryFn: () => q("bills", "billing_date") });
export const useSubs = () => useQuery({ queryKey: ["subscriptions"], queryFn: () => q("subscriptions", "next_billing_date", true) });
export const useAnomalies = () => useQuery({ queryKey: ["anomalies"], queryFn: () => q("anomalies") });
export const useReminders = () => useQuery({ queryKey: ["reminders"], queryFn: () => q("reminders", "reminder_date", true) });
export const useWorkflows = () => useQuery({ queryKey: ["workflows"], queryFn: () => q("workflow_runs", "started_at") });
export const useAgentRuns = () => useQuery({ queryKey: ["agent_runs"], queryFn: () => q("agent_runs", "created_at", true) });
export const useAudit = () => useQuery({ queryKey: ["audit"], queryFn: () => q("audit_logs") });

export { sb };

export const STATUS_LABEL: Record<string, string> = {
  processing: "Processing", needs_review: "Needs review", processed: "Processed", approved: "Approved", rejected: "Rejected",
};
