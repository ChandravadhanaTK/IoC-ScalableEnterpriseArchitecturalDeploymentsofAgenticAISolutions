import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";

const NAV = [
  { group: "Prepare", items: [
    { to: "/", label: "Dashboard" },
    { to: "/aptitude", label: "Aptitude" },
    { to: "/technical", label: "Technical MCQs" },
    { to: "/interview", label: "Mock Interview" },
    { to: "/feedback", label: "AI Feedback" },
  ] },
  { group: "Track", items: [
    { to: "/analytics", label: "Analytics" },
    { to: "/study", label: "Study Plan" },
    { to: "/admin", label: "Admin" },
  ] },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  useEffect(() => { setLight(localStorage.getItem("theme") === "light"); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    localStorage.setItem("theme", light ? "light" : "dark");
  }, [light]);

  const sidebar = (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-glass p-5 backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-lg bg-primary/20 font-display font-bold text-primary">C</div>
        <span className="font-display text-lg font-bold tracking-tight">Candor</span>
        <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
      </div>
      <nav className="flex flex-col gap-1 text-sm">
        {NAV.map((g) => (
          <div key={g.group} className="flex flex-col gap-1">
            <span className="label-mono mb-1 mt-3 px-3 text-[10px]">{g.group}</span>
            {g.items.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                activeOptions={{ exact: true }}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "!bg-primary/15 !text-primary font-medium" }}>
                {n.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <button onClick={() => setLight((l) => !l)} className="btn-ghost mt-6 flex items-center gap-2">
        {light ? <Moon className="size-4" /> : <Sun className="size-4" />} {light ? "Dark mode" : "Light mode"}
      </button>
      <div className="mt-auto rounded-xl border border-border bg-secondary p-3">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-full bg-accent/20 font-display text-accent">ST</div>
          <div className="leading-tight"><p className="text-sm font-medium">Student</p><p className="text-[11px] text-muted-foreground">Guest profile</p></div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-24 -top-40 size-[520px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-40 size-[560px] rounded-full bg-accent/10 blur-[130px]" />
      <div className="relative flex">
        <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
        {open && <div className="fixed inset-0 z-40 bg-background/70 lg:hidden" onClick={() => setOpen(false)}><div className="h-full w-60 bg-card" onClick={(e) => e.stopPropagation()}>{sidebar}</div></div>}
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <button className="btn-ghost mb-4 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-4" /></button>
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub, action }: { eyebrow: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label-mono mb-1">{eyebrow}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance">{title}</h1>
        {sub && <p className="mt-1 max-w-[56ch] text-pretty text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

export function Stat({ label, value, unit, note, tone = "muted" }: { label: string; value: string | number; unit?: string; note?: string; tone?: "good" | "muted" | "primary" }) {
  const c = tone === "good" ? "text-good" : tone === "primary" ? "text-primary" : "text-muted-foreground";
  return (
    <div className="glass p-4">
      <p className="label-mono">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}{unit && <span className="text-lg text-muted-foreground">{unit}</span>}</p>
      {note && <p className={`mt-1 text-xs ${c}`}>{note}</p>}
    </div>
  );
}
