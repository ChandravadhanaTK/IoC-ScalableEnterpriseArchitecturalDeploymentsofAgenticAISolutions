import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const ticketStatusEnum = pgEnum("ticket_status", [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const ticketsTable = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: ticketPriorityEnum("priority").notNull().default("MEDIUM"),
  status: ticketStatusEnum("status").notNull().default("OPEN"),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  assigneeId: uuid("assignee_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("tickets_status_idx").on(table.status),
  index("tickets_reporter_idx").on(table.reporterId),
  index("tickets_assignee_idx").on(table.assigneeId),
  index("tickets_updated_idx").on(table.updatedAt),
]);

export type TicketRecord = typeof ticketsTable.$inferSelect;
export type NewTicketRecord = typeof ticketsTable.$inferInsert;