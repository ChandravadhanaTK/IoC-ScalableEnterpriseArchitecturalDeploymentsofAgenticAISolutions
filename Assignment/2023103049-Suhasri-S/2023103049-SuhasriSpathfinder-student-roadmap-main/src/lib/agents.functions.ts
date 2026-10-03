import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as A from "./agents.server";

export const buildCareerPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await A.runCareerAnalysis(context.supabase, context.userId);
    const rm = await A.runRoadmapPlanning(context.supabase, context.userId);
    return { roadmapId: rm.id };
  });

export const reanalyzeCareer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await A.runCareerAnalysis(context.supabase, context.userId);
    return { ok: true };
  });

export const analyzeProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { report } = await A.runProgressAnalysis(context.supabase, context.userId);
    let proposalId: string | null = null;
    if (report.significant_issue) {
      const p = await A.runAdaptivePlanning(context.supabase, context.userId, report);
      proposalId = p?.id ?? null;
    }
    return { report, proposalId };
  });

export const startAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ skill: z.string().min(1).max(80), difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]) }).parse(d))
  .handler(({ context, data }) => A.createAssessment(context.supabase, context.userId, data.skill, data.difficulty));

export const finishAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), answers: z.array(z.number().int()) }).parse(d))
  .handler(({ context, data }) => A.submitAssessment(context.supabase, context.userId, data.id, data.answers));

export const decideChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), accept: z.boolean() }).parse(d))
  .handler(({ context, data }) => A.decideProposal(context.supabase, context.userId, data.id, data.accept));

export const askMentor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ message: z.string().trim().min(1).max(2000) }).parse(d))
  .handler(async ({ context, data }) => ({ reply: await A.mentorReply(context.supabase, context.userId, data.message) }));
