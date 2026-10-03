import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  or,
} from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  AssignTicketBody,
  AssignTicketParams,
  AssignTicketResponse,
  CreateTicketBody,
  CreateTicketCommentBody,
  CreateTicketCommentParams,
  CreateTicketCommentResponse,
  CreateTicketResponse,
  DeleteTicketParams,
  GetTicketParams,
  GetDashboardSummaryResponse,
  GetTicketResponse,
  ListTicketCommentsParams,
  ListTicketCommentsResponse,
  ListTicketHistoryParams,
  ListTicketHistoryResponse,
  ListTicketsQueryParams,
  ListTicketsResponse,
  UpdateTicketBody,
  UpdateTicketParams,
  UpdateTicketResponse,
  UpdateTicketStatusBody,
  UpdateTicketStatusParams,
  UpdateTicketStatusResponse,
} from "@workspace/api-zod";
import {
  commentsTable,
  db,
  ticketHistoryTable,
  ticketsTable,
  usersTable,
  type TicketRecord,
  type UserRecord,
} from "@workspace/db";
import { userSummary } from "../middlewares/auth";
import { ticketView } from "../lib/ticket-data";

const router: IRouter = Router();

const nextStatuses: Record<
  TicketRecord["status"],
  TicketRecord["status"][]
> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: [],
  REOPENED: ["ASSIGNED"],
};

function canViewTicket(user: UserRecord, ticket: TicketRecord): boolean {
  return user.role !== "REPORTER" || ticket.reporterId === user.id;
}

async function findTicket(id: string): Promise<TicketRecord | undefined> {
  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.id, id))
    .limit(1);
  return ticket;
}

function addReporterScope(user: UserRecord) {
  return user.role === "REPORTER"
    ? eq(ticketsTable.reporterId, user.id)
    : undefined;
}

async function listTicketRecords(
  user: UserRecord,
  filters?: {
    q?: string;
    status?: TicketRecord["status"];
    priority?: TicketRecord["priority"];
    assigneeId?: string;
    mine?: boolean;
    limit?: number;
  },
): Promise<TicketRecord[]> {
  const conditions = [addReporterScope(user)].filter(
    (condition): condition is NonNullable<typeof condition> =>
      condition !== undefined,
  );

  if (filters?.status) conditions.push(eq(ticketsTable.status, filters.status));
  if (filters?.priority) {
    conditions.push(eq(ticketsTable.priority, filters.priority));
  }
  if (filters?.assigneeId) {
    conditions.push(eq(ticketsTable.assigneeId, filters.assigneeId));
  }
  if (filters?.q?.trim()) {
    const escaped = filters.q.trim().replace(/[\\%_]/g, "\\$&");
    conditions.push(
      or(
        ilike(ticketsTable.title, `%${escaped}%`),
        ilike(ticketsTable.description, `%${escaped}%`),
      )!,
    );
  }
  if (filters?.mine) {
    conditions.push(
      or(
        eq(ticketsTable.reporterId, user.id),
        eq(ticketsTable.assigneeId, user.id),
      )!,
    );
  }

  return db
    .select()
    .from(ticketsTable)
    .where(and(...conditions))
    .orderBy(desc(ticketsTable.updatedAt))
    .limit(filters?.limit ?? 500);
}

async function ensureVisibleTicket(
  req: Request,
  res: Response,
  id: string,
): Promise<TicketRecord | null> {
  const ticket = await findTicket(id);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return null;
  }
  if (!req.user || !canViewTicket(req.user, ticket)) {
    res.status(403).json({ error: "You cannot view this ticket." });
    return null;
  }
  return ticket;
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const user = req.user!;
  const tickets = await listTicketRecords(user, { limit: 10000 });
  const count = (status: TicketRecord["status"]) =>
    tickets.filter((ticket) => ticket.status === status).length;
  const recent = await Promise.all(
    tickets.slice(0, 6).map((ticket) => ticketView(ticket)),
  );

  res.json(
    GetDashboardSummaryResponse.parse({
      total: tickets.length,
      open: count("OPEN") + count("ASSIGNED") + count("REOPENED"),
      inProgress: count("IN_PROGRESS"),
      resolved: count("RESOLVED"),
      closed: count("CLOSED"),
      recentTickets: recent,
    }),
  );
});

