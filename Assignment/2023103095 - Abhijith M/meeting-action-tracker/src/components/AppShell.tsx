import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard, CalendarDays, PlusSquare, ListChecks, Bell, User, Network, Workflow,
  Rocket, ShieldCheck, Activity, GitBranch, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const groups = [
  { label: "Workspace", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/meetings", label: "Meetings", icon: CalendarDays },
    { to: "/meetings/new", label: "Create Meeting", icon: PlusSquare },
    { to: "/tasks", label: "Tasks", icon: ListChecks },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/profile", label: "Profile", icon: User },
  ]},
  { label: "Architecture", items: [
    { to: "/architecture", label: "System", icon: Network },
    { to: "/architecture/agents", label: "Agent Workflow", icon: Workflow },
    { to: "/architecture/deployment", label: "Deployment", icon: Rocket },
    { to: "/architecture/security", label: "Security", icon: ShieldCheck },
  ]},
  { label: "Observability", items: [
    { to: "/monitoring", label: "Monitoring", icon: Activity },
    { to: "/monitoring/traces", label: "Traces", icon: GitBranch },
  ]},
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const unread = useQuery({
    queryKey: ["unread", user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("read", false);
      return count ?? 0;
    },
  });

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-shell text-shell-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-4">
          <div className="font-mono text-[10px] tracking-[0.16em] text-shell-muted">IOC · AGENTIC AI</div>
          <div className="mt-0.5 font-semibold">Meeting Action Tracker</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.label} className="mb-5">
              <div className="mb-1.5 px-2 font-mono text-[10px] tracking-[0.14em] text-shell-muted uppercase">{g.label}</div>
              {g.items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  activeOptions={{ exact: true }}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-shell-muted transition-colors hover:bg-shell-active hover:text-shell-foreground"
                  activeProps={{ className: "bg-shell-active !text-shell-foreground" }}
                >
                  <it.icon className="size-4" />
                  <span className="flex-1">{it.label}</span>
                  {it.to === "/notifications" && !!unread.data && (
                    <span className="rounded bg-primary px-1.5 font-mono text-[10px] text-primary-foreground">{unread.data}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-3 text-xs">
          <div className="truncate text-shell-muted">{user.email}</div>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            className="mt-2 flex items-center gap-1.5 text-shell-muted hover:text-shell-foreground"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-8">
          <div className="flex gap-3 overflow-x-auto text-sm md:hidden">
            {groups[0].items.map((it) => (
              <Link key={it.to} to={it.to} activeOptions={{ exact: true }} className="whitespace-nowrap text-muted-foreground" activeProps={{ className: "!text-foreground font-medium" }}>{it.label}</Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">3 agents · orchestrated</span>
            <Link to="/notifications" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <Bell className="size-5" />
              {!!unread.data && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 rounded-full bg-danger px-1 text-center font-mono text-[10px] leading-4 text-primary-foreground">{unread.data}</span>
              )}
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
