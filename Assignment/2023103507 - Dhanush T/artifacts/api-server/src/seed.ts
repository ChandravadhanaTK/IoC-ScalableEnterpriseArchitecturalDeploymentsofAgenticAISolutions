import { count, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  commentsTable,
  db,
  pool,
  ticketHistoryTable,
  ticketsTable,
  usersTable,
} from "@workspace/db";
import { logger } from "./lib/logger";

const demoPassword =
  process.env.DEVPULSE_DEMO_PASSWORD ?? "DevPulseDemo!2026";

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const demoUsers = [
    {
      name: "Morgan Admin",
      email: "devpulse.admin@example.com",
      role: "ADMIN" as const,
    },
    {
      name: "Taylor Developer",
      email: "devpulse.developer@example.com",
      role: "DEVELOPER" as const,
    },
    {
      name: "Jordan Reporter",
      email: "devpulse.reporter@example.com",
      role: "REPORTER" as const,
    },
  ];

  for (const demoUser of demoUsers) {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, demoUser.email))
      .limit(1);
    if (existing) continue;
    await db.insert(usersTable).values({ ...demoUser, passwordHash });
  }

  const [admin] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "devpulse.admin@example.com"))
    .limit(1);
  const [developer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "devpulse.developer@example.com"))
    .limit(1);
  const [reporter] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "devpulse.reporter@example.com"))
    .limit(1);

  if (!admin || !developer || !reporter) {
    throw new Error("Could not initialize DevPulse demo users.");
  }

  const [ticketCount] = await db.select({ value: count() }).from(ticketsTable);
  if (ticketCount.value === 0) {
    const examples = [
      {
        title: "Login form loops back to sign-in",
        description:
          "After a successful sign-in, the browser briefly shows the dashboard and then returns to the login page.",
        priority: "HIGH" as const,
        status: "IN_PROGRESS" as const,
        assigneeId: developer.id,
      },
      {
        title: "Add keyboard shortcut for ticket search",
        description:
          "Let team members open ticket search without leaving the keyboard.",
        priority: "MEDIUM" as const,
        status: "OPEN" as const,
        assigneeId: null,
      },
      {
        title: "Health endpoint response is inconsistent",
        description:
          "The health endpoint should return the same status shape in development and production.",
        priority: "LOW" as const,
        status: "RESOLVED" as const,
        assigneeId: developer.id,
      },
    ];

    for (const [index, example] of examples.entries()) {
      await db.transaction(async (tx) => {
        const [ticket] = await tx
          .insert(ticketsTable)
          .values({
            ...example,
            reporterId: reporter.id,
          })
          .returning();

        const events: Array<{
          action: (typeof ticketHistoryTable.$inferInsert)["action"];
          fromValue: string | null;
          toValue: string | null;
        }> = [
          {
            action: "CREATED",
            fromValue: null,
            toValue: "OPEN",
          },
        ];
        if (example.assigneeId) {
          events.push({
            action: "STATUS_CHANGED" as const,
            fromValue: "OPEN",
            toValue: "ASSIGNED",
          });
          events.push({
            action: "ASSIGNED" as const,
            fromValue: null,
            toValue: example.assigneeId,
          });
          if (example.status === "IN_PROGRESS") {
            events.push({
              action: "STATUS_CHANGED" as const,
              fromValue: "ASSIGNED",
              toValue: "IN_PROGRESS",
            });
          }
          if (example.status === "RESOLVED") {
            events.push({
              action: "STATUS_CHANGED" as const,
              fromValue: "ASSIGNED",
              toValue: "IN_PROGRESS",
            });
            events.push({
              action: "STATUS_CHANGED" as const,
              fromValue: "IN_PROGRESS",
              toValue: "RESOLVED",
            });
          }
        }
        for (const event of events) {
          await tx.insert(ticketHistoryTable).values({
            ticketId: ticket.id,
            actorId: admin.id,
            ...event,
          });
        }
        await tx.insert(commentsTable).values({
          ticketId: ticket.id,
          authorId: index === 0 ? developer.id : reporter.id,
          body:
            index === 0
              ? "I have reproduced this and am checking the session handoff."
              : index === 1
                ? "This would make triage much faster for keyboard users."
                : "The response shape is now consistent across environments.",
        });
      });
    }
  }

  logger.info(
    { demoAccountsCreated: demoUsers.length, demoPasswordIsDefault: !process.env.DEVPULSE_DEMO_PASSWORD },
    "DevPulse seed complete",
  );
}

main()
  .catch((error: unknown) => {
    logger.error({ err: error }, "DevPulse seed failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });