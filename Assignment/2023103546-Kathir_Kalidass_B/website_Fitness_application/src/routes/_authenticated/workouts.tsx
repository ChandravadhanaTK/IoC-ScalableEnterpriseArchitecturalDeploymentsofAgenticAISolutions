import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Clock, Flame } from "lucide-react";
import { toast } from "sonner";

import { getDashboardData, logWorkout } from "@/lib/data.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/workouts")({
  head: () => ({
    meta: [
      { title: "Workouts — HFC Holistic Fitness Club" },
      { name: "description", content: "Log and review your training sessions." },
      { property: "og:title", content: "Workouts — HFC Holistic Fitness Club" },
      { property: "og:description", content: "Log and review your training sessions." },
    ],
  }),
  component: WorkoutsPage,
});

function WorkoutsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fetchDashboard = useServerFn(getDashboardData);
  const doLog = useServerFn(logWorkout);

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  const sessions = [...(data?.weekWorkouts ?? [])].reverse();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await doLog({
        data: {
          title,
          duration_min: duration ? Number(duration) : undefined,
          calories: calories ? Number(calories) : undefined,
        },
      });
      setTitle("");
      setDuration("");
      setCalories("");
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.invalidate();
      toast.success("Workout logged — nice work!");
    } catch {
      toast.error("Could not log the workout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <section className="glass rise p-6 lg:col-span-5">
        <h1 className="font-display text-2xl font-semibold">Log a workout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every session counts toward your streak.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Push · Hypertrophy A"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="380"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full bg-brand font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" /> {busy ? "Saving…" : "Log session"}
          </Button>
        </form>
      </section>

      <section className="glass rise p-6 lg:col-span-7" style={{ animationDelay: "100ms" }}>
        <h2 className="font-display text-xl font-semibold">Last 7 days</h2>
        {sessions.length === 0 ? (
          <p className="mt-6 text-sm text-mist">
            No sessions yet this week — log your first one and start the streak.
          </p>
        ) : (
          <div className="mt-4 space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border-b border-white/5 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-[11px] text-mist">
                    {new Date(s.performed_at).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-mist">
                  {s.duration_min != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {s.duration_min}m
                    </span>
                  )}
                  {s.calories != null && (
                    <span className="flex items-center gap-1">
                      <Flame className="size-3.5 text-brand" /> {s.calories} kcal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
