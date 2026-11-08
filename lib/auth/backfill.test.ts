// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  backfillAuthAccounts,
  checkCounts,
  COUNTS_QUERY,
  INSERT_CREDENTIAL_ACCOUNTS,
  INSERT_GOOGLE_ACCOUNTS,
  MARK_GOOGLE_USERS_VERIFIED,
  type BackfillClient,
  type BackfillCounts,
} from './backfill';

function createCounts(overrides: Partial<BackfillCounts> = {}): BackfillCounts {
  return {
    users: 3,
    usersWithPassword: 2,
    usersWithGoogle: 2,
    credentialAccounts: 2,
    googleAccounts: 2,
    usersWithoutAccount: 0,
    ...overrides,
  };
}

function countsRow(counts: BackfillCounts) {
  // Postgres returns COUNT(*) as a string.
  return {
    users: String(counts.users),
    users_with_password: String(counts.usersWithPassword),
    users_with_google: String(counts.usersWithGoogle),
    credential_accounts: String(counts.credentialAccounts),
    google_accounts: String(counts.googleAccounts),
    users_without_account: String(counts.usersWithoutAccount),
  };
}

/** A fake client: counts come back before, then after; inserts report rowCounts. */
function createClient({
  before = createCounts({ credentialAccounts: 0, googleAccounts: 0, usersWithoutAccount: 3 }),
  after = createCounts(),
  inserted = { credential: 2, google: 2, verified: 2 },
  failOn,
}: {
  before?: BackfillCounts;
  after?: BackfillCounts;
  inserted?: { credential: number; google: number; verified: number };
  failOn?: string;
} = {}) {
  const calls: string[] = [];
  let countsCalls = 0;
  const query = vi.fn(async (text: string) => {
    calls.push(text);
    if (failOn && text === failOn) throw new Error('boom');
    if (text === COUNTS_QUERY) {
      countsCalls++;
      return { rows: [countsRow(countsCalls === 1 ? before : after)], rowCount: 1 };
    }
    if (text === INSERT_CREDENTIAL_ACCOUNTS) return { rows: [], rowCount: inserted.credential };
    if (text === INSERT_GOOGLE_ACCOUNTS) return { rows: [], rowCount: inserted.google };
    if (text === MARK_GOOGLE_USERS_VERIFIED) return { rows: [], rowCount: inserted.verified };
    return { rows: [], rowCount: null };
  });
  return { client: { query } as unknown as BackfillClient, calls };
}

describe('backfillAuthAccounts', () => {
  describe('Applying', () => {
    it('runs every step in one transaction and commits', async () => {
      const { client, calls } = createClient();

      await backfillAuthAccounts(client);

      expect(calls).toEqual([
        'BEGIN',
        COUNTS_QUERY,
        INSERT_CREDENTIAL_ACCOUNTS,
        INSERT_GOOGLE_ACCOUNTS,
        MARK_GOOGLE_USERS_VERIFIED,
        COUNTS_QUERY,
        'COMMIT',
      ]);
    });

    it('reports what was inserted and the counts before and after', async () => {
      const { client } = createClient();

      const result = await backfillAuthAccounts(client);

      expect(result.dryRun).toBe(false);
      expect(result.inserted).toEqual({ credential: 2, google: 2 });
      expect(result.markedVerified).toBe(2);
      expect(result.before.usersWithoutAccount).toBe(3);
      expect(result.after).toEqual(createCounts());
    });
  });

  describe('Dry run', () => {
    it('rolls back instead of committing', async () => {
      const { client, calls } = createClient();

      const result = await backfillAuthAccounts(client, { dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(calls.at(-1)).toBe('ROLLBACK');
      expect(calls).not.toContain('COMMIT');
    });
  });

  describe('Edge Cases', () => {
    it('rolls back and throws when a user would be left without an account', async () => {
      const { client, calls } = createClient({
        after: createCounts({ usersWithoutAccount: 1 }),
      });

      await expect(backfillAuthAccounts(client)).rejects.toThrow(
        '1 user(s) have no sign-in account'
      );
      expect(calls.at(-1)).toBe('ROLLBACK');
      expect(calls).not.toContain('COMMIT');
    });

    it('rolls back and rethrows when a query fails', async () => {
      const { client, calls } = createClient({ failOn: INSERT_GOOGLE_ACCOUNTS });

      await expect(backfillAuthAccounts(client)).rejects.toThrow('boom');
      expect(calls.at(-1)).toBe('ROLLBACK');
    });

    it('reports zero inserts on a re-run', async () => {
      const { client } = createClient({
        before: createCounts(),
        inserted: { credential: 0, google: 0, verified: 0 },
      });

      const result = await backfillAuthAccounts(client);

      expect(result.inserted).toEqual({ credential: 0, google: 0 });
      expect(result.markedVerified).toBe(0);
    });
  });
});

describe('checkCounts', () => {
  it('passes when every user has the accounts they need', () => {
    expect(() => checkCounts(createCounts())).not.toThrow();
  });

  it('fails when credential accounts are missing', () => {
    expect(() => checkCounts(createCounts({ credentialAccounts: 1 }))).toThrow(
      '2 user(s) have a password but only 1 credential account(s) exist'
    );
  });

  it('fails when Google accounts are missing', () => {
    expect(() => checkCounts(createCounts({ googleAccounts: 0 }))).toThrow(
      '2 user(s) have a Google ID but only 0 Google account(s) exist'
    );
  });
});

describe('SQL', () => {
  it('never overwrites existing account rows', () => {
    expect(INSERT_CREDENTIAL_ACCOUNTS).toContain('ON CONFLICT (provider_id, account_id) DO NOTHING');
    expect(INSERT_GOOGLE_ACCOUNTS).toContain('ON CONFLICT (provider_id, account_id) DO NOTHING');
  });

  it('keys credential accounts by user id and Google accounts by Google ID', () => {
    expect(INSERT_CREDENTIAL_ACCOUNTS).toContain("u.id::text, 'credential', u.password_hash");
    expect(INSERT_GOOGLE_ACCOUNTS).toContain("u.google_id, 'google'");
  });
});
