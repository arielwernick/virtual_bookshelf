import { getSession } from './session';
import { getUserById } from '@/lib/db/queries';
import type { User } from '@/lib/types/shelf';

/**
 * Emails allowed to view /admin, from the comma-separated ADMIN_EMAILS env var.
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

/**
 * Return the logged-in user if they are an admin, otherwise null.
 * Checks the email stored in the database rather than trusting the session.
 */
export async function getAdminUser(): Promise<User | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await getUserById(session.userId);
  if (!user || !isAdminEmail(user.email)) return null;

  return user;
}
