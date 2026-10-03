import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [{ data: profile }, { data: weekWorkouts }, { data: todayMeals }, { data: allWorkouts }] =
      await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", userId).single(),
        supabase
          .from("workout_sessions")
          .select("id, title, duration_min, calories, performed_at")
          .eq("user_id", userId)
          .gte("performed_at", weekAgo)
          .order("performed_at", { ascending: true }),
        supabase
          .from("meals")
          .select("id, name, calories, protein_g, carbs_g, fat_g, eaten_at")
          .eq("user_id", userId)
          .gte("eaten_at", todayStart.toISOString())
          .order("eaten_at", { ascending: true }),
        supabase
          .from("workout_sessions")
          .select("performed_at")
          .eq("user_id", userId)
          .order("performed_at", { ascending: false })
          .limit(60),
      ]);

    // Streak: consecutive days with a workout, counting back from today.
    const days = new Set(
      (allWorkouts ?? []).map((w: { performed_at: string }) => w.performed_at.slice(0, 10)),
    );
    let streak = 0;
    const cursor = new Date();
    if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      displayName: profile?.display_name ?? "Athlete",
      weekWorkouts: weekWorkouts ?? [],
      todayMeals: todayMeals ?? [],
      streak,
    };
  });

export const logWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        title: z.string().min(1).max(120),
        duration_min: z.number().int().min(1).max(600).optional(),
        calories: z.number().int().min(0).max(5000).optional(),
        notes: z.string().max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { error } = await supabase.from("workout_sessions").insert({
      user_id: userId,
      title: data.title,
      duration_min: data.duration_min ?? null,
      calories: data.calories ?? null,
      notes: data.notes ?? null,
    });
    if (error) throw new Error("Could not log the workout.");
    return { ok: true };
  });

export const logMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        name: z.string().min(1).max(120),
        calories: z.number().int().min(0).max(5000),
        protein_g: z.number().min(0).max(500).optional(),
        carbs_g: z.number().min(0).max(800).optional(),
        fat_g: z.number().min(0).max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { error } = await supabase.from("meals").insert({
      user_id: userId,
      name: data.name,
      calories: data.calories,
      protein_g: data.protein_g ?? 0,
      carbs_g: data.carbs_g ?? 0,
      fat_g: data.fat_g ?? 0,
    });
    if (error) throw new Error("Could not log the meal.");
    return { ok: true };
  });
