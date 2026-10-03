import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function safe<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export const planInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ interviewId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { orchestratePlan } = await import("./ai/orchestrator.server");
    return safe(() => orchestratePlan(context.supabase, context.userId, data.interviewId));
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ questionId: z.string().uuid(), answer: z.string().trim().min(1).max(8000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { orchestrateEvaluation } = await import("./ai/orchestrator.server");
    return safe(() => orchestrateEvaluation(context.supabase, context.userId, data.questionId, data.answer));
  });

export const completeInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ interviewId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { orchestrateCompletion } = await import("./ai/orchestrator.server");
    return safe(() => orchestrateCompletion(context.supabase, context.userId, data.interviewId));
  });

export const refreshCoaching = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { orchestrateCoaching } = await import("./ai/orchestrator.server");
    return safe(() => orchestrateCoaching(context.supabase, context.userId, null));
  });
