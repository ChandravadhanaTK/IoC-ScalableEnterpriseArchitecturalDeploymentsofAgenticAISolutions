import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { continueWorkflow, startWorkflow } from "./workflow.server";

export const processBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ billId: z.string().uuid(), name: z.string(), size: z.number(), type: z.string(), path: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { billId, ...file } = data;
    return startWorkflow(context.supabase as any, context.userId, billId, file);
  });

export const approveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    billId: z.string().uuid(),
    merchant: z.string().min(1).max(120), invoiceNumber: z.string().max(60), billingDate: z.string(), dueDate: z.string(),
    amount: z.number().nonnegative(), category: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await sb.from("bills").update({
      merchant: data.merchant, invoice_number: data.invoiceNumber, billing_date: data.billingDate || null,
      due_date: data.dueDate || null, amount: data.amount, category: data.category, confidence: 1, status: "approved",
    }).eq("id", data.billId);
    await sb.from("audit_logs").insert({ action: "review_approved", entity: "bill", entity_id: data.billId });
    const { data: wf } = await sb.from("workflow_runs").select("id").eq("bill_id", data.billId).order("started_at", { ascending: false }).limit(1).single();
    if (wf) await continueWorkflow(sb, context.userId, data.billId, wf.id);
    return { ok: true };
  });

export const retryWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ billId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { data: bill } = await sb.from("bills").select("*").eq("id", data.billId).single();
    if (!bill?.document_url) throw new Error("No document to reprocess");
    await sb.from("anomalies").delete().eq("bill_id", data.billId);
    await sb.from("reminders").delete().eq("bill_id", data.billId);
    await sb.from("bills").update({ status: "processing" }).eq("id", data.billId);
    await sb.from("audit_logs").insert({ action: "workflow_retried", entity: "bill", entity_id: data.billId });
    return startWorkflow(sb, context.userId, data.billId, { name: bill.file_name ?? "bill.pdf", size: 1, type: "", path: bill.document_url });
  });

