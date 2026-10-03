import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Node({ title, sub, tone = "default", className }: { title: string; sub?: string; tone?: "default" | "primary" | "accent" | "warn" | "muted"; className?: string }) {
  const t = {
    default: "bg-card",
    primary: "bg-primary text-primary-foreground border-primary",
    accent: "bg-accent text-accent-foreground border-accent-foreground/20",
    warn: "bg-warning-soft text-warning border-warning/30",
    muted: "bg-muted",
  }[tone];
  return (
    <div className={cn("rounded-md border px-3 py-2 text-center shadow-sm", t, className)}>
      <div className="text-sm font-medium">{title}</div>
      {sub && <div className="mt-0.5 font-mono text-[10px] opacity-75">{sub}</div>}
    </div>
  );
}

export function Arrow({ label, vertical }: { label?: string; vertical?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center text-muted-foreground", vertical ? "flex-col py-1" : "px-1")}>
      <span className="font-mono text-xs">{vertical ? "↓" : "→"}</span>
      {label && <span className="font-mono text-[10px]">{label}</span>}
    </div>
  );
}

export function Layer({ name, children, boundary }: { name: string; children: ReactNode; boundary?: string }) {
  return (
    <div className="relative grid grid-cols-[150px_1fr] items-center gap-4 border-b py-3 last:border-0">
      <div className="eyebrow">{name}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {boundary && (
        <div className="absolute -bottom-px left-0 right-0 flex justify-center">
          <span className="-mb-2.5 rounded bg-danger-soft px-2 font-mono text-[10px] text-danger">TRUST BOUNDARY · {boundary}</span>
        </div>
      )}
    </div>
  );
}

export function Card({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card p-5", className)}>
      <h3 className="mb-2 font-medium">{title}</h3>
      <div className="text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
