export function formatINR(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
] as const;

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled"
  | "refunded";

export function statusColor(status: string): string {
  switch (status) {
    case "pending":
      return "text-warning border-warning/40 bg-warning/10";
    case "confirmed":
      return "text-success border-success/40 bg-success/10";
    case "preparing":
      return "text-warning border-warning/40 bg-warning/10";
    case "ready":
      return "text-info border-info/40 bg-info/10";
    case "served":
    case "completed":
      return "text-info border-info/40 bg-info/10";
    case "cancelled":
    case "refunded":
      return "text-danger border-danger/40 bg-danger/10";
    default:
      return "text-muted-foreground border-border bg-muted";
  }
}

export function tableStatusColor(status: string): string {
  switch (status) {
    case "available":
      return "border-success/50 bg-success/10 text-success";
    case "occupied":
      return "border-danger/50 bg-danger/10 text-danger";
    case "reserved":
      return "border-warning/50 bg-warning/10 text-warning";
    case "cleaning":
      return "border-muted-foreground/40 bg-muted text-muted-foreground";
    default:
      return "border-border bg-muted";
  }
}

export function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}
