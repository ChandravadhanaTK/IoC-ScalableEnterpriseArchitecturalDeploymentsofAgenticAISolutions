/** Authentication concept + RBAC. Demo session; real auth would come from an identity provider. */
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "@/types/domain";
import { recordAudit } from "@/services/incidentService";

export type Permission =
  | "incident.create" | "incident.view_all" | "incident.update" | "incident.approve"
  | "monitoring.view" | "security.view" | "agent.view" | "settings.admin";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Student: ["incident.create"],
  Staff: ["incident.create", "incident.view_all", "incident.update", "agent.view"],
  "Department Manager": ["incident.create", "incident.view_all", "incident.update", "incident.approve", "monitoring.view", "agent.view"],
  Administrator: ["incident.create", "incident.view_all", "incident.update", "incident.approve", "monitoring.view", "security.view", "agent.view", "settings.admin"],
};

const USERS: Record<Role, { name: string; email: string }> = {
  Student: { name: "Ananya Rao", email: "ananya.rao@students.campus.edu" },
  Staff: { name: "Rahul Menon", email: "rahul.menon@campus.edu" },
  "Department Manager": { name: "Neha Kapoor", email: "neha.kapoor@campus.edu" },
  Administrator: { name: "Arvind Shah", email: "arvind.shah@campus.edu" },
};

interface AuthCtx {
  user: { name: string; email: string; role: Role; mfa: boolean };
  setRole: (r: Role) => void;
  can: (p: Permission) => boolean;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("Administrator");
  const user = { ...USERS[role], role, mfa: role !== "Student" };
  const setRole = (r: Role) => {
    recordAudit({ name: USERS[r].name, role: r }, "auth.switch_role", r);
    setRoleState(r);
  };
  return <Ctx.Provider value={{ user, setRole, can: (p) => ROLE_PERMISSIONS[role].includes(p) }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
