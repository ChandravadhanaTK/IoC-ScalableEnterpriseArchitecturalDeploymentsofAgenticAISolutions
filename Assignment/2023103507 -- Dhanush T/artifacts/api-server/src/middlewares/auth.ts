import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { db, usersTable, type UserRecord } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
    }
  }
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

export function signSession(user: UserRecord): string {
  return jwt.sign({ email: user.email }, getSecret(), {
    algorithm: "HS256",
    subject: user.id,
    expiresIn: "7d",
  });
}

export const requireAuth: RequestHandler = async (
  req,
  res,
  next,
): Promise<void> => {
  const authorization = req.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
  } catch {
    res.status(401).json({ error: "Session is invalid or has expired." });
    return;
  }

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    res.status(401).json({ error: "Session is invalid." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Account no longer exists." });
    return;
  }

  req.user = user;
  next();
};

export function requireRole(...roles: UserRecord["role"][]): RequestHandler {
  return (req, res, next): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
}

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function userSummary(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}