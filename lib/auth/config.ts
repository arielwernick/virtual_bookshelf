/**
 * Better Auth configuration (issue #265).
 *
 * Nothing calls this yet: sign-in still runs through the hand-written routes
 * in `app/api/auth/*` and the JWT cookie in `lib/utils/session.ts`. The
 * cutover (#267) mounts Better Auth at `/api/auth` and switches the app to
 * `getAuth()`.
 *
 * Schema: Better Auth reuses the existing `users` table and stores sessions,
 * sign-in methods and verification tokens in the `auth_*` tables from
 * migration 006. Column names are snake_case to match the rest of the schema,
 * so every Better Auth field is mapped explicitly below.
 */

import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { Pool } from '@neondatabase/serverless';
import { hashPassword, verifyPassword } from '@/lib/utils/password';

/** Table names Better Auth reads and writes. */
export const AUTH_TABLES = {
  user: 'users',
  session: 'auth_sessions',
  account: 'auth_accounts',
  verification: 'auth_verifications',
} as const;

/** Matches the 7-day JWT cookie it replaces. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Same limits as `validatePassword` in `lib/utils/validation.ts`. */
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 100;

/**
 * The variables read: NEXT_PUBLIC_BASE_URL, BETTER_AUTH_SECRET,
 * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
 */
type AuthEnv = Record<string, string | undefined>;

/**
 * Build the Better Auth options for a given database. Kept separate from
 * `getAuth()` so tests and scripts (the backfill in #266, schema checks) can
 * run the same configuration against any Postgres pool.
 */
export function buildAuthOptions(
  database: BetterAuthOptions['database'],
  env: AuthEnv = process.env
) {
  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return {
    appName: 'Virtual Bookshelf',
    baseURL: env.NEXT_PUBLIC_BASE_URL,
    secret: env.BETTER_AUTH_SECRET,
    database,

    advanced: {
      database: {
        // users.id and the auth_* ids are UUIDs from gen_random_uuid().
        generateId: 'uuid',
      },
    },

    user: {
      modelName: AUTH_TABLES.user,
      fields: {
        // Private for now; how it shows on public shelves is the open
        // curator decision.
        name: 'display_name',
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      additionalFields: {
        // Existing column. Read-only through Better Auth: clients can't set
        // it at signup. Generated server-side in the cutover (#267).
        username: { type: 'string', required: false, input: false },
      },
    },

    session: {
      modelName: AUTH_TABLES.session,
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      expiresIn: SESSION_MAX_AGE_SECONDS,
    },

    account: {
      modelName: AUTH_TABLES.account,
      fields: {
        accountId: 'account_id',
        providerId: 'provider_id',
        userId: 'user_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      accountLinking: {
        enabled: true,
        // Today, signing in with Google links to an existing account with the
        // same email. Trusting Google keeps that behaviour.
        trustedProviders: ['google'],
      },
    },

    verification: {
      modelName: AUTH_TABLES.verification,
      fields: {
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },

    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
      // bcrypt, so every existing password hash keeps working unchanged.
      password: {
        hash: hashPassword,
        verify: ({ hash, password }: { hash: string; password: string }) =>
          verifyPassword(password, hash),
      },
    },

    socialProviders: googleConfigured
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
          },
        }
      : undefined,
  } satisfies BetterAuthOptions;
}

function createAuth() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return betterAuth(buildAuthOptions(new Pool({ connectionString })));
}

export type Auth = ReturnType<typeof createAuth>;

let _auth: Auth | null = null;

/**
 * The Better Auth instance, created on first use (like `lib/db/client.ts`)
 * so builds don't need a database or secrets.
 */
export function getAuth(): Auth {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}
