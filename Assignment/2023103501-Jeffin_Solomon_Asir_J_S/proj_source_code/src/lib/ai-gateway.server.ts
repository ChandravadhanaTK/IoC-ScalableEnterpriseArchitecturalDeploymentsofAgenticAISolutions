import { createOpenAI } from "@ai-sdk/openai";

const RUN_ID = "X-Lovable-AIG-Run-ID";

export function createGatewayProvider(apiKey: string, initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  const fetchWithRunId = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    return res;
  };
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: fetchWithRunId,
  });
  return { provider, getRunId: () => runId };
}
