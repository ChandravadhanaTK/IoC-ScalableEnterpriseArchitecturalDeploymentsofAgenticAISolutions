import { getState, mutate, mutateDurable } from "./db";
import type { AuditLog, Notification, TelemetryEvent } from "@/types";

export const SYSTEM_ACTOR = "system";

export function roleOf(actorId: string): AuditLog["role"] {
  if (actorId === SYSTEM_ACTOR) return "SYSTEM";
  return getState().users.find((u) => u.id === actorId)?.role ?? "SYSTEM";
}

type AuditInput = Omit<AuditLog, "id" | "seq" | "timestamp" | "role">;

/** Append-only: there is intentionally no update/delete API for audit logs. */
export function appendAudit(entry: AuditInput): AuditLog {
  let log!: AuditLog;
  const write = entry.result === "SUCCESS" ? mutate : mutateDurable;
  write((s) => {
    s.counters.audit += 1;
    log = Object.freeze({
      ...entry,
      id: `AUD-${String(s.counters.audit).padStart(6, "0")}`,
      seq: s.counters.audit,
      timestamp: new Date().toISOString(),
      role: roleOf(entry.userId),
    }) as AuditLog;
    s.auditLogs.push(log);
  });
  return log;
}

export function appendTelemetry(e: Omit<TelemetryEvent, "id" | "at">): void {
  mutateDurable((s) => {
    s.counters.id += 1;
    s.telemetry.push({ ...e, id: `TEL_${s.counters.id}`, at: new Date().toISOString() });
  });
}

export function appendNotification(n: Omit<Notification, "id" | "at" | "read">): void {
  mutate((s) => {
    s.counters.id += 1;
    s.notifications.push({ ...n, id: `NTF_${s.counters.id}`, at: new Date().toISOString(), read: false });
  });
}
