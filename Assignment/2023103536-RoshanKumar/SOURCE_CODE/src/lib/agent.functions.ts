import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const simulateDisruption = createServerFn({ method: "POST" })
  .validator((d) => z.object({ disruptionId: z.string().max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { startRun } = await import("./agent.server");
    return startRun(data.disruptionId);
  });

export const agentStep = createServerFn({ method: "POST" })
  .validator((d) => z.object({ runId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { stepRun } = await import("./agent.server");
    return stepRun(data.runId);
  });

export const respondApproval = createServerFn({ method: "POST" })
  .validator((d) => z.object({ actionId: z.string().uuid(), approve: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { decideApproval } = await import("./agent.server");
    await decideApproval(data.actionId, data.approve);
    return { ok: true };
  });

export const resetDemoFn = createServerFn({ method: "POST" }).handler(async () => {
  const { resetDemo } = await import("./agent.server");
  await resetDemo();
  return { ok: true };
});
