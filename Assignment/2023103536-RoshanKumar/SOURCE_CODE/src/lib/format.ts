export const inr = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return `${v < 0 ? "−" : ""}₹${Math.abs(Math.round(v)).toLocaleString("en-IN")}`;
};

export const shortDate = (s?: string | null) =>
  s ? new Date(s.length === 10 ? s + "T00:00:00Z" : s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }) : "—";

export const clock = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

export type Tone = "ok" | "warn" | "crit" | "agent" | "idle";

export function toneFor(status?: string | null): Tone {
  switch (status) {
    case "REROUTED":
    case "EXPEDITED":
    case "SUBSTITUTED":
    case "DELIVERED":
    case "COMPLETED":
    case "RESOLVED":
    case "SAFE":
    case "EXECUTED":
    case "APPROVED":
    case "REROUTE":
    case "EXPEDITE":
    case "SUBSTITUTE":
    case "ACTIVE_OK":
      return "ok";
    case "AT_RISK":
    case "WAITING_APPROVAL":
    case "PENDING":
    case "MEDIUM":
    case "AWAITING_APPROVAL":
      return "warn";
    case "ESCALATED":
    case "ESCALATE":
    case "STOCKOUT":
    case "HIGH":
    case "CLOSED":
    case "SHUTDOWN":
    case "FAILED":
    case "REJECTED":
    case "ACTIVE":
      return "crit";
    case "RUNNING":
    case "ANALYZING":
    case "IN_TRANSIT":
      return "agent";
    default:
      return "idle";
  }
}

export const toneText: Record<Tone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  crit: "text-crit",
  agent: "text-agent",
  idle: "text-idle",
};
export const toneBg: Record<Tone, string> = {
  ok: "bg-ok/12 text-ok border-ok/30",
  warn: "bg-warn/12 text-warn border-warn/30",
  crit: "bg-crit/12 text-crit border-crit/30",
  agent: "bg-agent/12 text-agent border-agent/30",
  idle: "bg-idle/12 text-idle border-idle/30",
};
