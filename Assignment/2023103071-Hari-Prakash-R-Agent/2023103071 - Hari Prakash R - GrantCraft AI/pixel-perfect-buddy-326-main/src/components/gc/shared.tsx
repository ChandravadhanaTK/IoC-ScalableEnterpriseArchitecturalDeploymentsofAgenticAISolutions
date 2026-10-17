import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Role = "writer" | "auditor" | "director";
export type AuditEntry = { ts: string; actor: string; type: "AGENT" | "TOOL" | "GUARDRAIL" | "HITL"; action: string; hash: string };

export type AppCtx = {
  role: Role;
  audit: AuditEntry[];
  addAudit: (e: Omit<AuditEntry, "ts" | "hash">) => Promise<string>;
  funding: number;
  addFunding: (n: number) => void;
};
export const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("no ctx");
  return c;
};

export function Panel({ title, icon, children, className, right }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={cn("glass p-5", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {icon}
            {title}
          </h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

const tones = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
  accent: "bg-accent/20 text-accent-foreground border-accent/40",
  muted: "bg-muted text-muted-foreground border-border",
};
export type Tone = keyof typeof tones;
export function Pill({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium", tones[tone], className)}>{children}</span>;
}

export function Stat({ label, value, sub, tone = "success" }: { label: string; value: string; sub?: string; tone?: Tone }) {
  return (
    <div className="glass p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-2xl font-bold", tone === "success" ? "text-success" : tone === "danger" ? "text-destructive" : tone === "warning" ? "text-warning" : tone === "info" ? "text-info" : "text-foreground")}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Code({ children }: { children: string }) {
  return <pre className="max-h-80 overflow-auto rounded-lg border bg-background/70 p-3 font-mono text-[11px] leading-relaxed text-info">{children}</pre>;
}

export function PageHead({ kicker, title, desc }: { kicker: string; title: string; desc: string }) {
  return (
    <div className="mb-6">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{kicker}</div>
      <h2 className="mt-1 text-2xl font-bold md:text-3xl">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
