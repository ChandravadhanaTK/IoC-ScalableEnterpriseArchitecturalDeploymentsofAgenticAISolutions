import { describe, it, expect } from "vitest";
import { auditBudget, rebalanceBudget, redactPII } from "@/lib/grantcraft";

describe("budget cap", () => {
  it("fails when admin overhead is 25%", () => {
    const r = auditBudget([
      { item: "p", amount: 75, category: "program" },
      { item: "a", amount: 25, category: "admin" },
    ]);
    expect(r.pass).toBe(false);
  });
  it("passes at exactly 10%", () => {
    expect(auditBudget([
      { item: "p", amount: 90, category: "program" },
      { item: "a", amount: 10, category: "admin" },
    ]).pass).toBe(true);
  });
  it("rebalance brings admin to <=10% and keeps total", () => {
    const out = rebalanceBudget([
      { item: "p", amount: 187500, category: "program" },
      { item: "a", amount: 62500, category: "admin" },
    ]);
    const r = auditBudget(out);
    expect(r.total).toBe(250000);
    expect(r.ratio).toBeLessThanOrEqual(0.1);
  });
});

describe("PII redaction", () => {
  it("masks PAN and bank account", () => {
    const r = redactPII("PAN ABCDE1234F, A/C 123456789012");
    expect(r.text).toContain("[REDACTED_TAX_ID]");
    expect(r.text).toContain("[REDACTED_BANK_ACCT]");
    expect(r.text).not.toContain("ABCDE1234F");
  });
});
