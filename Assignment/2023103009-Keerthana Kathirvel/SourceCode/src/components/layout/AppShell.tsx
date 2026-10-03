import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Bell, Bot, BrainCircuit, LayoutDashboard, ListChecks, Menu, PlusCircle, Search, Settings, ShieldCheck, Waves, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ROLES, type Role } from "@/types/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/report", label: "Report Incident", icon: PlusCircle },
  { to: "/triage", label: "AI Triage", icon: BrainCircuit },
  { to: "/incidents", label: "Incidents", icon: ListChecks },
  { to: "/agent", label: "Agent Activity", icon: Bot },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
  { to: "/security", label: "Security", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, setRole } = useAuth();

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar-gradient text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Waves className="size-5" /></span>
        <div>
          <div className="font-bold leading-tight">CampusFlow AI</div>
          <div className="text-[11px] text-sidebar-muted">Campus Operations</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
              <n.icon className={cn("size-4", active && "text-sidebar-primary")} />{n.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs">
        <div className="flex items-center gap-2 font-semibold"><span className="size-2 rounded-full bg-success animate-pulse-dot" />Triage agent online</div>
        <p className="mt-1 text-sidebar-muted">campusflow-triage-v2 · 99.2% uptime</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64">{sidebar}
            <button aria-label="Close menu" className="absolute right-3 top-5 text-sidebar-foreground" onClick={() => setOpen(false)}><X className="size-5" /></button>
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur sm:px-6">
          <button aria-label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search incidents, locations, people…" className="h-9 w-full rounded-lg border bg-muted/50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-muted-foreground">Viewing as</span>
              <Select value={user.role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <button aria-label="Notifications" className="relative grid size-9 place-items-center rounded-lg border hover:bg-muted">
              <Bell className="size-4" /><span className="absolute right-2 top-2 size-2 rounded-full bg-critical" />
            </button>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-hero text-sm font-semibold text-primary-foreground">{user.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
              <div className="hidden leading-tight xl:block">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
