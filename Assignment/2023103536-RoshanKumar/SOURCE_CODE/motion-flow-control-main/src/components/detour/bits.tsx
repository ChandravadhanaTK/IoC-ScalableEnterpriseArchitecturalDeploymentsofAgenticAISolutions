import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { toneBg, toneFor, toneText, type Tone } from "@/lib/format";

export function StatusBadge({ status, tone, className }: { status: string; tone?: Tone | undefined; className?: string }) {
  const t = tone ?? toneFor(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider", toneBg[t], className)}>
      <span className={cn("size-1.5 rounded-full bg-current", (t === "agent" || t === "warn") && "animate-pulse")} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString("en-IN"), className }: { value: number; format?: ((n: number) => string) | undefined; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    const c = animate(from, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    return () => c.stop();
  }, [value, format]);
  return <span ref={ref} className={cn("tabular-nums", className)}>{format(0)}</span>;
}

export function Kpi({ label, value, tone = "idle", hint, format }: { label: string; value: number; tone?: Tone; hint?: string; format?: ((n: number) => string) | undefined }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hud-panel relative overflow-hidden p-4">
      <div className={cn("absolute inset-x-0 top-0 h-px", tone === "idle" ? "bg-border" : `bg-${tone}`)} style={{ background: tone !== "idle" ? `var(--${tone})` : undefined }} />
      <div className="label-mono">{label}</div>
      <div className={cn("mt-2 font-mono text-3xl font-semibold", toneText[tone])}>
        <AnimatedNumber value={value} format={format} />
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("hud-panel", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="label-mono !text-foreground/80">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="label-mono">{eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Stagger({ i, children, className }: { i: number; children: ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.03, 0.6), duration: 0.35 }} className={className}>
      {children}
    </motion.div>
  );
}

export function useScrolled(threshold = 24) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => {
      setS(window.scrollY > threshold);
      document.documentElement.style.setProperty("--scroll", String(window.scrollY));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return s;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
