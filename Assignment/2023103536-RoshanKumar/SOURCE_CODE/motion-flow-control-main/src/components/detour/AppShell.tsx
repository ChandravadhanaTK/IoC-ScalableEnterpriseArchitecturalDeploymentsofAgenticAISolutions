import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bot, GitCompareArrows, LayoutDashboard, Network, Package, ScrollText, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrders, usePendingApprovals, useRuns } from "@/lib/data";
import { AnimatedNumber, useScrolled } from "./bits";
import { SimulateButton } from "./agent";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/network", label: "Network", icon: Network },
  { to: "/orders", label: "Purchase Orders", icon: Package },
  { to: "/disruptions", label: "Disruptions", icon: TriangleAlert },
  { to: "/compare", label: "Scenario Compare", icon: GitCompareArrows },
  { to: "/actions", label: "Action Log", icon: ScrollText },
  { to: "/agent-runs", label: "Agent Runs", icon: Bot },
] as const;

const COORDS = Array.from({ length: 40 }, (_, i) => `${(18.52 + i * 0.013).toFixed(3)}N ${(73.85 + i * 0.021).toFixed(3)}E · T+${String(i * 7).padStart(3, "0")}`);

export function AppShell({ children }: { children: ReactNode }) {
  const scrolled = useScrolled();
  const { data: orders = [] } = useOrders();
  const { data: pending = [] } = usePendingApprovals();
  const { data: runs = [] } = useRuns();
  const atRisk = orders.filter((o: { status: string }) => o.status === "AT_RISK" || o.status === "ESCALATED").length;
  const live = runs[0]?.status === "RUNNING";

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="hud-grid pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="pointer-events-none fixed right-3 top-0 -z-10 h-[200vh] overflow-hidden font-mono text-[9px] leading-6 text-muted-foreground/25">
        <div className="coord-drift">{[...COORDS, ...COORDS].map((c, i) => <div key={i}>{c}</div>)}</div>
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-background/80 backdrop-blur md:flex">
        <Link to="/" className="flex items-center gap-2 px-5 py-5">
          <svg viewBox="0 0 24 24" className="size-6 text-primary" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 18h6l6-12h6" /><circle cx="3" cy="18" r="1.5" fill="currentColor" /><circle cx="21" cy="6" r="1.5" fill="currentColor" /></svg>
          <div>
            <div className="text-lg font-bold tracking-tight">Detour</div>
            <div className="-mt-1 font-mono text-[9px] text-muted-foreground">DISRUPTION RESPONSE</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" activeProps={{ className: "!bg-accent !text-foreground" }}>
              <n.icon className="size-4" />
              {n.label}
              {n.to === "/disruptions" && pending.length > 0 && <span className="ml-auto rounded bg-warn/20 px-1.5 font-mono text-[10px] text-warn">{pending.length}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-4 text-[11px] leading-relaxed text-muted-foreground">Navigate disruption.<br />Keep supply moving.</div>
      </aside>

      <div className="md:pl-56">
        <motion.header layout className={cn("sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur transition-all", scrolled ? "py-2" : "py-3.5")}>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className={cn("size-2 rounded-full", live ? "animate-pulse bg-agent" : pending.length ? "animate-pulse bg-warn" : "bg-ok")} />
            <span className="text-muted-foreground">AGENT</span>
            <span className={live ? "text-agent" : pending.length ? "text-warn" : "text-ok"}>{live ? "RUNNING" : pending.length ? "WAITING" : "IDLE"}</span>
          </div>
          <div className={cn("hidden items-center gap-5 font-mono text-[11px] text-muted-foreground transition-all lg:flex", scrolled && "gap-3")}>
            <span>POS <AnimatedNumber value={orders.length} className="text-foreground" /></span>
            <span>AT-RISK <AnimatedNumber value={atRisk} className="text-crit" /></span>
            <span>APPROVALS <AnimatedNumber value={pending.length} className="text-warn" /></span>
          </div>
          <div className="ml-auto"><SimulateButton size={scrolled ? "sm" : "default"} /></div>
        </motion.header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-background/90 py-2 backdrop-blur md:hidden">
        {NAV.slice(0, 5).map((n) => (
          <Link key={n.to} to={n.to} className="p-2 text-muted-foreground" activeProps={{ className: "!text-primary" }}><n.icon className="size-5" /></Link>
        ))}
      </nav>
    </div>
  );
}
