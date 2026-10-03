import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { User } from '@/lib/types';
import { verifySignedSessionToken } from '@/lib/session';

/**
 * Validates the authenticated session on the server using the cryptographically signed `sb_session_id` cookie.
 * Returns the corresponding User from the database, or null if unauthenticated, forged, expired, or suspended.
 */
export async function getAuthenticatedUserServer(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb_session_id')?.value;
    if (!token) return null;

    const sessionPayload = verifySignedSessionToken(token);
    if (!sessionPayload) {
      return null;
    }

    const user = await db.users.findById(sessionPayload.userId);
    if (!user || user.suspended) return null;
    return user;
  } catch (err) {
    console.error('getAuthenticatedUserServer error:', err);
    return null;
  }
}

/**
 * Server-side authorization check enforcing `ADMIN` role.
 */
export async function requireAdminServer(): Promise<{ authorized: boolean; user: User | null }> {
  const user = await getAuthenticatedUserServer();
  if (!user || user.role !== 'ADMIN') {
    return { authorized: false, user: null };
  }
  return { authorized: true, user };
}
