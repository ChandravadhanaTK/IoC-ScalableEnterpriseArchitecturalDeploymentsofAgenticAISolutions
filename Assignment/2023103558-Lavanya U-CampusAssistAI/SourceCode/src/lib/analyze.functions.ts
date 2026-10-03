import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { analyzeCampusIssue } from "./ai/analyze.server";

const inputSchema = z.object({
  issue: z.string().trim().min(1, "Please describe your issue first.").max(1000),
});

export const analyzeIssue = createServerFn({ method: "POST" })
  .validator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    return analyzeCampusIssue(data.issue);
  });
