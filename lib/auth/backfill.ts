/**
 * Backfill Better Auth account rows for existing users (issue #266).
 *
 * Better Auth keeps each sign-in method in `auth_accounts`. Users created by
 * the old auth code only have `users.password_hash` and/or `users.google_id`,
 * so before the cutover (#267) each of them needs:
 *   - a 'credential' account holding their existing bcrypt hash, if they have
 *     a password (account_id is the user's own id, as Better Auth does)
 *   - a 'google' account keyed by their Google `sub`, if they have one
 * and Google users get email_verified = true, since Google verified the email.
 *
 * Safe to re-run: existing account rows are never touched (ON CONFLICT DO
 * NOTHING), so a password set later through Better Auth is never overwritten
 * by the old hash. Run it again right before the cutover to pick up anyone
 * who signed up in between.
 *
 * Everything runs in one transaction. If any check fails, nothing is written.
 */

export interface QueryResult<Row> {
  rows: Row[];
  rowCount: number | null;
}

/** The slice of a pg / Neon pool client this needs. */
export interface BackfillClient {
  query<Row = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<Row>>;
}

export interface BackfillCounts {
  users: number;
  usersWithPassword: number;
  usersWithGoogle: number;
  credentialAccounts: number;
  googleAccounts: number;
  usersWithoutAccount: number;
}

export interface BackfillResult {
  dryRun: boolean;
  inserted: { credential: number; google: number };
  markedVerified: number;
  before: BackfillCounts;
  after: BackfillCounts;
}

export const INSERT_CREDENTIAL_ACCOUNTS = `
  INSERT INTO auth_accounts (user_id, account_id, provider_id, password, created_at, updated_at)
  SELECT u.id, u.id::text, 'credential', u.password_hash, COALESCE(u.created_at, NOW()), NOW()
  FROM users u
  WHERE u.password_hash IS NOT NULL
  ON CONFLICT (provider_id, account_id) DO NOTHING
`;

export const INSERT_GOOGLE_ACCOUNTS = `
  INSERT INTO auth_accounts (user_id, account_id, provider_id, created_at, updated_at)
  SELECT u.id, u.google_id, 'google', COALESCE(u.created_at, NOW()), NOW()
  FROM users u
  WHERE u.google_id IS NOT NULL
  ON CONFLICT (provider_id, account_id) DO NOTHING
`;

export const MARK_GOOGLE_USERS_VERIFIED = `
  UPDATE users
  SET email_verified = TRUE
  WHERE google_id IS NOT NULL AND email_verified = FALSE
`;

export const COUNTS_QUERY = `
  SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM users WHERE password_hash IS NOT NULL) AS users_with_password,
    (SELECT COUNT(*) FROM users WHERE google_id IS NOT NULL) AS users_with_google,
    (SELECT COUNT(*) FROM auth_accounts a JOIN users u ON u.id = a.user_id
       WHERE a.provider_id = 'credential') AS credential_accounts,
    (SELECT COUNT(*) FROM auth_accounts a JOIN users u ON u.id = a.user_id
       WHERE a.provider_id = 'google') AS google_accounts,
    (SELECT COUNT(*) FROM users u
       WHERE NOT EXISTS (SELECT 1 FROM auth_accounts a WHERE a.user_id = u.id)) AS users_without_account
`;

interface CountsRow {
  users: string | number;
  users_with_password: string | number;
  users_with_google: string | number;
  credential_accounts: string | number;
  google_accounts: string | number;
  users_without_account: string | number;
}

async function readCounts(client: BackfillClient): Promise<BackfillCounts> {
  const { rows } = await client.query<CountsRow>(COUNTS_QUERY);
  const row = rows[0];
  return {
    users: Number(row.users),
    usersWithPassword: Number(row.users_with_password),
    usersWithGoogle: Number(row.users_with_google),
    credentialAccounts: Number(row.credential_accounts),
    googleAccounts: Number(row.google_accounts),
    usersWithoutAccount: Number(row.users_without_account),
  };
}

/**
 * Throws if the backfilled state isn't what the cutover needs. Every user
 * must be able to sign in, with the same methods as before.
 */
export function checkCounts(after: BackfillCounts): void {
  const problems: string[] = [];
  if (after.usersWithoutAccount !== 0) {
    problems.push(`${after.usersWithoutAccount} user(s) have no sign-in account`);
  }
  if (after.credentialAccounts < after.usersWithPassword) {
    problems.push(
      `${after.usersWithPassword} user(s) have a password but only ${after.credentialAccounts} credential account(s) exist`
    );
  }
  if (after.googleAccounts < after.usersWithGoogle) {
    problems.push(
      `${after.usersWithGoogle} user(s) have a Google ID but only ${after.googleAccounts} Google account(s) exist`
    );
  }
  if (problems.length > 0) {
    throw new Error(`Backfill check failed: ${problems.join('; ')}`);
  }
}

/**
 * Run the backfill on a dedicated client (not a pool: the transaction must
 * stay on one connection). With dryRun, everything is rolled back and the
 * result reports what would have changed.
 */
export async function backfillAuthAccounts(
  client: BackfillClient,
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<BackfillResult> {
  await client.query('BEGIN');
  try {
    const before = await readCounts(client);
    const credential = await client.query(INSERT_CREDENTIAL_ACCOUNTS);
    const google = await client.query(INSERT_GOOGLE_ACCOUNTS);
    const verified = await client.query(MARK_GOOGLE_USERS_VERIFIED);
    const after = await readCounts(client);

    checkCounts(after);

    await client.query(dryRun ? 'ROLLBACK' : 'COMMIT');

    return {
      dryRun,
      inserted: {
        credential: credential.rowCount ?? 0,
        google: google.rowCount ?? 0,
      },
      markedVerified: verified.rowCount ?? 0,
      before,
      after,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
