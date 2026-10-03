import { createServerFn } from "@tanstack/react-start";

export const getAiMode = createServerFn({ method: "GET" }).handler(async () => ({
  mode: process.env["LOVABLE_API_KEY"] ? "AI" : "Demo",
}));
