import { headers } from 'next/headers';
import { getAuth } from './config';

/**
 * The signed-in user, as server code needs it. Replaces the old JWT
 * `getSession()` from `lib/utils/session.ts` and keeps its field names.
 */
export interface CurrentUser {
  userId: string;
  username: string | null;
  /** Always set for a real session; optional, as in the old type, for tests. */
  email?: string;
}

/**
 * Read the Better Auth session for this request. Returns null when nobody is
 * signed in.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;

  return {
    userId: session.user.id,
    username: session.user.username ?? null,
    email: session.user.email,
  };
}