router.get("/tickets", async (req, res): Promise<void> => {
  const rawMine =
    typeof req.query.mine === "string" ? req.query.mine : undefined;
  if (rawMine !== undefined && rawMine !== "true" && rawMine !== "false") {
    res.status(400).json({ error: "mine must be true or false." });
    return;
  }

  const parsed = ListTicketsQueryParams.safeParse({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    priority:
      typeof req.query.priority === "string" ? req.query.priority : undefined,
    assigneeId:
      typeof req.query.assigneeId === "string"
        ? req.query.assigneeId
        : undefined,
    mine: rawMine === undefined ? undefined : rawMine === "true",
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tickets = await listTicketRecords(req.user!, parsed.data);
  const response = await Promise.all(tickets.map((ticket) => ticketView(ticket)));
  res.json(ListTicketsResponse.parse(response));
});

router.post("/tickets", async (req, res): Promise<void> => {
  if (req.user!.role === "DEVELOPER") {
    res.status(403).json({ error: "Only reporters and admins can create tickets." });
    return;
  }
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const ticket = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(ticketsTable)
      .values({
        ...parsed.data,
        reporterId: req.user!.id,
        status: "OPEN",
      })
      .returning();
    await tx.insert(ticketHistoryTable).values({
      ticketId: created.id,
      actorId: req.user!.id,
      action: "CREATED",
      fromValue: null,
      toValue: "OPEN",
    });
    return created;
  });

  res.status(201).json(
    CreateTicketResponse.parse(await ticketView(ticket)),
  );
});

router.get("/tickets/:ticketId", async (req, res): Promise<void> => {
  const params = GetTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const ticket = await ensureVisibleTicket(req, res, params.data.ticketId);
  if (!ticket) return;
  res.json(GetTicketResponse.parse(await ticketView(ticket)));
});

router.put("/tickets/:ticketId", async (req, res): Promise<void> => {
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admins can edit ticket details." });
    return;
  }
  const params = UpdateTicketParams.safeParse(req.params);
  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Provide at least one ticket field to update." });
    return;
  }
  const current = await findTicket(params.data.ticketId);
  if (!current) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const updated = await db.transaction(async (tx) => {
    const [saved] = await tx
      .update(ticketsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(ticketsTable.id, current.id))
      .returning();
    if (parsed.data.priority && parsed.data.priority !== current.priority) {
      await tx.insert(ticketHistoryTable).values({
        ticketId: current.id,
        actorId: req.user!.id,
        action: "PRIORITY_CHANGED",
        fromValue: current.priority,
        toValue: parsed.data.priority,
      });
    } else {
      await tx.insert(ticketHistoryTable).values({
        ticketId: current.id,
        actorId: req.user!.id,
        action: "UPDATED",
        fromValue: null,
        toValue: null,
      });
    }
    return saved;
  });
  res.json(UpdateTicketResponse.parse(await ticketView(updated)));
});

