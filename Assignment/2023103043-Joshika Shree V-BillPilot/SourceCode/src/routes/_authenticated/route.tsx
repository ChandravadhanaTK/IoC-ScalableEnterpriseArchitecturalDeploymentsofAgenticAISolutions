import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Receipt, Upload, Repeat, Bell, Workflow, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getAiMode } from "@/lib/mode.functions";

export const Route = createFileRoute("/_authenticated")({ component: Layout });

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/bills", label: "Bills", icon: Receipt },
  { to: "/upload", label: "Upload Bill", icon: Upload },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/workflow", label: "Agent Workflow", icon: Workflow },
] as const;

function Layout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const mode = useQuery({ queryKey: ["ai-mode"], queryFn: () => getAiMode(), staleTime: Infinity });
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <Link to="/dashboard" className="px-2 py-3 font-display text-xl font-bold">BillPilot</Link>
        <nav className="mt-4 flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "bg-sidebar-accent opacity-100 font-semibold" }}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border pt-3 text-xs">
          <div className={`rounded-md px-2 py-1 text-center font-semibold ${mode.data?.mode === "AI" ? "bg-success text-primary-foreground" : "bg-warning text-accent-foreground"}`}>
            {mode.data?.mode === "AI" ? "Live AI Mode" : "Demo AI Mode"}
          </div>
          <p className="truncate px-2 opacity-70">{user.email}</p>
          <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent"><LogOut className="h-4 w-4" />Logout</button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="flex gap-1 overflow-x-auto border-b bg-card p-2 md:hidden">
          {NAV.map(({ to, label }) => <Link key={to} to={to} className="whitespace-nowrap rounded px-3 py-1 text-sm" activeProps={{ className: "bg-primary text-primary-foreground" }}>{label}</Link>)}
        </div>
        <main className="mx-auto max-w-7xl p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-bold">{title}</h1>{sub && <p className="mt-1 text-muted-foreground">{sub}</p>}</div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
