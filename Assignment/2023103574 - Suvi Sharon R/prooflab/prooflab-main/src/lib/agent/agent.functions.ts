// Server function: runs a single agent stage. The client orchestrates the stage sequence.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { STAGES, type StageId, type StageResults } from "./types";

const stageIds = STAGES.map((s) => s.id) as [StageId, ...StageId[]];

const inputSchema = z.object({
  stage: z.enum(stageIds),
  idea: z.string().trim().min(15, "Please describe your idea in at least 15 characters.").max(2000),
  context: z.record(z.unknown()).default({}),
});

export const runStage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { runJsonPrompt } = await import("../ai.server");
    const { SYSTEM, buildPrompt } = await import("./prompts.server");
    try {
      const result = await runJsonPrompt<unknown>(SYSTEM, buildPrompt(data.stage, data.idea, data.context as StageResults));
      return { ok: true as const, result };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Stage failed." };
    }
  });