export const loadDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const today = new Date();
    const d = (offsetDays: number) => { const x = new Date(today); x.setDate(x.getDate() + offsetDays); return x.toISOString().slice(0, 10); };
    const rows: any[] = [];
    const add = (merchant: string, category: string, amounts: number[], gap: number, conf = 0.95) => {
      amounts.forEach((amount, i) => {
        const back = (amounts.length - 1 - i) * gap;
        rows.push({ merchant, category, amount, currency: "INR", billing_date: d(-back - 2), due_date: d(-back + 3),
          invoice_number: `${merchant.slice(0, 3).toUpperCase()}-${1000 + i}`, confidence: conf, status: "processed" });
      });
    };
    add("Netflix", "Entertainment", [649, 649, 649, 799], 30);
    add("Spotify", "Entertainment", [119, 119, 119, 119], 30);
    add("AWS", "Software", [1990, 2100, 1990, 2350], 30);
    add("Electricity Board", "Utilities", [1620, 1710, 1840, 1795], 30);
    add("Airtel Mobile", "Mobile", [399, 399, 399], 30);
    add("ACT Fibernet", "Internet", [999, 999, 999], 30);
    add("Amazon Prime", "Shopping", [1499], 365);
    add("Apollo Pharmacy", "Healthcare", [760], 30);
    rows.push({ merchant: "Unknown Provider", category: "Other", amount: 1299, currency: "INR", billing_date: d(0), due_date: d(7), invoice_number: "UNK-77", confidence: 0.64, status: "needs_review" });
    const { data: bills, error } = await sb.from("bills").insert(rows).select();
    if (error) throw new Error(error.message);
    const byM = (m: string) => bills.filter((b: any) => b.merchant === m).sort((a: any, b: any) => b.billing_date.localeCompare(a.billing_date))[0];

    await sb.from("subscriptions").insert([
      { merchant: "Netflix", amount: 799, frequency: "Monthly", next_billing_date: d(3), category: "Entertainment" },
      { merchant: "Spotify", amount: 119, frequency: "Monthly", next_billing_date: d(5), category: "Entertainment" },
      { merchant: "AWS", amount: 2350, frequency: "Monthly", next_billing_date: d(12), category: "Software" },
      { merchant: "Electricity Board", amount: 1795, frequency: "Monthly", next_billing_date: d(1), category: "Utilities" },
      { merchant: "Airtel Mobile", amount: 399, frequency: "Monthly", next_billing_date: d(8), category: "Mobile" },
      { merchant: "ACT Fibernet", amount: 999, frequency: "Monthly", next_billing_date: d(15), category: "Internet" },
      { merchant: "Amazon Prime", amount: 1499, frequency: "Yearly", next_billing_date: d(106), category: "Shopping" },
    ].map((s) => ({ ...s, currency: "INR", status: "active" })));
    await sb.from("anomalies").insert([
      { bill_id: byM("Netflix").id, type: "PRICE_INCREASE", severity: "MEDIUM", previous_amount: 649, current_amount: 799, percentage_change: 23.11 },
      { bill_id: byM("AWS").id, type: "PRICE_INCREASE", severity: "MEDIUM", previous_amount: 1990, current_amount: 2350, percentage_change: 18.09 },
    ]);
    await sb.from("reminders").insert([
      { bill_id: byM("Netflix").id, message: "Netflix subscription renews in 3 days.", reminder_date: d(0) },
      { bill_id: byM("Electricity Board").id, message: "Electricity bill is due tomorrow.", reminder_date: d(0) },
      { bill_id: byM("AWS").id, message: "Your AWS bill increased by 18.09% compared with last month.", reminder_date: d(0) },
      { bill_id: byM("Spotify").id, message: "Spotify subscription renews in 5 days.", reminder_date: d(2) },
    ]);
    const net = byM("Netflix");
    const { data: wf } = await sb.from("workflow_runs").insert({ bill_id: net.id, status: "completed", ai_mode: "Demo", completed_at: new Date().toISOString() }).select().single();
    const agents = [
      ["Validation Agent", 0.95, { valid: true, documentType: "bill", confidence: 0.95, issues: [] }],
      ["Extraction Agent", 0.94, { merchant: "Netflix", amount: 799, currency: "INR", confidence: 0.94 }],
      ["Classification Agent", 0.96, { category: "Entertainment", confidence: 0.96 }],
      ["Subscription Detection Agent", 0.93, { isSubscription: true, frequency: "Monthly", nextBillingDate: d(3), confidence: 0.93 }],
      ["Anomaly Detection Agent", 0.92, { anomalyDetected: true, type: "PRICE_INCREASE", previousAmount: 649, currentAmount: 799, percentageChange: 23.11, severity: "MEDIUM" }],
      ["Reminder & Insights Agent", 0.97, { reminders: [{ message: "Netflix subscription renews in 3 days." }] }],
    ] as const;
    await sb.from("agent_runs").insert(agents.map(([agent_name, confidence, output], i) => ({
      workflow_id: wf.id, agent_name, status: "completed", confidence, execution_time: 40 + i * 37, output,
    })));
    const unk = bills.find((b: any) => b.merchant === "Unknown Provider");
    const { data: wf2 } = await sb.from("workflow_runs").insert({ bill_id: unk.id, status: "awaiting_review", current_agent: "Human Review", ai_mode: "Demo" }).select().single();
    await sb.from("agent_runs").insert([
      { workflow_id: wf2.id, agent_name: "Validation Agent", status: "completed", confidence: 0.95, execution_time: 31, output: { valid: true, issues: [] } },
      { workflow_id: wf2.id, agent_name: "Extraction Agent", status: "completed", confidence: 0.64, execution_time: 88, output: { merchant: "Unknown Provider", amount: 1299, confidence: 0.64, reviewRequired: true } },
    ]);
    await sb.from("audit_logs").insert({ action: "demo_data_loaded", entity: "account" });
    return { ok: true, bills: bills.length };
  });
