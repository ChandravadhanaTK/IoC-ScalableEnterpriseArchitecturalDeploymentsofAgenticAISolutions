import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { runReminderAgent } from "@/lib/agents.functions";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/notifications")({
  head: () => pageMeta("Notifications", "In-app deadline reminders and overdue alerts issued by the Reminder Agent."),
  component: () => <AppShell><Notifications /></AppShell>,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const run = useServerFn(runReminderAgent);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const rows = (data ?? []).filter((n) => filter === "ALL" || !n.read);

  async function setRead(id: string | null, read: boolean) {
    let q = supabase.from("notifications").update({ read }).eq("user_id", user!.id);
    if (id) q = q.eq("id", id);
    await q;
    qc.invalidateQueries();
  }

  async function runNow() {
    setBusy(true);
    try {
      const r = await run();
      toast.success(`Reminder Agent scanned ${r.scanned} task(s): ${r.created} new notification(s)`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    setBusy(false);
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader eyebrow="Reminder Agent" title="Notifications" desc="Upcoming (within 3 days) and overdue task alerts. Duplicate alerts per task are suppressed."
        actions={<>
          <Button variant="outline" onClick={() => setRead(null, true)}>Mark all read</Button>
          <Button onClick={runNow} disabled={busy}>{busy ? "Scanning…" : "Run Reminder Agent"}</Button>
        </>} />
      <div className="mb-4 flex gap-2">
        {(["ALL", "UNREAD"] as const).map((f) => <Button key={f} size="sm" variant={filter === f ? "secondary" : "ghost"} onClick={() => setFilter(f)}>{f === "ALL" ? "All" : "Unread"}</Button>)}
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <EmptyState title="No notifications" /> : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((n) => (
            <li key={n.id} className={`flex items-center gap-3 px-4 py-3 text-sm ${n.read ? "" : "bg-info-soft/40"}`}>
              <span className={`size-2 rounded-full ${n.read ? "bg-border" : "bg-primary"}`} />
              <StatusBadge value={n.kind} />
              <span className="flex-1">{n.message}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
              <Button size="sm" variant="ghost" onClick={() => setRead(n.id, !n.read)}>{n.read ? "Mark unread" : "Mark read"}</Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
