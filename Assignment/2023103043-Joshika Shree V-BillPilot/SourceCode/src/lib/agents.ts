// Deterministic agent logic shared by the orchestrator (also used as Demo AI Mode fallback).

export const CATEGORIES = [
  "Utilities", "Internet", "Mobile", "Entertainment", "Software", "Education",
  "Shopping", "Healthcare", "Transportation", "Insurance", "Other",
] as const;

export const AGENT_ORDER = [
  "Validation Agent",
  "Extraction Agent",
  "Classification Agent",
  "Subscription Detection Agent",
  "Anomaly Detection Agent",
  "Reminder & Insights Agent",
] as const;

export type Extraction = {
  merchant: string;
  invoiceNumber: string;
  billingDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  confidence: number;
};

export type HistoryBill = { amount: number; billing_date: string | null; invoice_number: string | null };

const KNOWN: { keys: string[]; merchant: string; category: string; amount: number; recurring?: string }[] = [
  { keys: ["netflix"], merchant: "Netflix", category: "Entertainment", amount: 649, recurring: "Monthly" },
  { keys: ["spotify"], merchant: "Spotify", category: "Entertainment", amount: 119, recurring: "Monthly" },
  { keys: ["prime", "amazon"], merchant: "Amazon Prime", category: "Shopping", amount: 1499, recurring: "Yearly" },
  { keys: ["hotstar", "disney"], merchant: "Disney+ Hotstar", category: "Entertainment", amount: 299, recurring: "Monthly" },
  { keys: ["youtube"], merchant: "YouTube Premium", category: "Entertainment", amount: 129, recurring: "Monthly" },
  { keys: ["aws"], merchant: "AWS", category: "Software", amount: 2350, recurring: "Monthly" },
  { keys: ["github"], merchant: "GitHub", category: "Software", amount: 340, recurring: "Monthly" },
  { keys: ["notion"], merchant: "Notion", category: "Software", amount: 800, recurring: "Monthly" },
  { keys: ["electric", "bescom", "tneb", "power"], merchant: "Electricity Board", category: "Utilities", amount: 1840, recurring: "Monthly" },
  { keys: ["water"], merchant: "Water Board", category: "Utilities", amount: 420, recurring: "Quarterly" },
  { keys: ["gas"], merchant: "Gas Agency", category: "Utilities", amount: 905 },
  { keys: ["airtel", "jio", "vodafone", "vi_", "mobile", "recharge"], merchant: "Airtel Mobile", category: "Mobile", amount: 399, recurring: "Monthly" },
  { keys: ["broadband", "fiber", "act", "wifi", "internet"], merchant: "ACT Fibernet", category: "Internet", amount: 999, recurring: "Monthly" },
  { keys: ["coursera", "udemy", "tuition", "college", "school"], merchant: "Coursera", category: "Education", amount: 3999, recurring: "Yearly" },
  { keys: ["hospital", "pharma", "apollo", "clinic", "medic"], merchant: "Apollo Pharmacy", category: "Healthcare", amount: 760 },
  { keys: ["uber", "ola", "metro", "fuel", "petrol"], merchant: "Uber", category: "Transportation", amount: 340 },
  { keys: ["insurance", "lic", "policy"], merchant: "LIC Insurance", category: "Insurance", amount: 5200, recurring: "Yearly" },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

// AGENT 1
export function validationAgent(file: { name: string; size: number; type: string }) {
  const issues: string[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!file.name) issues.push("Missing input file");
  if (!["pdf", "png", "jpg", "jpeg"].includes(ext)) issues.push(`Unsupported file type .${ext}`);
  if (file.size > 10 * 1024 * 1024) issues.push("File exceeds 10 MB limit");
  if (file.size === 0) issues.push("File is empty");
  return { valid: issues.length === 0, documentType: "bill", confidence: issues.length ? 0.3 : 0.95, issues };
}

// AGENT 2 (fallback)
export function demoExtraction(fileName: string): Extraction {
  const n = fileName.toLowerCase();
  const known = KNOWN.find((k) => k.keys.some((key) => n.includes(key)));
  const amountInName = n.match(/(\d{2,6})(?:\.\d{1,2})?/);
  const today = new Date();
  const amount = amountInName ? Number(amountInName[1]) : known ? known.amount : 500 + (hash(n) % 1500);
  return {
    merchant: known?.merchant ?? "Unknown Provider",
    invoiceNumber: `INV-${(hash(n) % 900000) + 100000}`,
    billingDate: iso(today),
    dueDate: iso(addDays(today, 5)),
    amount,
    currency: "INR",
    confidence: known ? 0.94 : 0.64,
  };
}

// AGENT 3
export function classificationAgent(merchant: string) {
  const n = merchant.toLowerCase();
  const known = KNOWN.find((k) => k.merchant.toLowerCase() === n || k.keys.some((key) => n.includes(key)));
  return known ? { category: known.category, confidence: 0.96 } : { category: "Other", confidence: 0.55 };
}

// AGENT 4
export function subscriptionAgent(merchant: string, billingDate: string, history: HistoryBill[]) {
  const dates = [billingDate, ...history.map((h) => h.billing_date).filter(Boolean) as string[]]
    .map((d) => new Date(d).getTime()).sort((a, b) => a - b);
  const known = KNOWN.find((k) => k.merchant === merchant);
  let frequency: string | null = null;
  let confidence = 0.5;
  if (dates.length >= 2) {
    const gaps = dates.slice(1).map((d, i) => (d - dates[i]!) / 86400000).filter((g) => g > 0);
    const avg = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
    if (avg >= 25 && avg <= 35) frequency = "Monthly";
    else if (avg >= 80 && avg <= 100) frequency = "Quarterly";
    else if (avg >= 350 && avg <= 380) frequency = "Yearly";
    else if (gaps.length) frequency = "Custom";
    confidence = frequency && frequency !== "Custom" ? 0.93 : 0.7;
  } else if (known?.recurring) {
    frequency = known.recurring;
    confidence = 0.85;
  }
  const isSubscription = !!frequency;
  const step = frequency === "Yearly" ? 365 : frequency === "Quarterly" ? 91 : 30;
  return {
    isSubscription,
    frequency: frequency ?? "None",
    nextBillingDate: isSubscription ? iso(addDays(new Date(billingDate), step)) : null,
    confidence,
  };
}

// AGENT 5
export function anomalyAgent(amount: number, invoiceNumber: string, history: HistoryBill[]) {
  if (history.some((h) => h.invoice_number && h.invoice_number === invoiceNumber)) {
    return { anomalyDetected: true, type: "DUPLICATE_BILL", previousAmount: amount, currentAmount: amount, percentageChange: 0, severity: "HIGH" };
  }
  if (!history.length) return { anomalyDetected: false, type: null, previousAmount: null, currentAmount: amount, percentageChange: 0, severity: null };
  const sorted = [...history].sort((a, b) => (b.billing_date ?? "").localeCompare(a.billing_date ?? ""));
  const prev = Number(sorted[0]!.amount);
  const avg = history.reduce((a, b) => a + Number(b.amount), 0) / history.length;
  const pct = prev ? Math.round(((amount - prev) / prev) * 10000) / 100 : 0;
  let type: string | null = null;
  if (amount > avg * 1.8) type = "UNUSUALLY_HIGH";
  else if (pct >= 5) type = "PRICE_INCREASE";
  else if (Math.abs(pct) >= 15) type = "UNEXPECTED_CHANGE";
  const abs = Math.abs(pct);
  const severity = type ? (abs >= 40 || type === "UNUSUALLY_HIGH" ? "HIGH" : abs >= 15 ? "MEDIUM" : "LOW") : null;
  return { anomalyDetected: !!type, type, previousAmount: prev, currentAmount: amount, percentageChange: pct, severity };
}

// AGENT 6
export function reminderAgent(args: {
  merchant: string; dueDate: string | null; nextBillingDate: string | null;
  isSubscription: boolean; anomaly: ReturnType<typeof anomalyAgent>;
}) {
  const today = new Date(iso(new Date()));
  const out: { message: string; reminder_date: string }[] = [];
  if (args.dueDate) {
    const days = Math.round((new Date(args.dueDate).getTime() - today.getTime()) / 86400000);
    const msg = days < 0 ? `${args.merchant} bill is overdue by ${-days} day(s).`
      : days === 0 ? `${args.merchant} bill is due today.`
      : days === 1 ? `${args.merchant} bill is due tomorrow.`
      : `${args.merchant} bill is due in ${days} days.`;
    out.push({ message: msg, reminder_date: iso(addDays(new Date(args.dueDate), days > 1 ? -1 : 0)) });
  }
  if (args.isSubscription && args.nextBillingDate) {
    out.push({ message: `${args.merchant} subscription renews on ${args.nextBillingDate}.`, reminder_date: iso(addDays(new Date(args.nextBillingDate), -3)) });
  }
  if (args.anomaly.anomalyDetected && args.anomaly.type === "PRICE_INCREASE") {
    out.push({ message: `Your ${args.merchant} bill increased by ${args.anomaly.percentageChange}% compared with last time.`, reminder_date: iso(today) });
  }
  return { reminders: out, confidence: 0.97 };
}

export function formatINR(n: number | null | undefined, currency = "INR") {
  if (n == null) return "—";
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(n)); }
  catch { return `₹${n}`; }
}
