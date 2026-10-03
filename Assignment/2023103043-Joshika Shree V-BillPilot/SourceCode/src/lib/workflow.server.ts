import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  anomalyAgent, classificationAgent, demoExtraction, reminderAgent, subscriptionAgent,
  validationAgent, CATEGORIES, type Extraction, type HistoryBill,
} from "./agents";

type SB = SupabaseClient<any>;

async function logAgent(sb: SB, workflowId: string, agent: string, fn: () => Promise<{ output: any; confidence?: number }>) {
  await sb.from("workflow_runs").update({ current_agent: agent }).eq("id", workflowId);
  const t0 = Date.now();
  try {
    const { output, confidence } = await fn();
    await sb.from("agent_runs").insert({
      workflow_id: workflowId, agent_name: agent, status: "completed",
      confidence: confidence ?? output?.confidence ?? null, execution_time: Date.now() - t0, output,
    });
    return output;
  } catch (e: any) {
    await sb.from("agent_runs").insert({
      workflow_id: workflowId, agent_name: agent, status: "failed", execution_time: Date.now() - t0, error: String(e?.message ?? e),
    });
    await sb.from("workflow_runs").update({ status: "failed" }).eq("id", workflowId);
    throw e;
  }
}

async function aiExtract(sb: SB, path: string, fileName: string): Promise<Extraction | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  const { data: file } = await sb.storage.from("bills").download(path);
  if (!file) return null;
  const buf = new Uint8Array(await file.arrayBuffer());
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mediaType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const prompt = `You are a bill extraction agent. Read this bill/receipt and return ONLY a JSON object with keys:
merchant (string), invoiceNumber (string), billingDate (YYYY-MM-DD), dueDate (YYYY-MM-DD or empty), amount (number, total payable), currency (ISO code, default INR), confidence (0-1, your certainty in the extraction).
If the document is not a bill, set confidence below 0.5. File name: ${fileName}`;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        mediaType === "application/pdf"
          ? { type: "file", data: buf, mediaType, filename: fileName }
          : { type: "image", image: buf, mediaType },
      ],
    }],
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
  });
  const text = await result.text;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  const j = JSON.parse(m[0]);
  const today = new Date().toISOString().slice(0, 10);
  return {
    merchant: String(j.merchant || "Unknown Provider"),
    invoiceNumber: String(j.invoiceNumber || ""),
    billingDate: /^\d{4}-\d{2}-\d{2}$/.test(j.billingDate) ? j.billingDate : today,
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(j.dueDate) ? j.dueDate : j.billingDate || today,
    amount: Number(j.amount) || 0,
    currency: String(j.currency || "INR").slice(0, 3).toUpperCase(),
    confidence: Math.max(0, Math.min(1, Number(j.confidence) || 0.5)),
  };
}

export async function startWorkflow(sb: SB, userId: string, billId: string, file: { name: string; size: number; type: string; path: string }) {
  const hasKey = !!process.env["LOVABLE_API_KEY"];
  const { data: wf, error } = await sb.from("workflow_runs")
    .insert({ bill_id: billId, status: "running", ai_mode: hasKey ? "AI" : "Demo" }).select().single();
  if (error) throw error;
  await sb.from("audit_logs").insert({ action: "workflow_started", entity: "bill", entity_id: billId });

  const validation = await logAgent(sb, wf.id, "Validation Agent", async () => ({ output: validationAgent(file) }));
  if (!validation.valid) {
    await sb.from("bills").update({ status: "rejected" }).eq("id", billId);
    await sb.from("workflow_runs").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", wf.id);
    return { workflowId: wf.id, status: "failed" };
  }

  let mode = hasKey ? "AI" : "Demo";
  const extraction: Extraction = await logAgent(sb, wf.id, "Extraction Agent", async () => {
    let out: Extraction | null = null;
    try { out = await aiExtract(sb, file.path, file.name); } catch (e) { console.error("AI extraction failed, using demo", e); }
    if (!out) { mode = "Demo"; out = demoExtraction(file.name); }
    return { output: { ...out, mode, reviewRequired: out.confidence < 0.8 } };
  });
  if (mode !== (hasKey ? "AI" : "Demo")) await sb.from("workflow_runs").update({ ai_mode: mode }).eq("id", wf.id);

  await sb.from("bills").update({
    merchant: extraction.merchant, invoice_number: extraction.invoiceNumber, billing_date: extraction.billingDate,
    due_date: extraction.dueDate, amount: extraction.amount, currency: extraction.currency, confidence: extraction.confidence,
  }).eq("id", billId);

  if (extraction.confidence < 0.8) {
    await sb.from("bills").update({ status: "needs_review" }).eq("id", billId);
    await sb.from("workflow_runs").update({ status: "awaiting_review", current_agent: "Human Review" }).eq("id", wf.id);
    return { workflowId: wf.id, status: "awaiting_review" };
  }
  await continueWorkflow(sb, userId, billId, wf.id);
  return { workflowId: wf.id, status: "completed" };
}