router.delete("/tickets/:ticketId", async (req, res): Promise<void> => {
  const params = DeleteTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admins can delete tickets." });
    return;
  }
  const [deleted] = await db
    .delete(ticketsTable)
    .where(eq(ticketsTable.id, params.data.ticketId))
    .returning({ id: ticketsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  res.sendStatus(204);
});

router.patch("/tickets/:ticketId/status", async (req, res): Promise<void> => {
  const params = UpdateTicketStatusParams.safeParse(req.params);
  const parsed = UpdateTicketStatusBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await ensureVisibleTicket(req, res, params.data.ticketId);
  if (!current) return;

  const target = parsed.data.status;
  const validNext = nextStatuses[current.status].includes(target);
  if (!validNext) {
    res.status(400).json({
      error: `Invalid status transition: ${current.status} → ${target}.`,
    });
    return;
  }

  const user = req.user!;
  const isAdmin = user.role === "ADMIN";
  const isAssignedDeveloper =
    user.role === "DEVELOPER" && current.assigneeId === user.id;
  const isOwnerReporter =
    user.role === "REPORTER" && current.reporterId === user.id;
  const isDeveloperProgression =
    isAssignedDeveloper &&
    ((current.status === "ASSIGNED" && target === "IN_PROGRESS") ||
      (current.status === "IN_PROGRESS" && target === "RESOLVED"));
  const isReporterResolutionAction =
    isOwnerReporter &&
    current.status === "RESOLVED" &&
    (target === "CLOSED" || target === "REOPENED");
  const isAdminAssignmentTransition =
    isAdmin &&
    target === "ASSIGNED" &&
    (current.status === "OPEN" || current.status === "REOPENED") &&
    current.assigneeId !== null;

  if (
    !isAdmin &&
    !isDeveloperProgression &&
    !isReporterResolutionAction
  ) {
    res.status(403).json({
      error: "Your role cannot make this status change for this ticket.",
    });
    return;
  }
  if (target === "ASSIGNED" && !current.assigneeId) {
    res.status(400).json({
      error: "Assign the ticket before moving it to ASSIGNED.",
    });
    return;
  }
  if (
    target === "ASSIGNED" &&
    (current.status === "OPEN" || current.status === "REOPENED") &&
    !isAdminAssignmentTransition
  ) {
    res.status(403).json({
      error: "Use the assignment action to move this ticket to ASSIGNED.",
    });
    return;
  }

  const [updated] = await db.transaction(async (tx) => {
    const [saved] = await tx
      .update(ticketsTable)
      .set({ status: target, updatedAt: new Date() })
      .where(eq(ticketsTable.id, current.id))
      .returning();
    await tx.insert(ticketHistoryTable).values({
      ticketId: current.id,
      actorId: user.id,
      action: "STATUS_CHANGED",
      fromValue: current.status,
      toValue: target,
    });
    return [saved];
  });
  res.json(UpdateTicketStatusResponse.parse(await ticketView(updated)));
});

router.patch("/tickets/:ticketId/assign", async (req, res): Promise<void> => {
  const params = AssignTicketParams.safeParse(req.params);
  const parsed = AssignTicketBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await findTicket(params.data.ticketId);
  if (!current) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  const user = req.user!;
  const requestedAssigneeId = parsed.data.assigneeId;
  if (user.role !== "ADMIN" && user.role !== "DEVELOPER") {
    res.status(403).json({ error: "Only developers and admins can assign tickets." });
    return;
  }
  if (user.role === "DEVELOPER") {
    if (
      requestedAssigneeId !== user.id ||
      !["OPEN", "REOPENED", "ASSIGNED"].includes(current.status)
    ) {
      res.status(403).json({
        error: "Developers can only assign open or reopened tickets to themselves.",
      });
      return;
    }
  }
  if (
    requestedAssigneeId === null &&
    current.status === "ASSIGNED" &&
    current.assigneeId !== null
  ) {
    res.status(400).json({
      error: "An assigned ticket cannot be unassigned without a valid workflow transition.",
    });
    return;
  }
  if (requestedAssigneeId) {
    const [assignee] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, requestedAssigneeId))
      .limit(1);
    if (!assignee) {
      res.status(404).json({ error: "Assignee not found." });
      return;
    }
  }
  if (
    user.role === "DEVELOPER" &&
    !["OPEN", "REOPENED", "ASSIGNED"].includes(current.status)
  ) {
    res.status(400).json({
      error: "Developers can only assign open or reopened tickets.",
    });
    return;
  }

  const targetStatus =
    requestedAssigneeId &&
    (current.status === "OPEN" || current.status === "REOPENED")
      ? "ASSIGNED"
      : current.status;
  const updated = await db.transaction(async (tx) => {
    const [saved] = await tx
      .update(ticketsTable)
      .set({
        assigneeId: requestedAssigneeId,
        status: targetStatus,
        updatedAt: new Date(),
      })
      .where(eq(ticketsTable.id, current.id))
      .returning();

    if (current.assigneeId !== requestedAssigneeId) {
      await tx.insert(ticketHistoryTable).values({
        ticketId: current.id,
        actorId: user.id,
        action: "ASSIGNED",
        fromValue: current.assigneeId,
        toValue: requestedAssigneeId,
      });
    }
    if (current.status !== targetStatus) {
      await tx.insert(ticketHistoryTable).values({
        ticketId: current.id,
        actorId: user.id,
        action: "STATUS_CHANGED",
        fromValue: current.status,
        toValue: targetStatus,
      });
    }
    return saved;
  });
  res.json(AssignTicketResponse.parse(await ticketView(updated)));
});

