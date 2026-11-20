import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth/config';
import {
  checkRateLimit,
  getClientIP,
  getLoginRateLimiter,
  getOAuthRateLimiter,
  getSignupRateLimiter,
  isRateLimitingEnabled,
} from '@/lib/utils/rateLimit';

/**
 * Better Auth's endpoints: sign-up, sign-in, Google, sign-out, get-session.
 * `/api/auth/me` and `/api/auth/logout` are separate routes; Next.js matches
 * them before this catch-all.
 */

/** Which Upstash limiter guards a Better Auth path, if any. */
export function limiterForPath(pathname: string) {
  const path = pathname.replace(/^\/api\/auth/, '');
  if (path.startsWith('/sign-up')) return getSignupRateLimiter;
  if (path === '/sign-in/social' || path.startsWith('/callback/')) return getOAuthRateLimiter;
  if (path.startsWith('/sign-in')) return getLoginRateLimiter;
  return null;
}

async function rateLimited(request: Request): Promise<Response | null> {
  if (!isRateLimitingEnabled()) return null;
  const limiter = limiterForPath(new URL(request.url).pathname);
  if (!limiter) return null;
  const result = await checkRateLimit(limiter(), getClientIP(request));
  return result.success ? null : result.response;
}

// Built on first request so builds need no database or secrets.
function handler() {
  return toNextJsHandler(getAuth());
}

export async function GET(request: Request) {
  return (await rateLimited(request)) ?? handler().GET(request);
}

export async function POST(request: Request) {
  return (await rateLimited(request)) ?? handler().POST(request);
}
