import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Rate limiting utility for authentication endpoints.
 * Uses Upstash Redis for serverless-compatible rate limiting.
 */

// Lazy initialization to avoid build-time errors when env vars aren't set
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    // Check if Upstash credentials are configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        'Upstash Redis not configured. Rate limiting is disabled. ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment.'
      );
    }
    _redis = Redis.fromEnv();
  }
  return _redis;
}

// Lazy-initialized rate limiters
let _loginRateLimiter: Ratelimit | null = null;
let _signupRateLimiter: Ratelimit | null = null;
let _oauthRateLimiter: Ratelimit | null = null;

/**
 * Rate limiter for login endpoint: 5 requests per minute
 * Prevents brute force password attacks
 */
export function getLoginRateLimiter(): Ratelimit {
  if (!_loginRateLimiter) {
    _loginRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:login',
    });
  }
  return _loginRateLimiter;
}

/**
 * Rate limiter for signup endpoint: 3 requests per minute
 * Prevents spam account creation
 */
export function getSignupRateLimiter(): Ratelimit {
  if (!_signupRateLimiter) {
    _signupRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      analytics: true,
      prefix: 'ratelimit:signup',
    });
  }
  return _signupRateLimiter;
}

/**
 * Rate limiter for OAuth endpoint: 10 requests per minute
 * More lenient since OAuth has its own rate limits
 */
export function getOAuthRateLimiter(): Ratelimit {
  if (!_oauthRateLimiter) {
    _oauthRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit:oauth',
    });
  }
  return _oauthRateLimiter;
}

/**
 * Extract client IP from request headers.
 * Handles proxied requests (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers in order of reliability
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, the first is the client
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback for local development
  return '127.0.0.1';
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  success: boolean;
  response?: NextResponse;
}

/**
 * Check rate limit and return appropriate response if exceeded.
 * Returns success: true if within limit, or a 429 response if exceeded.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      ),
    };
  }
  
  return { success: true };
}

/**
 * Check if rate limiting is configured/available.
 * Returns false if Upstash credentials are not set.
 */
export function isRateLimitingEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// Reset cache for testing
export function _resetRateLimitCache(): void {
  _redis = null;
  _loginRateLimiter = null;
  _signupRateLimiter = null;
  _oauthRateLimiter = null;
}
