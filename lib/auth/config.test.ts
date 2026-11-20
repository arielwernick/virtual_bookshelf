// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { hashPassword } from '@/lib/utils/password';
import {
  AUTH_TABLES,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  SESSION_MAX_AGE_SECONDS,
  buildAuthOptions,
  signupSourceForPath,
} from './config';

const ENV = {
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
  BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-for-better-auth',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
};

type Row = Record<string, unknown>;

function createTestAuth() {
  const db: Record<string, Row[]> = {
    [AUTH_TABLES.user]: [],
    [AUTH_TABLES.session]: [],
    [AUTH_TABLES.account]: [],
    [AUTH_TABLES.verification]: [],
  };
  const options = buildAuthOptions(memoryAdapter(db), ENV, {
    isUsernameTaken: async (username) =>
      db[AUTH_TABLES.user].some((row) => row.username === username),
  });
  // The memory adapter has no gen_random_uuid(), so let Better Auth make ids.
  const auth = betterAuth({
    ...options,
    advanced: { database: { generateId: () => crypto.randomUUID() } },
  });
  return { auth, db };
}

describe('buildAuthOptions', () => {
  describe('Schema mapping', () => {
    it('uses the existing users table and the auth_* tables', () => {
      const options = buildAuthOptions(undefined, ENV);
      expect(options.user.modelName).toBe('users');
      expect(options.session.modelName).toBe('auth_sessions');
      expect(options.account.modelName).toBe('auth_accounts');
      expect(options.verification.modelName).toBe('auth_verifications');
    });

    it('maps Better Auth fields onto snake_case columns', () => {
      const options = buildAuthOptions(undefined, ENV);
      expect(options.user.fields).toEqual({
        name: 'display_name',
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });
      expect(options.account.fields.userId).toBe('user_id');
      expect(options.account.fields.providerId).toBe('provider_id');
      expect(options.account.fields.accountId).toBe('account_id');
      expect(options.session.fields.expiresAt).toBe('expires_at');
    });

    it('lets Postgres generate UUID ids', () => {
      const options = buildAuthOptions(undefined, ENV);
      expect(options.advanced.database.generateId).toBe('uuid');
    });

    it('keeps signup source and attribution read-only for clients', () => {
      const { additionalFields } = buildAuthOptions(undefined, ENV).user;
      expect(additionalFields.signupSource).toMatchObject({ input: false, fieldName: 'signup_source' });
      expect(additionalFields.firstLandingPath).toMatchObject({
        input: false,
        fieldName: 'first_landing_path',
      });
    });
  });

  describe('Sign-in rules carried over from today', () => {
    it('keeps the 7-day session length', () => {
      expect(buildAuthOptions(undefined, ENV).session.expiresIn).toBe(
        SESSION_MAX_AGE_SECONDS
      );
      expect(SESSION_MAX_AGE_SECONDS).toBe(7 * 24 * 60 * 60);
    });

    it('keeps the password length limits', () => {
      const { emailAndPassword } = buildAuthOptions(undefined, ENV);
      expect(emailAndPassword.minPasswordLength).toBe(MIN_PASSWORD_LENGTH);
      expect(emailAndPassword.maxPasswordLength).toBe(MAX_PASSWORD_LENGTH);
    });

    it('trusts Google for linking to an existing account with the same email', () => {
      const { account } = buildAuthOptions(undefined, ENV);
      expect(account.accountLinking).toEqual({
        enabled: true,
        trustedProviders: ['google'],
      });
    });

    it('enables Google only when both credentials are set', () => {
      expect(buildAuthOptions(undefined, ENV).socialProviders?.google).toEqual({
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
      });
      expect(
        buildAuthOptions(undefined, { ...ENV, GOOGLE_CLIENT_SECRET: undefined })
          .socialProviders
      ).toBeUndefined();
    });
  });

  describe('Passwords', () => {
    // Rows here use the real column names, so these tests also check the
    // field mapping end to end.
    it('stores new passwords as bcrypt hashes', async () => {
      const { auth, db } = createTestAuth();

      await auth.api.signUpEmail({
        body: { email: 'new@example.com', password: 'hunter22', name: 'New Person' },
      });

      const account = db[AUTH_TABLES.account][0];
      expect(account.provider_id).toBe('credential');
      expect(String(account.password)).toMatch(/^\$2[aby]\$/);
    });

    it('signs in with an existing bcrypt hash carried over from the old users table', async () => {
      const { auth, db } = createTestAuth();
      const userId = crypto.randomUUID();
      const now = new Date();
      db[AUTH_TABLES.user].push({
        id: userId,
        email: 'existing@example.com',
        display_name: null,
        email_verified: false,
        created_at: now,
        updated_at: now,
      });
      db[AUTH_TABLES.account].push({
        id: crypto.randomUUID(),
        user_id: userId,
        account_id: userId,
        provider_id: 'credential',
        password: await hashPassword('hunter22'),
        created_at: now,
        updated_at: now,
      });

      const result = await auth.api.signInEmail({
        body: { email: 'existing@example.com', password: 'hunter22' },
      });
      expect(result.user.id).toBe(userId);

      await expect(
        auth.api.signInEmail({
          body: { email: 'existing@example.com', password: 'wrong-password' },
        })
      ).rejects.toThrow();
    });

    it('rejects passwords shorter than the current minimum', async () => {
      const { auth } = createTestAuth();
      await expect(
        auth.api.signUpEmail({
          body: { email: 'short@example.com', password: '12345', name: 'Short' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Usernames and signup details (#267)', () => {
    it('signs up with a chosen username, lowercased, and records the source', async () => {
      const { auth, db } = createTestAuth();
      await auth.api.signUpEmail({
        body: { email: 'reader@example.com', password: 'hunter22', name: '', username: 'Reader_1' },
      });
      const user = db[AUTH_TABLES.user][0];
      expect(user.username).toBe('reader_1');
      expect(user.signup_source).toBe('email');
    });

    it('rejects usernames the old rules rejected', async () => {
      const { auth } = createTestAuth();
      await expect(
        auth.api.signUpEmail({
          body: { email: 'dot@example.com', password: 'hunter22', name: '', username: 'has.dot' },
        })
      ).rejects.toThrow();
    });

    it('rejects a username that is already taken', async () => {
      const { auth } = createTestAuth();
      await auth.api.signUpEmail({
        body: { email: 'a@example.com', password: 'hunter22', name: '', username: 'taken' },
      });
      await expect(
        auth.api.signUpEmail({
          body: { email: 'b@example.com', password: 'hunter22', name: '', username: 'taken' },
        })
      ).rejects.toThrow();
    });

    it('makes a username from the email when none is given', async () => {
      const { auth, db } = createTestAuth();
      await auth.api.signUpEmail({
        body: { email: 'Jane.Doe@example.com', password: 'hunter22', name: '' },
      });
      expect(db[AUTH_TABLES.user][0].username).toBe('janedoe');
    });

    it('signs in by username with an existing password', async () => {
      const { auth } = createTestAuth();
      await auth.api.signUpEmail({
        body: { email: 'login@example.com', password: 'hunter22', name: '', username: 'loginuser' },
      });
      const result = await auth.api.signInUsername({
        body: { username: 'LoginUser', password: 'hunter22' },
      });
      expect(result?.user.email).toBe('login@example.com');
    });

    it('stores signup attribution from the vb_attribution cookie', async () => {
      const { auth, db } = createTestAuth();
      const cookie = encodeURIComponent(
        JSON.stringify({ r: 'https://chatgpt.com/c/123', us: 'newsletter', l: '/import' })
      );
      await auth.api.signUpEmail({
        body: { email: 'utm@example.com', password: 'hunter22', name: '', username: 'utmuser' },
        headers: new Headers({ cookie: `other=1; vb_attribution=${cookie}` }),
      });
      const user = db[AUTH_TABLES.user][0];
      expect(user.first_referrer).toBe('https://chatgpt.com/c/123');
      expect(user.utm_source).toBe('newsletter');
      expect(user.first_landing_path).toBe('/import');
    });

    it('labels callback signups as Google and form signups as email', () => {
      expect(signupSourceForPath('/sign-up/email')).toBe('email');
      expect(signupSourceForPath('/callback/:id')).toBe('google');
      expect(signupSourceForPath(undefined)).toBe('google');
    });
  });

  describe('Vercel previews', () => {
    it('reads the base URL from the request and trusts the preview URLs', () => {
      const options = buildAuthOptions(undefined, {
        ...ENV,
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'vb-abc123.vercel.app',
        VERCEL_BRANCH_URL: 'vb-git-branch.vercel.app',
      });
      expect(options.baseURL).toBeUndefined();
      expect(options.trustedOrigins).toEqual([
        'https://vb-abc123.vercel.app',
        'https://vb-git-branch.vercel.app',
      ]);
    });

    it('uses NEXT_PUBLIC_BASE_URL in production', () => {
      const options = buildAuthOptions(undefined, { ...ENV, VERCEL_ENV: 'production' });
      expect(options.baseURL).toBe('http://localhost:3000');
      expect(options.trustedOrigins).toEqual([]);
    });
  });
});
