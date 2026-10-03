import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Activity, Bell, Bot, Building2, ClipboardList, LayoutDashboard, Menu, PlusCircle, Search, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/requests", label: "Requests", icon: ClipboardList },
  { to: "/new-request", label: "New Request", icon: PlusCircle },
  { to: "/triage", label: "AI Triage", icon: Bot },
  { to: "/departments", label: "Departments", icon: Building2 },
  { to: "/monitoring", label: "Agent & Monitoring", icon: Activity },
  { to: "/security", label: "Security & Settings", icon: ShieldCheck },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid size-9 place-items-center rounded-xl bg-brand shadow-glow"><Activity className="size-5 text-primary-foreground" /></div>
        <div>
          <div className="text-[15px] font-bold text-sidebar-accent-foreground">MediFlow AI</div>
          <div className="text-[11px] text-sidebar-foreground/60">Northstar Medical Center</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">Operations</p>
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link key={to} to={to} onClick={onNavigate}
              className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
              <Icon className={cn("size-4", active && "text-sidebar-primary")} />
              {label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-accent-foreground"><span className="size-2 animate-pulse rounded-full bg-sidebar-primary" />Ops Agent online</div>
        <p className="mt-1 text-[11px] text-sidebar-foreground/60">v2.4 · Demo environment · mock data only</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64"><Sidebar onNavigate={() => setOpen(false)} /></div>
          <button className="absolute right-4 top-4 rounded-lg bg-card p-2" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-4" /></button>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur md:px-8">
          <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search requests, departments, audit events…" className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-[11px] font-semibold text-teal sm:inline">Demo · Fictional data</span>
            <button className="relative rounded-xl p-2 hover:bg-muted" aria-label="Notifications"><Bell className="size-5 text-muted-foreground" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" /></button>
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-full bg-brand text-xs font-bold text-primary-foreground">AM</div>
              <div className="hidden leading-tight md:block">
                <div className="text-sm font-semibold">{CURRENT_USER.name}</div>
                <div className="text-[11px] text-muted-foreground">{CURRENT_USER.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
