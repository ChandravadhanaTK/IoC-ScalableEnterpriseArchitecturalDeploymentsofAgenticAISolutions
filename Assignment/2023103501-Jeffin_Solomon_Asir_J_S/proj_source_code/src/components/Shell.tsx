import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FilePlus2, Activity, ShieldCheck, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import { resetDemo, type Status } from "@/lib/store";

const NAV = [
  { to: "/", label: "Audit Queue", icon: LayoutDashboard },
  { to: "/submit", label: "Submit Claim", icon: FilePlus2 },
  { to: "/policies", label: "Policy Book", icon: ScrollText },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink p-5 text-ink-foreground md:flex">
        <div className="mb-8 flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-accent" />
          <div>
            <div className="font-display text-xl leading-none">AuditLens</div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">Invoice & Expense Agent</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm opacity-75 hover:opacity-100 data-[status=active]:bg-ink-foreground/10 data-[status=active]:opacity-100">
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3 text-xs opacity-60">
          <button onClick={resetDemo} className="underline">Reset demo data</button>
          <p>Jeffin Solomon Asir J S<br />2023103501</p>
        </div>
      </aside>
      <div className="flex-1">
        <nav className="flex gap-3 overflow-x-auto border-b bg-ink px-4 py-3 text-sm text-ink-foreground md:hidden">
          {NAV.map((n) => <Link key={n.to} to={n.to} className="whitespace-nowrap">{n.label}</Link>)}
        </nav>
        <main className="mx-auto max-w-6xl p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}

export function StatusStamp({ s }: { s: Status }) {
  const map: Record<Status, [string, string]> = {
    PENDING: ["stamp-idle", "Pending"],
    AUTO_APPROVED: ["stamp-ok", "Auto-approved"],
    APPROVED: ["stamp-ok", "Approved"],
    NEEDS_REVIEW: ["stamp-warn", "Needs review"],
    REJECTED: ["stamp-bad", "Rejected"],
  };
  return <span className={`stamp ${map[s][0]}`}>{map[s][1]}</span>;
}
