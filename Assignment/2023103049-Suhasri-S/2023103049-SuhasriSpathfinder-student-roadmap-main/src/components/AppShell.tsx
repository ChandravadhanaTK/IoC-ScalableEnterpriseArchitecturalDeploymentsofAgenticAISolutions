import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Compass, LayoutDashboard, Target, Map, LineChart, GitPullRequestArrow, MessageCircle, User, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProposals } from "@/lib/queries";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/skill-gap", label: "Skill gap", icon: Target },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/adaptive-changes", label: "Adaptive changes", icon: GitPullRequestArrow },
  { to: "/mentor", label: "AI Mentor", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-display text-xl font-bold", className)}>
      <Compass className="h-6 w-6 text-accent" /> Pathfinder
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: proposals } = useProposals();
  const pending = proposals?.filter((p) => p.status === "pending").length ?? 0;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground font-semibold" }}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{label}</span>
          {to === "/adaptive-changes" && pending > 0 && (
            <span className="rounded-full bg-sidebar-primary px-2 text-xs font-bold text-sidebar-primary-foreground">{pending}</span>
          )}
        </Link>
      ))}
      <button onClick={signOut} className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col gap-8 bg-sidebar p-5 text-sidebar-foreground lg:flex lg:sticky lg:top-0 lg:h-screen">
        <Link to="/dashboard"><Logo /></Link>
        {nav}
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        <Link to="/dashboard"><Logo className="text-lg" /></Link>
        <button aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && <div className="fixed inset-x-0 top-[52px] z-20 bg-sidebar p-4 lg:hidden">{nav}</div>}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{text}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-muted-foreground" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {text}
    </div>
  );
}
