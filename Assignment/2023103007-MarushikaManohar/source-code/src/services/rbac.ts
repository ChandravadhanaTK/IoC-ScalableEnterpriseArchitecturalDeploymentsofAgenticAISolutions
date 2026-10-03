import { getState } from "./db";
import { appendAudit } from "./ledger";
import type { Permission, Role, User } from "@/types";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  INVENTORY_OPERATOR: ["VIEW_INVENTORY", "REQUEST_REPLENISHMENT"],
  SUPPLY_CHAIN_MANAGER: ["VIEW_INVENTORY", "REQUEST_REPLENISHMENT", "REVIEW_APPROVE"],
  PROCUREMENT_OFFICER: ["VIEW_INVENTORY", "EXECUTE_PO"],
  ADMINISTRATOR: ["VIEW_INVENTORY", "REQUEST_REPLENISHMENT", "REVIEW_APPROVE", "EXECUTE_PO", "ADMIN_POLICIES"],
};

export const ROLE_LABEL: Record<Role, string> = {
  INVENTORY_OPERATOR: "Inventory Operator",
  SUPPLY_CHAIN_MANAGER: "Supply Chain Manager",
  PROCUREMENT_OFFICER: "Procurement Officer",
  ADMINISTRATOR: "Administrator",
};

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Service-layer authorization. The role is resolved from the user store by ID —
 * never from a client-supplied role value. Denials are written to the audit ledger.
 */
export function authorize(actorId: string, permission: Permission, action: string, workflowId?: string): User {
  const user = getState().users.find((u) => u.id === actorId);
  if (!user || !can(user.role, permission)) {
    appendAudit({
      userId: actorId,
      workflowId,
      action,
      result: "DENIED",
      severity: "WARN",
      details: { requiredPermission: permission, reason: "AUTHORIZATION_FAILURE" },
    });
    throw new AuthorizationError(
      `${user ? ROLE_LABEL[user.role] : "Unknown user"} lacks permission ${permission} for ${action}`,
    );
  }
  return user;
}
