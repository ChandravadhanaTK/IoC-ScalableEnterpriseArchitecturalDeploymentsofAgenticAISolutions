import crypto from 'crypto';
import { prisma } from './prisma';

export interface ResetTokenRecord {
  tokenHash: string;
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

// In-memory token store fallback
const tokenStore = new Map<string, ResetTokenRecord>();

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes expiration

/**
 * Computes SHA-256 hash of a raw token.
 */
export function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a cryptographically secure random password-reset token.
 * Stores its SHA-256 hash persistently in the Prisma database (with in-memory fallback).
 * Returns the raw token string (ONLY for inclusion in the reset email URL).
 */
export async function generatePasswordResetToken(userId: string, email: string): Promise<string> {
  const cleanEmail = email.toLowerCase().trim();

  // Invalidate any previously active tokens for this user in-memory
  for (const [, record] of tokenStore.entries()) {
    if (record.userId === userId || record.email === cleanEmail) {
      record.used = true;
    }
  }

  // Generate 32 bytes (64 hex characters) of secure entropy
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const now = Date.now();
  const expiresAtDate = new Date(now + TOKEN_TTL_MS);

  const record: ResetTokenRecord = {
    tokenHash,
    userId,
    email: cleanEmail,
    createdAt: now,
    expiresAt: now + TOKEN_TTL_MS,
    used: false,
  };

  tokenStore.set(tokenHash, record);

  // Attempt persistent database insertion using Prisma
  try {
    if (prisma && process.env.DATABASE_URL) {
      // Invalidate existing DB tokens for user
      await prisma.passwordResetToken.updateMany({
        where: { userId, used: false },
        data: { used: true },
      }).catch(() => {});

      await prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId,
          expiresAt: expiresAtDate,
          used: false,
        },
      }).catch(() => {});
    }
  } catch (err) {
    // Non-blocking fallback to in-memory store
  }

  return rawToken;
}

/**
 * Validates a raw reset token.
 * Checks hash existence, expiration, and single-use status against database and memory.
 */
export async function validatePasswordResetToken(rawToken: string): Promise<ResetTokenRecord | null> {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = hashResetToken(rawToken);

  // Check Prisma DB first if available
  try {
    if (prisma && process.env.DATABASE_URL) {
      const dbToken = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (dbToken) {
        if (dbToken.used) return null;
        if (Date.now() > dbToken.expiresAt.getTime()) return null;

        return {
          tokenHash: dbToken.tokenHash,
          userId: dbToken.userId,
          email: dbToken.user?.email || dbToken.userId,
          createdAt: dbToken.createdAt.getTime(),
          expiresAt: dbToken.expiresAt.getTime(),
          used: dbToken.used,
        };
      }
    }
  } catch (err) {
    // Fallback to in-memory check
  }

  // Fallback in-memory validation
  const record = tokenStore.get(tokenHash);
  if (!record) return null;
  if (record.used) return null;
  if (Date.now() > record.expiresAt) return null;

  return record;
}

/**
 * Atomically marks a password reset token as used (single-use enforcement).
 */
export async function consumePasswordResetToken(rawToken: string): Promise<boolean> {
  if (!rawToken || typeof rawToken !== 'string') return false;

  const tokenHash = hashResetToken(rawToken);
  let consumed = false;

  // In-memory consumption
  const record = tokenStore.get(tokenHash);
  if (record && !record.used && Date.now() <= record.expiresAt) {
    record.used = true;
    for (const [, r] of tokenStore.entries()) {
      if (r.userId === record.userId || r.email === record.email) {
        r.used = true;
      }
    }
    consumed = true;
  }

  // Persistent Prisma database consumption (atomic update)
  try {
    if (prisma && process.env.DATABASE_URL) {
      const result = await prisma.passwordResetToken.updateMany({
        where: { tokenHash, used: false, expiresAt: { gte: new Date() } },
        data: { used: true },
      });

      if (result.count > 0) {
        consumed = true;
      }
    }
  } catch (err) {
    // Fallback handled
  }

  return consumed;
}
