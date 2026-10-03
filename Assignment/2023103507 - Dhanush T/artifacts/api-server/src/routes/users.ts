import { count, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ChangePasswordBody,
  ChangePasswordResponse,
  ListUsersResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  UpdateUserRoleBody,
  UpdateUserRoleParams,
  UpdateUserRoleResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { publicUser, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/users", requireRole("ADMIN"), async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(ListUsersResponse.parse(users.map(publicUser)));
});

router.patch("/users/me/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ name: parsed.data.name.trim(), updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.id))
    .returning();
  res.json(UpdateProfileResponse.parse(publicUser(updated)));
});

router.patch("/users/me/password", async (req, res): Promise<void> => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!(await bcrypt.compare(parsed.data.currentPassword, req.user!.passwordHash))) {
    res.status(400).json({ error: "Current password is incorrect." });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db
    .update(usersTable)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.id));
  res.status(204).send(ChangePasswordResponse.parse(undefined));
});

router.patch(
  "/users/:userId/role",
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const params = UpdateUserRoleParams.safeParse(req.params);
    const parsed = UpdateUserRoleBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, params.data.userId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
      const [adminTotal] = await db
        .select({ value: count() })
        .from(usersTable)
        .where(eq(usersTable.role, "ADMIN"));
      if (adminTotal.value <= 1) {
        res.status(409).json({ error: "The last admin cannot be demoted." });
        return;
      }
    }
    const [updated] = await db
      .update(usersTable)
      .set({ role: parsed.data.role, updatedAt: new Date() })
      .where(eq(usersTable.id, target.id))
      .returning();
    res.json(UpdateUserRoleResponse.parse(publicUser(updated)));
  },
);

export default router;