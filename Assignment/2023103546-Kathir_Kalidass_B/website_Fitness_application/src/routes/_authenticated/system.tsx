import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Layers, Workflow, Rocket, ShieldCheck, Activity, type LucideIcon } from "lucide-react";

import { getDashboardData } from "@/lib/data.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/system")({
  head: () => ({
    meta: [
      { title: "System Blueprint — HFC Holistic Fitness Club" },
      { name: "description", content: "Architecture, AI coach workflow, deployment, security and monitoring of HFC." },
      { property: "og:title", content: "System Blueprint — HFC Holistic Fitness Club" },
      { property: "og:description", content: "Architecture, AI coach workflow, deployment, security and monitoring of HFC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SystemPage,
});

type Section = { id: string; n: number; title: string; sub: string; icon: LucideIcon; color: string };

const SECTIONS: Section[] = [
  { id: "arch", n: 1, title: "Architecture Diagram", sub: "Layers, components, trust boundaries and integrations", icon: Layers, color: "bg-brand" },
  { id: "agent", n: 2, title: "Agent Workflow Design", sub: "Roles, states, tools, handoffs, approvals and failure paths", icon: Workflow, color: "bg-cyan-glow" },
  { id: "deploy", n: 3, title: "Deployment Strategy", sub: "Runtime, scaling, resilience, environments and release", icon: Rocket, color: "bg-brand" },
  { id: "security", n: 4, title: "Security Model", sub: "Identity, authorization, secrets, privacy, guardrails and audit", icon: ShieldCheck, color: "bg-amber-glow" },
  { id: "monitor", n: 5, title: "Monitoring Dashboard", sub: "Health, trace, quality, safety, cost and business outcomes", icon: Activity, color: "bg-cyan-glow" },
];

function SystemPage() {
  const [active, setActive] = useState("arch");
  return (
    <div className="space-y-5">
      <div className="rise">
        <p className="text-[10px] uppercase tracking-[0.22em] text-mist">System Blueprint</p>
        <h1 className="font-display text-3xl font-semibold">Five pillars behind HFC</h1>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-4">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "glass flex w-full items-center gap-4 p-4 text-left transition-colors",
                active === s.id ? "ring-1 ring-brand" : "hover:bg-white/5",
              )}
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-brand-foreground", s.color)}>
                {s.n}
              </span>
              <span>
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="block text-xs text-mist">{s.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <section className="glass rise p-6 lg:col-span-8">
          {active === "arch" && <Architecture />}
          {active === "agent" && <AgentFlow />}
          {active === "deploy" && <Deployment />}
          {active === "security" && <Security />}
          {active === "monitor" && <Monitoring />}
        </section>
      </div>
    </div>
  );
}

function H({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold">
      <Icon className="size-5 text-brand" /> {children}
    </h2>
  );
}

function Grid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([t, d]) => (
        <div key={t} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-sm font-medium">{t}</p>
          <p className="mt-1 text-xs leading-relaxed text-mist">{d}</p>
        </div>
      ))}
    </div>
  );
}

function Architecture() {
  const layers = [
    ["Client", "Web app: dashboard, workouts, nutrition, coach, kids"],
    ["App server", "Typed server functions, session check on every call"],
    ["AI layer", "Coach Aria via secure AI gateway, keys held on server"],
    ["Data", "Cloud database with per-user row protection"],
  ];
  return (
    <>
      <H icon={Layers}>Architecture Diagram</H>
      <div className="space-y-2">
        {layers.map(([t, d], i) => (
          <div key={t}>
            <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <span className="w-24 shrink-0 text-xs uppercase tracking-widest text-brand">{t}</span>
              <span className="text-sm text-mist">{d}</span>
            </div>
            {i < layers.length - 1 && (
              <div className="mx-auto my-1 h-4 w-px bg-brand/40" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-mist">
        Trust boundary: everything below the client runs on the server. Integrations: Google sign-in, AI gateway.
      </p>
    </>
  );
}

function AgentFlow() {
  const steps = ["User message", "Auth check", "Load last 40 messages", "Coach Aria reasons", "Save reply", "Show answer"];
  return (
    <>
      <H icon={Workflow}>Agent Workflow Design</H>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs text-brand ring-1 ring-white/10">{s}</span>
            {i < steps.length - 1 && <span className="text-mist">→</span>}
          </span>
        ))}
      </div>
      <Grid
        items={[
          ["Role", "Coach Aria — concise, evidence-based fitness & nutrition coach"],
          ["Tools & context", "Conversation history and the user's own program"],
          ["Handoff", "Medical questions are redirected to a professional"],
          ["Failure path", "Errors show a friendly notice; nothing half-saved"],
        ]}
      />
    </>
  );
}

function Deployment() {
  return (
    <>
      <H icon={Rocket}>Deployment Strategy</H>
      <Grid
        items={[
          ["Runtime", "Edge servers close to users worldwide"],
          ["Scaling", "Stateless servers scale automatically with traffic"],
          ["Resilience", "Managed database with backups; graceful AI errors"],
          ["Environments", "Preview for testing, Live for members"],
          ["Release", "One-click publish; instant rollback via history"],
          ["Domain", "Custom domain supported"],
        ]}
      />
    </>
  );
}

function Security() {
  return (
    <>
      <H icon={ShieldCheck}>Security Model</H>
      <Grid
        items={[
          ["Identity", "Email/password and Google sign-in"],
          ["Authorization", "Each member can only read and change their own data"],
          ["Secrets", "AI keys never leave the server"],
          ["Privacy", "Workouts, meals and chats are private per member"],
          ["Guardrails", "Input limits, no medical diagnoses from the coach"],
          ["Audit", "Every record is timestamped and owner-tagged"],
        ]}
      />
    </>
  );
}

function Monitoring() {
  const fetchDashboard = useServerFn(getDashboardData);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  const workouts = data?.weekWorkouts ?? [];
  const meals = data?.todayMeals ?? [];
  const minutes = workouts.reduce((s: number, w: any) => s + (w.duration_min ?? 0), 0);
  const stats: [string, string][] = [
    ["Health", isLoading ? "Checking…" : data ? "All systems up" : "Degraded"],
    ["Sessions (7d)", String(workouts.length)],
    ["Minutes trained (7d)", String(minutes)],
    ["Meals today", String(meals.length)],
    ["Streak", `${data?.streak ?? 0} days`],
    ["AI cost model", "Billed per coach request"],
  ];
  return (
    <>
      <H icon={Activity}>Monitoring Dashboard</H>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-widest text-mist">{k}</p>
            <p className="mt-1 font-display text-lg font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <p className="mb-2 mt-6 text-xs uppercase tracking-widest text-mist">Training minutes · last 7 sessions</p>
      <div className="flex h-28 items-end gap-2">
        {(workouts.length ? workouts.slice(-7) : []).map((w: any) => (
          <div
            key={w.id}
            className="flex-1 rounded-t bg-brand transition-all"
            style={{ height: `${Math.min(100, ((w.duration_min ?? 0) / 90) * 100)}%` }}
            title={`${w.title}: ${w.duration_min ?? 0} min`}
          />
        ))}
        {!workouts.length && <p className="text-xs text-mist">No sessions yet — log one to see it here.</p>}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Trace", "Each coach request carries a run ID"],
          ["Quality", "Replies kept under 150 words"],
          ["Safety", "Medical questions redirected"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-sm font-medium">{k}</p>
            <p className="text-xs text-mist">{v}</p>
          </div>
        ))}
      </div>
    </>
  );
}
