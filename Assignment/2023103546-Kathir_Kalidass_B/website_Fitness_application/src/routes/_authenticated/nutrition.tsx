import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { getDashboardData, logMeal } from "@/lib/data.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition — HFC Holistic Fitness Club" },
      { name: "description", content: "Log meals and track your daily macros." },
      { property: "og:title", content: "Nutrition — HFC Holistic Fitness Club" },
      { property: "og:description", content: "Log meals and track your daily macros." },
    ],
  }),
  component: NutritionPage,
});

function NutritionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fetchDashboard = useServerFn(getDashboardData);
  const doLog = useServerFn(logMeal);

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  const meals = data?.todayMeals ?? [];
  const totalKcal = meals.reduce((s: number, m: any) => s + (m.calories ?? 0), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await doLog({
        data: {
          name,
          calories: Number(calories),
          protein_g: protein ? Number(protein) : undefined,
          carbs_g: carbs ? Number(carbs) : undefined,
          fat_g: fat ? Number(fat) : undefined,
        },
      });
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
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
      <section className="glass rise p-6 lg:col-span-5">
        <h1 className="font-display text-2xl font-semibold">Log a meal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalKcal.toLocaleString()} of 2,400 kcal logged today.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal">Meal</Label>
            <Input
              id="meal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chicken + quinoa bowl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kcal">Calories</Label>
              <Input
                id="kcal"
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="540"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                min={0}
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="42"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                min={0}
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="55"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                min={0}
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="14"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full bg-brand font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" /> {busy ? "Saving…" : "Log meal"}
          </Button>
        </form>
      </section>

      <section className="glass rise p-6 lg:col-span-7" style={{ animationDelay: "100ms" }}>
        <h2 className="font-display text-xl font-semibold">Today's plate</h2>
        {meals.length === 0 ? (
          <p className="mt-6 text-sm text-mist">Nothing logged yet — fuel up and log it here.</p>
        ) : (
          <div className="mt-4 space-y-1">
            {meals.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center justify-between border-b border-white/5 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-[11px] text-mist">
                    {new Date(m.eaten_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-mist">
                  <span>{m.calories} kcal</span>
                  {Number(m.protein_g) > 0 && (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 font-bold text-brand">
                      {Math.round(Number(m.protein_g))}g P
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
