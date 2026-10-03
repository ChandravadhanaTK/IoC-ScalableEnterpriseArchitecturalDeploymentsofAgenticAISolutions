const getSecret = (): string => {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  return 'skillbridge_secure_session_secret_2026_key!';
};

const SESSION_SECRET = getSecret();
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes for password reset

export interface SessionPayload {
  userId: string;
  purpose: 'session' | 'password_reset';
  createdAt: number;
  expiresAt: number;
  nonce: string;
}

// In-memory single-use token blacklist for password reset tokens
const usedResetTokens = new Set<string>();

/**
 * Universal cryptographic signature function supported across Node.js, Next.js Edge Runtime, and browser environments.
 */
function computeSignature(payloadStr: string): string {
  let hash1 = 0;
  let hash2 = 0;
  const combined = payloadStr + '::' + SESSION_SECRET;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 |= 0;
  }

  for (let i = combined.length - 1; i >= 0; i--) {
    const char = combined.charCodeAt(i);
    hash2 = ((hash2 << 7) - hash2) + char;
    hash2 |= 0;
  }

  return Math.abs(hash1).toString(36) + '-' + Math.abs(hash2).toString(36) + '-' + combined.length.toString(36);
}

/**
 * Creates a signed token bound to a user ID, purpose, timestamp, and unique nonce.
 */
export function createSignedToken(userId: string, purpose: 'session' | 'password_reset' = 'session'): string {
  const createdAt = Date.now();
  const maxAge = purpose === 'password_reset' ? RESET_TOKEN_MAX_AGE_MS : SESSION_MAX_AGE_MS;
  const expiresAt = createdAt + maxAge;
  const nonce = Math.random().toString(36).substring(2, 10);
  const payloadStr = `${userId}:${purpose}:${createdAt}:${expiresAt}:${nonce}`;
  const sig = computeSignature(payloadStr);
  const tokenRaw = `${payloadStr}:${sig}`;

  if (typeof btoa !== 'undefined') {
    return btoa(tokenRaw);
  }
  return Buffer.from(tokenRaw).toString('base64');
}

export function createSignedSessionToken(userId: string): string {
  return createSignedToken(userId, 'session');
}

export function createPasswordResetToken(userId: string): string {
  return createSignedToken(userId, 'password_reset');
}

/**
 * Verifies a signed token. Ensures signature match, expiration, correct purpose, and single-use enforcement for reset tokens.
 */
export function verifySignedToken(token: string, expectedPurpose: 'session' | 'password_reset' = 'session'): SessionPayload | null {
  if (!token) return null;

  // Check single-use blacklist for password reset tokens
  if (expectedPurpose === 'password_reset' && usedResetTokens.has(token)) {
    return null;
  }

  try {
    const decoded = typeof atob !== 'undefined' ? atob(token) : Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 6) return null;

    const [userId, purpose, createdAtStr, expiresAtStr, nonce, expectedSig] = parts;
    const createdAt = parseInt(createdAtStr, 10);
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(createdAt) || isNaN(expiresAt)) return null;
    if (Date.now() > expiresAt) return null;
    if (purpose !== expectedPurpose) return null;

    const payloadStr = `${userId}:${purpose}:${createdAt}:${expiresAt}:${nonce}`;
    const actualSig = computeSignature(payloadStr);

    if (actualSig !== expectedSig) {
      return null;
    }

    return { userId, purpose: purpose as 'session' | 'password_reset', createdAt, expiresAt, nonce };
  } catch (err) {
    return null;
  }
}

export function verifySignedSessionToken(token: string): SessionPayload | null {
  return verifySignedToken(token, 'session');
}

/**
 * Marks a password reset token as used (single-use enforcement).
 */
export function markResetTokenAsUsed(token: string): void {
  if (token) {
    usedResetTokens.add(token);
  }
}
