import { createHash, timingSafeEqual } from "node:crypto";
import { count, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import {
  BootstrapFirstAdminBody,
  BootstrapFirstAdminResponse,
  GetCurrentUserResponse,
  GetFirstAdminBootstrapStatusResponse,
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { requireAuth, publicUser, signSession } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        name: parsed.data.name.trim(),
        email,
        passwordHash,
        role: "REPORTER",
      })
      .returning();

    res.status(201).json(
      RegisterResponse.parse({
        token: signSession(user),
        user: publicUser(user),
      }),
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    throw error;
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email.trim().toLowerCase()))
    .limit(1);

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  res.json(
    LoginResponse.parse({
      token: signSession(user),
      user: publicUser(user),
    }),
  );
});

router.get("/auth/me", requireAuth, (req, res): void => {
  res.json(GetCurrentUserResponse.parse(publicUser(req.user!)));
});

router.get(
  "/auth/bootstrap-status",
  requireAuth,
  async (req, res): Promise<void> => {
    const [adminTotal] = await db
      .select({ value: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "ADMIN"));
    const token = process.env.DEVPULSE_ADMIN_BOOTSTRAP_TOKEN;
    const tokenConfigured = Boolean(
      token && Buffer.byteLength(token, "utf8") >= 32,
    );

    res.json(
      GetFirstAdminBootstrapStatusResponse.parse({
        available: req.user!.role === "REPORTER" &&
          adminTotal.value === 0 &&
          tokenConfigured,
      }),
    );
  },
);

router.post(
  "/auth/bootstrap-admin",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = BootstrapFirstAdminBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const expectedToken = process.env.DEVPULSE_ADMIN_BOOTSTRAP_TOKEN;
    if (!expectedToken || Buffer.byteLength(expectedToken, "utf8") < 32) {
      res.status(503).json({
        error: "First-admin setup is not configured with a sufficiently long token.",
      });
      return;
    }

    const suppliedDigest = createHash("sha256")
      .update(parsed.data.token, "utf8")
      .digest();
    const expectedDigest = createHash("sha256")
      .update(expectedToken, "utf8")
      .digest();
    if (!timingSafeEqual(suppliedDigest, expectedDigest)) {
      res.status(403).json({ error: "The bootstrap token is incorrect." });
      return;
    }
    if (req.user!.role !== "REPORTER") {
      res.status(403).json({
        error: "Only a reporter account can be promoted through first-admin setup.",
      });
      return;
    }

    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended('devpulse-first-admin', 0))`,
      );
      const [admin] = await tx
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.role, "ADMIN"))
        .limit(1);
      if (admin) return { kind: "already-configured" as const };

      const [updated] = await tx
        .update(usersTable)
        .set({ role: "ADMIN", updatedAt: new Date() })
        .where(eq(usersTable.id, req.user!.id))
        .returning();
      return updated
        ? { kind: "promoted" as const, user: updated }
        : { kind: "user-missing" as const };
    });

    if (outcome.kind === "already-configured") {
      res.status(409).json({ error: "An admin already exists." });
      return;
    }
    if (outcome.kind === "user-missing") {
      res.status(404).json({ error: "The signed-in account no longer exists." });
      return;
    }

    res.json(BootstrapFirstAdminResponse.parse(publicUser(outcome.user)));
  },
);

export default router;