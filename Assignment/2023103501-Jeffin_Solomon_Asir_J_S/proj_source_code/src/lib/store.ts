import { useEffect, useState } from "react";

export type Status = "PENDING" | "AUTO_APPROVED" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
export type LineItem = { desc: string; qty: number; unit: number };
export type Invoice = {
  id: string;
  vendor: string;
  vendorGstin: string;
  employee: string;
  department: string;
  category: "Travel" | "Meals" | "Software" | "Hardware" | "Consulting" | "Office";
  date: string;
  invoiceNo: string;
  currency: "INR";
  items: LineItem[];
  tax: number;
  total: number;
  hasReceipt: boolean;
  notes?: string;
  status: Status;
  risk?: number;
  decision?: string;
  report?: string;
  auditedAt?: string;
  latencyMs?: number;
};
export type Finding = { rule: string; severity: "HIGH" | "MEDIUM" | "LOW"; detail: string };
export type AuditEvent = { at: string; invoiceId: string; actor: string; action: string };

export const POLICIES = [
  "Meals: max INR 2,500 per person per day; alcohol is not reimbursable.",
  "Travel: economy class only; hotels max INR 8,000 per night.",
  "Any single claim above INR 50,000 requires finance manager approval.",
  "Every claim must have an original receipt/invoice attached.",
  "Vendor GSTIN must be 15 characters and present for B2B invoices.",
  "Duplicate invoice numbers from the same vendor are rejected.",
  "Claims must be submitted within 30 days of the expense date.",
  "Weekend expenses require a business justification note.",
];

const T = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
const inv = (p: Omit<Invoice, "total" | "currency" | "status"> & { status?: Status }): Invoice => {
  const sub = p.items.reduce((s, i) => s + i.qty * i.unit, 0);
  return { currency: "INR", status: "PENDING", ...p, total: Math.round(sub + p.tax) };
};

const SEED: Invoice[] = [
  inv({ id: "INV-1001", vendor: "Taj Coromandel", vendorGstin: "33AAACT1234F1Z5", employee: "Priya Raman", department: "Sales", category: "Travel", date: T(4), invoiceNo: "TC-88231", items: [{ desc: "Deluxe room x2 nights", qty: 2, unit: 11500 }], tax: 2760, hasReceipt: true, notes: "Client visit, Chennai" }),
  inv({ id: "INV-1002", vendor: "Barbeque Nation", vendorGstin: "29AABCB5678K1Z2", employee: "Arjun Mehta", department: "Engineering", category: "Meals", date: T(2), invoiceNo: "BN-4410", items: [{ desc: "Team dinner (3 people)", qty: 1, unit: 5400 }, { desc: "Beverages - beer", qty: 4, unit: 450 }], tax: 360, hasReceipt: true }),
  inv({ id: "INV-1003", vendor: "Atlassian Pty", vendorGstin: "", employee: "Kavya Iyer", department: "Engineering", category: "Software", date: T(6), invoiceNo: "AT-2026-091", items: [{ desc: "Jira Cloud - 10 seats annual", qty: 10, unit: 7900 }], tax: 14220, hasReceipt: true }),
  inv({ id: "INV-1004", vendor: "Uber India", vendorGstin: "27AABCU9603R1ZN", employee: "Priya Raman", department: "Sales", category: "Travel", date: T(3), invoiceNo: "UB-77120", items: [{ desc: "Airport cab", qty: 1, unit: 740 }], tax: 37, hasReceipt: true }),
  inv({ id: "INV-1005", vendor: "Croma Retail", vendorGstin: "27AAACI1234Z1Z9", employee: "Rahul Das", department: "Operations", category: "Hardware", date: T(41), invoiceNo: "CR-55621", items: [{ desc: "Noise-cancelling headphones", qty: 1, unit: 24990 }], tax: 4498, hasReceipt: false }),
  inv({ id: "INV-1006", vendor: "Barbeque Nation", vendorGstin: "29AABCB5678K1Z2", employee: "Arjun Mehta", department: "Engineering", category: "Meals", date: T(2), invoiceNo: "BN-4410", items: [{ desc: "Team dinner (3 people)", qty: 1, unit: 5400 }], tax: 270, hasReceipt: true, notes: "Resubmitted" }),
  inv({ id: "INV-1007", vendor: "Staples Office", vendorGstin: "07AAFCS2211L1ZQ", employee: "Neha Kapoor", department: "Admin", category: "Office", date: T(1), invoiceNo: "SO-1182", items: [{ desc: "Printer paper (box)", qty: 5, unit: 420 }, { desc: "Whiteboard markers", qty: 10, unit: 60 }], tax: 486, hasReceipt: true }),
  inv({ id: "INV-1008", vendor: "Deloitte Advisory", vendorGstin: "27AAAFD1234M1Z1", employee: "Sanjay Kumar", department: "Finance", category: "Consulting", date: T(9), invoiceNo: "DA-INV-3301", items: [{ desc: "Tax advisory retainer - Q3", qty: 1, unit: 150000 }], tax: 27000, hasReceipt: true }),
];

