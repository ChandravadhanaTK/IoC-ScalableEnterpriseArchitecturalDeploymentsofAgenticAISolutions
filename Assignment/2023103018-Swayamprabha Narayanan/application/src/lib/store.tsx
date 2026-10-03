// Service/API Layer — in-memory mock service shared across pages.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEPT_TEAM, seedAudit, seedRequests, type AuditEvent, type OpsRequest, type Status } from "./data";

export const CURRENT_USER = { name: "Dr. Asha Menon", role: "Hospital Administrator", email: "a.menon@northstar.demo" };

interface Ctx {
  requests: OpsRequest[];
  audit: AuditEvent[];
  addRequest: (r: Omit<OpsRequest, "id" | "createdAt" | "team" | "status"> & { status?: Status }) => OpsRequest;
  updateStatus: (id: string, status: Status) => void;
  log: (action: string, target: string, level?: AuditEvent["level"], actor?: string) => void;
}
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<OpsRequest[]>(seedRequests);
  const [audit, setAudit] = useState<AuditEvent[]>(seedAudit);

  const log = useCallback<Ctx["log"]>((action, target, level = "info", actor = CURRENT_USER.name) => {
    setAudit((a) => [{ id: crypto.randomUUID(), at: Date.now(), actor, action, target, level }, ...a]);
  }, []);

  const addRequest = useCallback<Ctx["addRequest"]>((r) => {
    const max = Math.max(...requests.map((x) => parseInt(x.id.slice(4), 10)));
    const created: OpsRequest = { ...r, id: `REQ-${String(max + 1).padStart(5, "0")}`, createdAt: Date.now(), team: DEPT_TEAM[r.department], status: r.status ?? "New" };
    setRequests((list) => [created, ...list]);
    return created;
  }, [requests]);

  const updateStatus = useCallback((id: string, status: Status) => {
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const value = useMemo(() => ({ requests, audit, addRequest, updateStatus, log }), [requests, audit, addRequest, updateStatus, log]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
