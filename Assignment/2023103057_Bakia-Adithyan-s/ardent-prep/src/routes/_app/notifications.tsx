import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, GlassCard, LoadingState, PageHeader } from "@/components/app/kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Ardent Prep" },
      { name: "description", content: "Practice reminders and interview updates." },
      { property: "og:title", content: "Notifications — Ardent Prep" },
      { property: "og:description", content: "Practice reminders and interview updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => {
    q.refetch();
    qc.invalidateQueries({ queryKey: ["unread"] });
  };
  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    refresh();
  };
  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    refresh();
  };

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message="Could not load notifications." onRetry={() => q.refetch()} />;
  const items = q.data!;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Inbox" title="Notifications" action={<Button variant="outline" onClick={markAll} disabled={!items.some((n) => !n.read)}>Mark all read</Button>} />
      <GlassCard className="mt-6 p-0">
        {items.length === 0 ? <EmptyState title="No notifications" /> : (
          <div className="divide-y divide-border">
            {items.map((n) => (
              <div key={n.id} className={cn("flex items-start gap-4 px-5 py-4", !n.read && "bg-glass-strong")}>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-muted" : "bg-primary")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-[13px] text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {n.link && (
                    <Button asChild size="sm" variant="outline" onClick={() => markRead(n.id)}>
                      <Link to={n.link as "/"}>Open</Link>
                    </Button>
                  )}
                  {!n.read && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
