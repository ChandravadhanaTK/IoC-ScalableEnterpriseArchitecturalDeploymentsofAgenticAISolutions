import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { LayoutDashboard, LineChart, PlusCircle, Bell, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Meter } from "./kit";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/interviews/new", label: "Create interview", icon: PlusCircle },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const WEEKLY_GOAL = 3;

export function AppShell() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread"],
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
      return count ?? 0;
    },
  });

  const { data: weekDone = 0 } = useQuery({
    queryKey: ["week-done"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const { count } = await supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", since);
      return count ?? 0;
    },
  });

  // In-app practice reminder: at most one per 3 days when the user hasn't practiced.
  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 3 * 864e5).toISOString();
      const [{ count: recentIv }, { count: recentReminder }] = await Promise.all([
        supabase.from("interviews").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("title", "Practice reminder").gte("created_at", since),
      ]);
      if (!recentIv && !recentReminder) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        await supabase.from("notifications").insert({
          user_id: u.user.id,
          title: "Practice reminder",
          body: "You haven't practiced in the last few days. A short mock interview keeps skills sharp.",
          link: "/interviews/new",
        });
        qc.invalidateQueries({ queryKey: ["unread"] });
      }
    })();
  }, [qc]);

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="blob drift -left-24 -top-24 size-[440px]" style={{ background: "var(--blob-1)" }} />
      <div className="blob drift right-[-140px] top-48 size-[480px]" style={{ background: "var(--blob-2)" }} />
      <div className="blob bottom-[-120px] left-1/3 size-[400px]" style={{ background: "var(--blob-3)" }} />

      <div className="relative mx-auto flex max-w-[1440px]">
        <aside className="glass-panel sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sidebar-border md:flex">
          <div className="flex items-center gap-2 px-6 py-6">
            <div className="grid size-8 place-items-center rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground">A</div>
            <span className="text-[15px] font-semibold tracking-tight">Ardent Prep</span>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
                activeProps={{ className: "bg-sidebar-accent font-medium !text-foreground shadow-sm ring-1 ring-border" }}
                activeOptions={{ exact: n.to !== "/dashboard" ? false : true }}
              >
                <n.icon className="size-4" />
                <span className="flex-1">{n.label}</span>
                {n.to === "/notifications" && unread > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{unread}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="glass mx-4 mt-6 p-4">
            <p className="text-xs font-medium text-foreground/70">Weekly goal</p>
            <div className="mt-2">
              <Meter value={Math.min(weekDone, WEEKLY_GOAL)} max={WEEKLY_GOAL} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {weekDone} of {WEEKLY_GOAL} interviews this week
            </p>
          </div>
          <button onClick={signOut} className="mx-3 mb-6 mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/60 hover:text-foreground">
            <LogOut className="size-4" /> Sign out
          </button>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 md:px-8">
          <nav className="glass mb-6 flex gap-1 overflow-x-auto p-1.5 md:hidden">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-foreground/60" activeProps={{ className: "bg-glass-strong !text-foreground font-medium" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
