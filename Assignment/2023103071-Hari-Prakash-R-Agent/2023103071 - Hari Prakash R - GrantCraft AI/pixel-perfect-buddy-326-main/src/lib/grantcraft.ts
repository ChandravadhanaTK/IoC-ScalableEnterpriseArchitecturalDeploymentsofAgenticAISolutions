export const ADMIN_CAP = 0.1;

export type BudgetLine = { item: string; amount: number; category: "program" | "admin" };

export function auditBudget(lines: BudgetLine[]) {
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const admin = lines.filter((l) => l.category === "admin").reduce((s, l) => s + l.amount, 0);
  const ratio = total === 0 ? 0 : admin / total;
  return { total, admin, ratio, pass: ratio <= ADMIN_CAP };
}

/** Rebalance admin lines so admin <= cap of total, moving excess to program. */
export function rebalanceBudget(lines: BudgetLine[]): BudgetLine[] {
  const { total, admin } = auditBudget(lines);
  const maxAdmin = Math.floor(total * ADMIN_CAP);
  if (admin <= maxAdmin) return lines;
  const scale = maxAdmin / admin;
  let moved = 0;
  const out = lines.map((l) => {
    if (l.category !== "admin") return l;
    const n = Math.floor(l.amount * scale);
    moved += l.amount - n;
    return { ...l, amount: n };
  });
  const idx = out.findIndex((l) => l.category === "program");
  if (idx >= 0) out[idx] = { ...out[idx]!, amount: out[idx]!.amount + moved };
  return out;
}

const RULES: [RegExp, string][] = [
  [/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, "[REDACTED_TAX_ID]"],
  [/\b\d{2}-\d{7}\b/g, "[REDACTED_TAX_ID]"],
  [/\b(?:A\/C|Acct|Account)[\s#:No.]*\d{9,18}\b/gi, "[REDACTED_BANK_ACCT]"],
  [/\b\d{11,18}\b/g, "[REDACTED_BANK_ACCT]"],
  [/(?:\+\d{1,3}[\s-]?)?\b\d{5}[\s-]?\d{5}\b/g, "[REDACTED_PHONE]"],
  [/\b(?:Mr|Mrs|Ms|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g, "[REDACTED_DONOR_NAME]"],
  [/[\w.+-]+@[\w-]+\.[\w.]+/g, "[REDACTED_EMAIL]"],
];

export function redactPII(text: string) {
  let out = text;
  let count = 0;
  for (const [re, tag] of RULES) {
    out = out.replace(re, () => {
      count++;
      return tag;
    });
  }
  return { text: out, count };
}

export async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
