import { inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  type TicketRecord,
} from "@workspace/db";
import { userSummary } from "../middlewares/auth";

export async function ticketView(ticket: TicketRecord) {
  const ids = [ticket.reporterId, ticket.assigneeId].filter(
    (id): id is string => id !== null,
  );
  const users = ids.length
    ? await db.select().from(usersTable).where(inArray(usersTable.id, ids))
    : [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const reporter = userById.get(ticket.reporterId);

  if (!reporter) {
    throw new Error(`Ticket ${ticket.id} has no valid reporter.`);
  }

  const assignee = ticket.assigneeId
    ? userById.get(ticket.assigneeId) ?? null
    : null;

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    reporter: userSummary(reporter),
    assignee: assignee ? userSummary(assignee) : null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}