import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * Get the secret key for JWT signing/verification.
 * Throws if SESSION_SECRET is not configured.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
      'Please set it in your .env.local file or deployment environment.'
    );
  }
  return new TextEncoder().encode(secret);
}

// Lazy initialization to avoid build-time errors
let _secretKey: Uint8Array | null = null;

function getSecretKeyLazy(): Uint8Array {
  if (!_secretKey) {
    _secretKey = getSecretKey();
  }
  return _secretKey;
}

// Export for testing purposes only
export function _resetSecretKeyCache(): void {
  _secretKey = null;
}

const COOKIE_NAME = 'bookshelf_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

export interface SessionData {
  userId: string;
  username: string | null;
  email?: string;
  [key: string]: string | null | undefined; // Index signature for JWT compatibility
}

/**
 * Create a signed session token
 */
export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getSecretKeyLazy());

  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKeyLazy());
    return payload as SessionData;
  } catch {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(data: SessionData): Promise<void> {
  const token = await createSession(data);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

/**
 * Get session from cookie
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Clear session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
