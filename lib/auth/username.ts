/**
 * Usernames for accounts created through Better Auth (issue #267).
 *
 * Email signups choose their own username. Google signups get one made from
 * the part of the email before the @, the same rule the old Google callback
 * used, with a number added on a collision.
 */

/** Same rules as `validateUsername` in `lib/utils/validation.ts`. */
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;
const USERNAME_PATTERN = /^[a-z0-9_-]+$/;

export function isValidUsername(username: string): boolean {
  return (
    username.length >= MIN_USERNAME_LENGTH &&
    username.length <= MAX_USERNAME_LENGTH &&
    USERNAME_PATTERN.test(username)
  );
}

/**
 * Build a free username from an email address. `isTaken` checks the database.
 */
export async function usernameFromEmail(
  email: string,
  isTaken: (username: string) => Promise<boolean>
): Promise<string> {
  let base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (base.length < MIN_USERNAME_LENGTH) base = `${base}reader`.slice(0, MIN_USERNAME_LENGTH + 6);
  base = base.slice(0, MAX_USERNAME_LENGTH - 4);

  let candidate = base;
  for (let counter = 1; await isTaken(candidate); counter++) {
    candidate = `${base}${counter}`;
  }
  return candidate;
}
