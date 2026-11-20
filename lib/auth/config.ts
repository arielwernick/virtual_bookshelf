/**
 * Better Auth configuration (issues #265 and #267).
 *
 * Mounted at `/api/auth/[...all]`. Server code reads the signed-in user with
 * `getCurrentUser()` in `lib/auth/session.ts`.
 *
 * Schema: Better Auth reuses the existing `users` table and stores sessions,
 * sign-in methods and verification tokens in the `auth_*` tables from
 * migration 006. Column names are snake_case to match the rest of the schema,
 * so every Better Auth field is mapped explicitly below.
 */

import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { username as usernamePlugin } from 'better-auth/plugins';
import { Pool } from '@neondatabase/serverless';
import { hashPassword, verifyPassword } from '@/lib/utils/password';
import { ATTRIBUTION_COOKIE, parseAttributionCookie } from '@/lib/utils/attribution';
import type { SignupSource } from '@/lib/types/shelf';
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  isValidUsername,
  usernameFromEmail,
} from './username';

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
 * GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and on Vercel VERCEL_ENV,
 * VERCEL_URL and VERCEL_BRANCH_URL.
 */
type AuthEnv = Record<string, string | undefined>;

export interface AuthDeps {
  /** Whether a username is already in use. Used for Google signups. */
  isUsernameTaken: (username: string) => Promise<boolean>;
}

async function isUsernameTakenInDb(username: string): Promise<boolean> {
  const { getUserByUsername } = await import('@/lib/db/queries');
  return (await getUserByUsername(username)) !== null;
}

/**
 * Previews run on their own vercel.app URLs. Better Auth only accepts
 * requests from trusted origins, so those URLs are trusted on previews, and
 * the base URL is read from each request instead of NEXT_PUBLIC_BASE_URL.
 */
function previewOrigins(env: AuthEnv): string[] {
  if (env.VERCEL_ENV !== 'preview') return [];
  return [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
    .filter((host): host is string => Boolean(host))
    .map((host) => `https://${host}`);
}

/** Which signup path created the user: email form or Google. */
export function signupSourceForPath(path: string | undefined): SignupSource {
  return path?.startsWith('/sign-up') ? 'email' : 'google';
}

function readCookie(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

/**
 * Build the Better Auth options for a given database. Kept separate from
 * `getAuth()` so tests and scripts (the backfill in #266, schema checks) can
 * run the same configuration against any Postgres pool.
 */
export function buildAuthOptions(
  database: BetterAuthOptions['database'],
  env: AuthEnv = process.env,
  deps: AuthDeps = { isUsernameTaken: isUsernameTakenInDb }
) {
  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const isPreview = env.VERCEL_ENV === 'preview';

  return {
    appName: 'Virtual Bookshelf',
    baseURL: isPreview ? undefined : env.NEXT_PUBLIC_BASE_URL,
    trustedOrigins: previewOrigins(env),
    secret: env.BETTER_AUTH_SECRET,
    database,

    plugins: [
      // Sign in with a username, as the old login form did. Usernames are
      // lowercased, then checked against the same rules as before.
      usernamePlugin({
        minUsernameLength: MIN_USERNAME_LENGTH,
        maxUsernameLength: MAX_USERNAME_LENGTH,
        usernameValidator: isValidUsername,
        validationOrder: { username: 'post-normalization' },
        displayUsername: false,
      }),
    ],

    databaseHooks: {
      user: {
        create: {
          // Fill in what the old signup routes wrote: a username for Google
          // signups, the signup method, and where the visitor came from.
          before: async (user, ctx) => {
            const source = signupSourceForPath(ctx?.path);
            const cookieHeader = ctx?.headers?.get('cookie') ?? ctx?.request?.headers.get('cookie');
            const attribution = parseAttributionCookie(readCookie(cookieHeader, ATTRIBUTION_COOKIE));
            const existing = typeof user.username === 'string' ? user.username : '';
            const username = existing || (await usernameFromEmail(user.email, deps.isUsernameTaken));

            return {
              data: {
                ...user,
                username,
                signupSource: source,
                firstReferrer: attribution?.firstReferrer ?? null,
                utmSource: attribution?.utmSource ?? null,
                utmMedium: attribution?.utmMedium ?? null,
                utmCampaign: attribution?.utmCampaign ?? null,
                firstLandingPath: attribution?.landingPath ?? null,
              },
            };
          },
        },
      },
    },

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
      // `username` comes from the username plugin. These are set by the
      // create hook above; clients can't send them.
      additionalFields: {
        signupSource: { type: 'string', required: false, input: false, fieldName: 'signup_source' },
        firstReferrer: { type: 'string', required: false, input: false, fieldName: 'first_referrer' },
        utmSource: { type: 'string', required: false, input: false, fieldName: 'utm_source' },
        utmMedium: { type: 'string', required: false, input: false, fieldName: 'utm_medium' },
        utmCampaign: { type: 'string', required: false, input: false, fieldName: 'utm_campaign' },
        firstLandingPath: { type: 'string', required: false, input: false, fieldName: 'first_landing_path' },
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