export async function continueWorkflow(sb: SB, _userId: string, billId: string, workflowId: string) {
  await sb.from("workflow_runs").update({ status: "running" }).eq("id", workflowId);
  const { data: bill } = await sb.from("bills").select("*").eq("id", billId).single();
  if (!bill) throw new Error("Bill not found");
  const merchant: string = bill.merchant ?? "Unknown Provider";

  const cls = await logAgent(sb, workflowId, "Classification Agent", async () => {
    const r = classificationAgent(merchant);
    const category = bill.category && bill.category !== "Other" && (CATEGORIES as readonly string[]).includes(bill.category) ? bill.category : r.category;
    return { output: { category, confidence: category === r.category ? r.confidence : 1 } };
  });

  const { data: hist } = await sb.from("bills").select("amount,billing_date,invoice_number")
    .eq("merchant", merchant).neq("id", billId).in("status", ["processed", "approved"]);
  const history = (hist ?? []) as HistoryBill[];

  const sub = await logAgent(sb, workflowId, "Subscription Detection Agent", async () => ({
    output: subscriptionAgent(merchant, bill.billing_date ?? new Date().toISOString().slice(0, 10), history),
  }));

  if (sub.isSubscription) {
    const { data: existing } = await sb.from("subscriptions").select("id").eq("merchant", merchant).maybeSingle();
    const row = { merchant, amount: bill.amount, currency: bill.currency, frequency: sub.frequency, next_billing_date: sub.nextBillingDate, category: cls.category, status: "active" };
    if (existing) await sb.from("subscriptions").update(row).eq("id", existing.id);
    else await sb.from("subscriptions").insert(row);
  }

  const anomaly = await logAgent(sb, workflowId, "Anomaly Detection Agent", async () => ({
    output: { ...anomalyAgent(Number(bill.amount), bill.invoice_number ?? "", history), historicalBills: history.length },
    confidence: 0.92,
  }));
  if (anomaly.anomalyDetected) {
    await sb.from("anomalies").insert({
      bill_id: billId, type: anomaly.type, severity: anomaly.severity, previous_amount: anomaly.previousAmount,
      current_amount: anomaly.currentAmount, percentage_change: anomaly.percentageChange,
    });
  }

  const rem = await logAgent(sb, workflowId, "Reminder & Insights Agent", async () => ({
    output: reminderAgent({ merchant, dueDate: bill.due_date, nextBillingDate: sub.nextBillingDate, isSubscription: sub.isSubscription, anomaly }),
  }));
  if (rem.reminders.length) await sb.from("reminders").insert(rem.reminders.map((r: any) => ({ ...r, bill_id: billId })));

  await sb.from("bills").update({ category: cls.category, status: bill.status === "approved" ? "approved" : "processed", updated_at: new Date().toISOString() }).eq("id", billId);
  await sb.from("workflow_runs").update({ status: "completed", current_agent: null, completed_at: new Date().toISOString() }).eq("id", workflowId);
  await sb.from("audit_logs").insert({ action: "workflow_completed", entity: "bill", entity_id: billId });
}
