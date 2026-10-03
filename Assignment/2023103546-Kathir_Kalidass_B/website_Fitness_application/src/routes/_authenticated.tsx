import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Dumbbell, LayoutDashboard, Salad, Sparkles, Baby, LogOut, Layers } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/nutrition", label: "Nutrition", icon: Salad },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
  { to: "/kids", label: "Kids", icon: Baby },
  { to: "/system", label: "System", icon: Layers },
] as const;

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setChecked(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (checked && !session) navigate({ to: "/auth" });
  }, [checked, session, navigate]);

  if (!checked || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-pulse rounded-full bg-brand" />
      </div>
    );
  }

  const initials = (session.user.email ?? "H").slice(0, 2).toUpperCase();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-brand/10 blur-[130px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-[420px] w-[420px] rounded-full bg-brand/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[380px] w-[520px] rounded-full bg-cyan-glow/5 blur-[130px]" />

      <div className="relative mx-auto max-w-[1440px] px-6 py-8 sm:px-10">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[10px] bg-brand">
              <Dumbbell className="size-5 text-brand-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-mist">HFC</p>
              <p className="text-sm font-medium leading-tight">Holistic Fitness Club</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-white/5 px-2 py-1.5 ring-1 ring-white/10 backdrop-blur-xl md:flex">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="rounded-full px-3 py-1.5 text-sm text-mist transition-colors hover:text-foreground"
                activeProps={{ className: "bg-white/10 text-foreground" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => supabase.auth.signOut()}
              className="grid size-9 place-items-center rounded-full bg-white/5 text-mist ring-1 ring-white/10 transition-colors hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
            <div className="grid size-9 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand ring-1 ring-white/10">
              {initials}
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-white/5 p-1.5 ring-1 ring-white/10 md:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-mist",
              )}
              activeProps={{ className: "bg-white/10 text-foreground" }}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <Outlet />
      </div>
    </div>
  );
}