router.get(
  "/tickets/:ticketId/comments",
  async (req, res): Promise<void> => {
    const params = ListTicketCommentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const ticket = await ensureVisibleTicket(req, res, params.data.ticketId);
    if (!ticket) return;

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.ticketId, ticket.id))
      .orderBy(commentsTable.createdAt);
    const authorIds = [...new Set(comments.map((comment) => comment.authorId))];
    const authors = authorIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, authorIds))
      : [];
    const authorById = new Map(authors.map((author) => [author.id, author]));
    const response = comments.map((comment) => {
      const author = authorById.get(comment.authorId);
      if (!author) throw new Error(`Comment ${comment.id} has no valid author.`);
      return {
        id: comment.id,
        body: comment.body,
        author: userSummary(author),
        createdAt: comment.createdAt,
      };
    });
    res.json(ListTicketCommentsResponse.parse(response));
  },
);

router.post(
  "/tickets/:ticketId/comments",
  async (req, res): Promise<void> => {
    const params = CreateTicketCommentParams.safeParse(req.params);
    const parsed = CreateTicketCommentBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const ticket = await ensureVisibleTicket(req, res, params.data.ticketId);
    if (!ticket) return;

    const [comment] = await db
      .insert(commentsTable)
      .values({
        ticketId: ticket.id,
        authorId: req.user!.id,
        body: parsed.data.body.trim(),
      })
      .returning();
    res.status(201).json(
      CreateTicketCommentResponse.parse({
        id: comment.id,
        body: comment.body,
        author: userSummary(req.user!),
        createdAt: comment.createdAt,
      }),
    );
  },
);

router.get(
  "/tickets/:ticketId/history",
  async (req, res): Promise<void> => {
    const params = ListTicketHistoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const ticket = await ensureVisibleTicket(req, res, params.data.ticketId);
    if (!ticket) return;

    const events = await db
      .select()
      .from(ticketHistoryTable)
      .where(eq(ticketHistoryTable.ticketId, ticket.id))
      .orderBy(desc(ticketHistoryTable.createdAt));
    const actorIds = [...new Set(events.map((event) => event.actorId))];
    const actors = actorIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, actorIds))
      : [];
    const actorById = new Map(actors.map((actor) => [actor.id, actor]));
    const response = events.map((event) => {
      const actor = actorById.get(event.actorId);
      if (!actor) throw new Error(`History entry ${event.id} has no valid actor.`);
      return {
        id: event.id,
        action: event.action,
        actor: userSummary(actor),
        fromValue: event.fromValue,
        toValue: event.toValue,
        createdAt: event.createdAt,
      };
    });
    res.json(ListTicketHistoryResponse.parse(response));
  },
);

export default router;