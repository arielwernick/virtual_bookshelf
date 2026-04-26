import { NextRequest, NextResponse } from 'next/server';
import {
  getExternalApiRateLimiter,
  checkRateLimit,
  isRateLimitingEnabled,
  getClientIP,
} from '@/lib/utils/rateLimit';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('Middleware');

// Routes that fan out to paid/quota'd external APIs and need IP rate limiting.
// Order matters: prefix matches are checked top-down.
const EXTERNAL_API_PREFIXES = [
  '/api/search/',
  '/api/finance/',
  '/api/import/',
  '/api/items/from-url',
];

function needsExternalApiRateLimit(pathname: string): boolean {
  return EXTERNAL_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!needsExternalApiRateLimit(pathname)) {
    return NextResponse.next();
  }

  // Gracefully no-op when Upstash isn't configured (e.g. local dev without env).
  if (!isRateLimitingEnabled()) {
    return NextResponse.next();
  }

  try {
    const ip = getClientIP(request);
    const result = await checkRateLimit(getExternalApiRateLimiter(), `ip:${ip}`);
    if (!result.success && result.response) {
      return result.response;
    }
  } catch (error) {
    // If the limiter itself fails (Redis hiccup), fail open rather than 500-ing the user.
    logger.errorWithException('Rate limit check failed; allowing request', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/search/:path*',
    '/api/finance/:path*',
    '/api/import/:path*',
    '/api/items/from-url',
  ],
};
