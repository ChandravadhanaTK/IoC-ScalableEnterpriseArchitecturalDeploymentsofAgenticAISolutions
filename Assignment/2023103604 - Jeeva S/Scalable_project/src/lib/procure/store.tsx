import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_POLICY,
  approvalChainFor,
  deptAvailable,
  productById,
  type AnalysisResult,
  type AuditEntry,
  type Category,
  type RequestRecord,
  type RequestStatus,
  type Role,
} from "./data";

const KEY = "procureai:v1";

interface State {
  role: Role;
  requests: RequestRecord[];
  audit: AuditEntry[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

function seedResult(text: string, department: string, category: Category, qty: number, budget: number, topId: string, altId: string | null, score: number): AnalysisResult {
  const top = productById(topId)!;
  const alt = altId ? productById(altId) ?? null : null;
  const total = top.price * qty;
  const available = deptAvailable(department);
  const over = total > available || (budget > 0 && total > budget);
  const reasons: string[] = [];
  if (over) reasons.push("Budget exceeded", "Policy exception found");
  if (score < 8) reasons.push("Validator never reached 8/10");
  return {
    requestText: text,
    department,
    requirement: { category, quantity: qty, budget, specs: top.specs.slice(0, 2), urgency: "normal", use_case: "Seeded historical request" },
    policy: {
      snippets: [
        { text: "All purchases require at least Manager approval.", source: "approval_policy.md" },
        { text: "Preferred vendors must be chosen when price is within 10% of a non-preferred alternative.", source: "vendor_policy.md" },
      ],
      sources: ["approval_policy.md", "vendor_policy.md"],
    },
    catalog: [{ ...top, score: 9, within_budget: !over }],
    budget: { estimated: total, requestBudget: budget, deptAvailable: available, status: over ? "POLICY_EXCEPTION" : total >= 50000 ? "REQUIRES_APPROVAL" : "COMPLIANT", notes: over ? ["Exceeds budget"] : [] },
    recommendation: {
      top: { product: top, reason: `Best match from ${top.vendor}${top.preferred_vendor ? " (preferred vendor)" : ""}.` },
      alternative: alt ? { product: alt, reason: "Comparable option at a different price point." } : null,
      reasons: [`${top.warranty} warranty`, `Delivers in ${top.delivery_days} days`],
      risk_flags: over ? ["Over budget"] : [],
    },
    validatorHistory: [{ attempt: 1, score, feedback: score >= 8 ? "Grounded in catalog data." : "Reasons were vague." }],
    total,
    approvalChain: approvalChainFor(total),
    escalate: reasons.length > 0,
    escalateReasons: reasons,
  };
}

function seed(): State {
  const rows: [string, string, Category, number, number, string, string | null, number, RequestStatus, string?][] = [
    ["2 ML laptops with 32GB RAM", "Engineering", "Laptop", 2, 300000, "P01", "P02", 9, "po_created", "PO-2026-0001"],
    ["27-inch 4K monitor for design", "Marketing", "Monitor", 1, 25000, "P06", "P07", 9, "po_created", "PO-2026-0002"],
    ["10 Copilot seats for platform team", "Engineering", "Software", 10, 200000, "P10", "P09", 8, "approved"],
    ["Wi-Fi 6 access points for 3rd floor", "Operations", "Networking", 2, 100000, "P13", null, 9, "pending_manager"],
    ["Budget laptop for new finance analyst", "Finance", "Laptop", 1, 70000, "P05", "P03", 8, "pending_manager"],
    ["GPU cloud compute for model training", "Engineering", "Cloud", 3, 300000, "P14", "P15", 7, "pending_manager"],
    ["MacBook Pro for HR lead", "HR", "Laptop", 1, 150000, "P04", "P05", 8, "rejected"],
    ["M365 seats for marketing interns", "Marketing", "Software", 5, 50000, "P11", null, 9, "approved"],
    ["Core switch replacement", "Operations", "Networking", 1, 200000, "P12", null, 8, "changes_requested"],
    ["Dual monitors for finance team", "Finance", "Monitor", 4, 60000, "P08", "P07", 9, "po_created", "PO-2026-0003"],
  ];
  const now = Date.now();
  const requests: RequestRecord[] = rows.map((r, i) => {
    const at = new Date(now - (i + 1) * 36e5 * 9).toISOString();
    const actions = r[8] === "pending_manager" ? [] : [{ role: "Manager" as Role, action: r[8] === "rejected" ? "reject" : r[8] === "changes_requested" ? "changes" : "approve", comment: "Seeded decision", at }];
    return { id: `REQ-${1001 + i}`, createdAt: at, department: r[1], text: r[0], status: r[8], result: seedResult(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]), actions, poNumber: r[9] };
  });
  const audit: AuditEntry[] = requests.map((q) => ({ id: uid(), at: q.createdAt, role: "Employee", agent: "pipeline", tool: "analyze", result: `${q.id} analyzed`, status: "OK" }));
  return { role: "Employee", requests, audit };
}

interface Ctx extends State {
  ready: boolean;
  policy: string;
  setPolicy: (p: string) => void;
  setRole: (r: Role) => void;
  addRequest: (r: RequestRecord) => void;
  updateRequest: (id: string, patch: Partial<RequestRecord>) => void;
  addAudit: (e: Omit<AuditEntry, "id" | "at" | "role"> & { role?: string }) => void;
  reset: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function ProcureProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ role: "Employee", requests: [], audit: [] });
  const [ready, setReady] = useState(false);
  const [policy, setPolicy] = useState(DEFAULT_POLICY);

  useEffect(() => {
    let s: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) s = JSON.parse(raw) as State;
    } catch { s = null; }
    setState(s && Array.isArray(s.requests) ? s : seed());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  }, [state, ready]);

  const setRole = useCallback((role: Role) => setState((s) => ({ ...s, role })), []);
  const addRequest = useCallback((r: RequestRecord) => setState((s) => ({ ...s, requests: [r, ...s.requests] })), []);
  const updateRequest = useCallback((id: string, patch: Partial<RequestRecord>) =>
    setState((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) })), []);
  const addAudit = useCallback((e: Omit<AuditEntry, "id" | "at" | "role"> & { role?: string }) =>
    setState((s) => ({ ...s, audit: [{ id: uid(), at: new Date().toISOString(), role: e.role ?? s.role, agent: e.agent, tool: e.tool, result: e.result, status: e.status }, ...s.audit].slice(0, 800) })), []);
  const reset = useCallback(() => { setState(seed()); setPolicy(DEFAULT_POLICY); }, []);

  const value = useMemo<Ctx>(() => ({ ...state, ready, policy, setPolicy, setRole, addRequest, updateRequest, addAudit, reset }), [state, ready, policy, setRole, addRequest, updateRequest, addAudit, reset]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useProcure() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useProcure outside provider");
  return c;
}

export const newRequestId = (existing: RequestRecord[]) => {
  const max = existing.reduce((m, r) => Math.max(m, Number(r.id.split("-")[1]) || 0), 1000);
  return `REQ-${max + 1}`;
};
