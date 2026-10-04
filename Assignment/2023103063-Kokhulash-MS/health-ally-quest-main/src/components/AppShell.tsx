import { Link } from "@tanstack/react-router";
import { Activity, BellRing, Network, ShieldAlert, Stethoscope, MessageSquareHeart } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Triage & Booking", icon: MessageSquareHeart },
  { to: "/doctor-portal", label: "Clinician Desk", icon: Stethoscope },
  { to: "/follow-ups", label: "Follow-Ups", icon: BellRing },
  { to: "/architecture", label: "Architecture", icon: Network },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center gap-2 bg-emergency px-4 py-1.5 text-center text-xs font-semibold text-emergency-foreground">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        Prototype / Clinical Decision Support Demonstration Only — In medical emergencies, dial 911 immediately.
      </div>
      <header className="sticky top-0 z-30 border-b border-nav-border bg-nav text-nav-foreground">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide">CareRoute</span>
              <span className="block text-[11px] text-nav-muted">Appointment & Triage Assistant</span>
            </span>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-nav-muted transition-colors hover:bg-nav-border hover:text-nav-foreground"
                activeProps={{ className: "bg-nav-border !text-nav-foreground font-semibold" }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <span className="hidden items-center gap-1.5 font-mono text-[11px] text-nav-muted lg:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-routine" /> 4 agents online
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
  );
}
