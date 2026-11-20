'use client';

import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

/** Better Auth in the browser. Talks to /api/auth on the same origin. */
export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

/**
 * The messages the old sign-in routes used, keyed by Better Auth error code.
 * Anything else falls back to the caller's default.
 */
const FRIENDLY_ERRORS: Record<string, string> = {
  USERNAME_IS_ALREADY_TAKEN: 'Username already taken',
  USER_ALREADY_EXISTS: 'Email already registered',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Email already registered',
  INVALID_USERNAME_OR_PASSWORD: 'Invalid username or password',
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    'This account uses Google authentication. Please sign in with Google.',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters',
  USERNAME_TOO_LONG: 'Username must be 50 characters or less',
  INVALID_USERNAME: 'Username can only contain letters, numbers, hyphens, and underscores',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  PASSWORD_TOO_LONG: 'Password must be 100 characters or less',
  INVALID_EMAIL: 'Invalid email address',
};

export function friendlyAuthError(
  error: { code?: string; message?: string; status?: number } | null | undefined,
  fallback: string
): string {
  if (!error) return fallback;
  if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
  return (error.code && FRIENDLY_ERRORS[error.code]) || fallback;
}
