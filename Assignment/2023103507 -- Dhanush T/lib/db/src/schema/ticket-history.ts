import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { ticketsTable } from "./tickets";
import { usersTable } from "./users";

export const ticketHistoryActionEnum = pgEnum("ticket_history_action", [
  "CREATED",
  "STATUS_CHANGED",
  "ASSIGNED",
  "PRIORITY_CHANGED",
  "UPDATED",
]);

export const ticketHistoryTable = pgTable("ticket_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => ticketsTable.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  action: ticketHistoryActionEnum("action").notNull(),
  fromValue: text("from_value"),
  toValue: text("to_value"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("ticket_history_ticket_created_idx").on(
    table.ticketId,
    table.createdAt,
  ),
]);

export type TicketHistoryRecord = typeof ticketHistoryTable.$inferSelect;