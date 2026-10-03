import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Footprints, Play, Rocket, Star, Timer, Trophy, Waves, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/kids")({
  head: () => ({
    meta: [
      { title: "Kids Club — HFC Holistic Fitness Club" },
      { name: "description", content: "Fun, age-appropriate movement games for kids." },
      { property: "og:title", content: "Kids Club — HFC Holistic Fitness Club" },
      { property: "og:description", content: "Fun, age-appropriate movement games for kids." },
    ],
  }),
  component: KidsPage,
});

const GAMES: { name: string; icon: LucideIcon; minutes: number; focus: string; desc: string }[] = [
  { name: "Dino Dash", icon: Footprints, minutes: 10, focus: "Cardio", desc: "Stomp, dodge and dash like a raptor on the run." },
  { name: "Hero Jumps", icon: Rocket, minutes: 8, focus: "Power", desc: "Squat, launch and land like your favourite hero." },
  { name: "Balance Wave", icon: Waves, minutes: 6, focus: "Balance", desc: "Ride the wave — one foot, slow and steady." },
  { name: "Star Stretches", icon: Star, minutes: 5, focus: "Mobility", desc: "Reach wide, breathe deep, shine like a star." },
];

function KidsPage() {
  const [badges, setBadges] = useState(2);

  function complete(game: string) {
    setBadges((b) => b + 1);
    toast.success(`${game} complete! Badge earned`);
  }

  return (
    <div style={{ fontFamily: "var(--font-kids)" }}>
      <section className="glass rise relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-brand/15 blur-3xl" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-mist">Kids Club</p>
        <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-semibold">
          Little Movers <Rocket className="size-7 text-brand" />
        </h1>
        <p className="mt-2 max-w-md text-sm text-mist">
          Short, playful sessions that build strength, balance and focus — no equipment needed.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm font-bold text-brand ring-1 ring-white/10">
            <Trophy className="size-4" /> {badges} badges earned
          </span>
          <span className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-mist ring-1 ring-white/10">
            <Star className="size-4 text-amber-glow" /> 4 to the next level
          </span>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {GAMES.map((g, i) => (
          <section
            key={g.name}
            className="glass rise flex flex-col p-6"
            style={{ animationDelay: `${80 + i * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand/10 ring-1 ring-white/10">
                <g.icon className="size-6 text-brand" />
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-mist ring-1 ring-white/10">
                <Timer className="size-3" /> {g.minutes} min
              </span>
            </div>
            <h2 className="mt-3 text-lg font-bold">{g.name}</h2>
            <p className="mt-1 text-sm text-mist">{g.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand">
                {g.focus}
              </span>
              <button
                onClick={() => complete(g.name)}
                className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
              >
                <span className="flex items-center gap-1.5">Play <Play className="size-3.5 fill-current" /></span>
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
