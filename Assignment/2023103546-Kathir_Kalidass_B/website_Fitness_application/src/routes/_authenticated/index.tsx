import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Plus, Flame } from "lucide-react";
import { toast } from "sonner";

import { getDashboardData, logWorkout, logMeal } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — HFC Holistic Fitness Club" },
      { name: "description", content: "Your training, nutrition and recovery at a glance." },
      { property: "og:title", content: "Dashboard — HFC Holistic Fitness Club" },
      { property: "og:description", content: "Your training, nutrition and recovery at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fetchDashboard = useServerFn(getDashboardData);
  const doLogWorkout = useServerFn(logWorkout);
  const doLogMeal = useServerFn(logMeal);
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const weekWorkouts = data?.weekWorkouts ?? [];
  const todayMeals = data?.todayMeals ?? [];
  const streak = data?.streak ?? 0;

  // Weekly volume per weekday (minutes trained)
  const perDay = [0, 0, 0, 0, 0, 0, 0];
  for (const w of weekWorkouts) {
    perDay[new Date(w.performed_at).getDay()] += w.duration_min ?? 30;
  }
  const ordered = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  const maxDay = Math.max(...perDay, 1);

  const kcal = todayMeals.reduce((s: number, m: any) => s + (m.calories ?? 0), 0);
  const protein = todayMeals.reduce((s: number, m: any) => s + Number(m.protein_g ?? 0), 0);
  const carbs = todayMeals.reduce((s: number, m: any) => s + Number(m.carbs_g ?? 0), 0);
  const fat = todayMeals.reduce((s: number, m: any) => s + Number(m.fat_g ?? 0), 0);
  const kcalGoal = 2400;

  async function quickWorkout() {
    setBusy(true);
    try {
      await doLogWorkout({ data: { title: "Quick session", duration_min: 30, calories: 250 } });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.invalidate();
      toast.success("Workout logged — nice work!");
    } catch {
      toast.error("Could not log the workout.");
    } finally {
      setBusy(false);
    }
  }

  async function quickMeal() {
    setBusy(true);
    try {
      await doLogMeal({ data: { name: "Quick meal", calories: 400, protein_g: 30 } });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.invalidate();
      toast.success("Meal logged.");
    } catch {
      toast.error("Could not log the meal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Today's session */}
      <section className="glass rise p-6 lg:col-span-5">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-mist">Today</p>
            <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">
              Push · Hypertrophy A
            </h2>
          </div>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand ring-1 ring-white/10">
            {weekWorkouts.length > 0 ? "On track" : "Ready"}
          </span>
        </div>
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.min(100, (weekWorkouts.length / 4) * 100)}%` }}
          />
        </div>
        <div className="space-y-1">
          {[
            ["Bench Press", "4 × 8 · 60 kg"],
            ["Incline DB Press", "3 × 10 · 22 kg"],
            ["Overhead Press", "3 × 8 · 30 kg"],
          ].map(([name, detail], i) => (
            <div
              key={name}
              className="flex items-center justify-between border-b border-white/5 py-2 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-md bg-white/5 text-[11px] font-medium text-mist">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm">{name}</p>
                  <p className="text-[11px] text-mist">{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/workouts"
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-brand-foreground ring-1 ring-brand transition-colors hover:bg-brand/90"
        >
          <Play className="size-4" /> Open workouts
        </Link>
      </section>

      {/* Macros + streak */}
      <section className="glass rise p-6 lg:col-span-4" style={{ animationDelay: "80ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium">Today's Macros</p>
          <span className="text-[11px] text-mist">
            {kcal.toLocaleString()} / {kcalGoal.toLocaleString()} kcal
          </span>
        </div>
        <div className="relative mx-auto size-[168px]">
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-mist">Streak</p>
              <p className="font-display text-4xl font-semibold leading-none">{streak}</p>
              <p className="text-[11px] text-brand">days active</p>
            </div>
          </div>
          <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="7" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-brand)" strokeWidth="7" strokeLinecap="round" strokeDasharray="339" strokeDashoffset={339 - (339 * Math.min(kcal, kcalGoal)) / kcalGoal} />
            <circle cx="60" cy="60" r="42" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="7" />
            <circle cx="60" cy="60" r="42" fill="none" stroke="var(--color-cyan-glow)" strokeWidth="7" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={264 - (264 * Math.min(protein, 160)) / 160} />
            <circle cx="60" cy="60" r="30" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="7" />
            <circle cx="60" cy="60" r="30" fill="none" stroke="var(--color-amber-glow)" strokeWidth="7" strokeLinecap="round" strokeDasharray="188" strokeDashoffset={188 - (188 * Math.min(carbs, 260)) / 260} />
          </svg>
        </div>
        <div className="mt-4 flex justify-center gap-5">
          <LegendDot color="bg-brand" label={`Protein ${Math.round(protein)}g`} />
          <LegendDot color="bg-cyan-glow" label={`Carbs ${Math.round(carbs)}g`} />
          <LegendDot color="bg-amber-glow" label={`Fat ${Math.round(fat)}g`} />
        </div>
      </section>

      {/* Quick log + AI coach teaser */}
      <div className="flex flex-col gap-5 lg:col-span-3">
        <section className="glass rise p-5" style={{ animationDelay: "120ms" }}>
          <p className="mb-3 text-sm font-medium">Quick log</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={quickWorkout}
              disabled={busy}
              className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-brand text-sm font-semibold text-brand-foreground ring-1 ring-brand transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              <Plus className="size-4" /> Workout
            </button>
            <button
              onClick={quickMeal}
              disabled={busy}
              className="h-10 rounded-[10px] bg-white/5 text-sm ring-1 ring-white/10 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Meal
            </button>
          </div>
        </section>
        <section className="glass rise flex flex-1 flex-col p-5" style={{ animationDelay: "160ms" }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-brand" />
            <p className="text-sm font-medium">AI Coach</p>
          </div>
          <p className="text-xs leading-relaxed text-mist">
            Ask Coach Aria anything — training tweaks, meal ideas, recovery advice. She knows your
            program.
          </p>
          <Link
            to="/coach"
            className="mt-auto flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-white/5 text-sm ring-1 ring-white/10 transition-colors hover:bg-white/10"
          >
            Open chat →
          </Link>
        </section>
      </div>

      {/* Weekly progress */}
      <section className="glass rise p-6 lg:col-span-8" style={{ animationDelay: "200ms" }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-mist">Weekly Progress</p>
            <h3 className="font-display text-xl font-semibold leading-tight">
              Training minutes · last 7 days
            </h3>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-mist ring-1 ring-white/10">
            <Flame className="size-3.5 text-brand" /> {weekWorkouts.length} sessions
          </span>
        </div>
        <div className="relative h-[180px]">
          <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-3">
            {ordered.map((d) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-brand/15 transition-all"
                  style={{
                    height: `${Math.max(4, ((perDay[d] ?? 0) / maxDay) * 100)}%`,
                    backgroundColor:
                      (perDay[d] ?? 0) === maxDay && (perDay[d] ?? 0) > 0
                        ? "var(--color-brand)"
                        : undefined,
                  }}
                />
                <span className="text-[10px] text-mist">{DAYS[d]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recovery */}
      <section className="glass rise flex flex-col p-6 lg:col-span-4" style={{ animationDelay: "240ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium">Recovery</p>
          <span className="text-[11px] text-mist">HRV 68ms</span>
        </div>
        <div className="mb-4 flex h-24 items-end gap-1.5">
          {[40, 55, 48, 70, 62, 85, 92].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                backgroundColor:
                  i === 6 ? "var(--color-brand)" : "color-mix(in oklab, var(--color-brand) 20%, transparent)",
              }}
            />
          ))}
        </div>
        <p className="text-xs leading-relaxed text-mist">
          Readiness is high — prime window for heavy compounds today.
        </p>
      </section>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${color}`} />
      <span className="text-xs text-mist">{label}</span>
    </div>
  );
}