const KEY = "auditlens.v1";
type State = { invoices: Invoice[]; events: AuditEvent[] };
let state: State | null = null;
const subs = new Set<() => void>();

function load(): State {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (state = JSON.parse(raw));
  } catch {}
  state = { invoices: SEED, events: [] };
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}
function save(next: State) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  subs.forEach((f) => f());
}

export function useStore() {
  const [s, setS] = useState<State | null>(null);
  useEffect(() => {
    setS(load());
    const f = () => setS({ ...load() });
    subs.add(f);
    return () => void subs.delete(f);
  }, []);
  return s;
}

export function updateInvoice(id: string, patch: Partial<Invoice>, event?: { actor: string; action: string }) {
  const s = load();
  save({
    invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    events: event ? [{ at: new Date().toISOString(), invoiceId: id, ...event }, ...s.events] : s.events,
  });
}
export function addInvoice(i: Invoice) {
  const s = load();
  save({ invoices: [i, ...s.invoices], events: [{ at: new Date().toISOString(), invoiceId: i.id, actor: "Intake Agent", action: "Invoice captured" }, ...s.events] });
}
export function resetDemo() {
  state = null;
  localStorage.removeItem(KEY);
  save(load());
}
export function buildInvoice(p: Omit<Invoice, "total" | "currency" | "status">) {
  return inv(p);
}

/** Deterministic Policy Engine (tool #1) — runs before the LLM so rules are never hallucinated. */
export function runPolicyEngine(i: Invoice, all: Invoice[]): Finding[] {
  const f: Finding[] = [];
  const day = new Date(i.date).getDay();
  const ageDays = (Date.now() - new Date(i.date).getTime()) / 86400000;
  if (!i.hasReceipt) f.push({ rule: "RECEIPT_REQUIRED", severity: "HIGH", detail: "No receipt attached." });
  if (all.some((o) => o.id !== i.id && o.vendor === i.vendor && o.invoiceNo === i.invoiceNo))
    f.push({ rule: "DUPLICATE_INVOICE", severity: "HIGH", detail: `Invoice ${i.invoiceNo} from ${i.vendor} appears more than once.` });
  if (i.total > 50000) f.push({ rule: "HIGH_VALUE", severity: "MEDIUM", detail: `Total INR ${i.total.toLocaleString("en-IN")} exceeds 50,000 approval threshold.` });
  if (!i.vendorGstin || i.vendorGstin.length !== 15) f.push({ rule: "GSTIN_INVALID", severity: "MEDIUM", detail: "Vendor GSTIN missing or malformed." });
  if (ageDays > 30) f.push({ rule: "LATE_SUBMISSION", severity: "MEDIUM", detail: `Expense is ${Math.floor(ageDays)} days old (limit 30).` });
  if ((day === 0 || day === 6) && !i.notes) f.push({ rule: "WEEKEND_NO_JUSTIFICATION", severity: "LOW", detail: "Weekend expense without justification note." });
  if (i.items.some((x) => /beer|wine|alcohol|liquor|whisky/i.test(x.desc))) f.push({ rule: "ALCOHOL", severity: "HIGH", detail: "Alcohol line items are not reimbursable." });
  if (i.category === "Travel" && i.items.some((x) => /room|hotel/i.test(x.desc) && x.unit > 8000))
    f.push({ rule: "HOTEL_CAP", severity: "MEDIUM", detail: "Hotel nightly rate exceeds INR 8,000 cap." });
  if (i.category === "Meals") {
    const m = i.items.map((x) => x.desc.match(/\((\d+) people\)/)).find(Boolean);
    const people = m ? Number(m[1]) : 1;
    if (i.total / people > 2500) f.push({ rule: "MEAL_CAP", severity: "MEDIUM", detail: `INR ${Math.round(i.total / people)} per person exceeds 2,500 cap.` });
  }
  return f;
}

/** Router (tool #3): combines LLM verdict with hard rules — HIGH findings can never auto-approve. */
export function routeDecision(decision: string, risk: number, findings: Finding[]): Status {
  if (decision === "REJECT" || findings.some((f) => f.rule === "DUPLICATE_INVOICE")) return "NEEDS_REVIEW";
  if (decision === "APPROVE" && risk < 30 && !findings.some((f) => f.severity === "HIGH")) return "AUTO_APPROVED";
  return "NEEDS_REVIEW";
}

export const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");
