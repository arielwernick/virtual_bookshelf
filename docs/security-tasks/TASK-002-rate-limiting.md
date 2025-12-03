# TASK-002: Implement Rate Limiting on Authentication Endpoints

**Priority:** 🔴 Critical  
**Estimated Effort:** 2-3 hours  
**Security Impact:** Brute force and credential stuffing prevention

---

## Context

The authentication endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/auth/google`) have no rate limiting. This makes the application vulnerable to:

- **Brute force attacks:** Unlimited password guessing attempts
- **Credential stuffing:** Testing stolen credentials at scale
- **Account enumeration:** Probing for valid usernames/emails
- **Signup spam:** Creating unlimited accounts to exhaust resources

---

## Requirements

1. Implement rate limiting on all authentication endpoints
2. Use IP-based limiting as the primary mechanism
3. Return proper `429 Too Many Requests` responses
4. Include `Retry-After` header in rate-limited responses
5. Consider using Upstash Redis for serverless-compatible rate limiting
6. Implement different limits for different endpoints

---

## Recommended Rate Limits

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `/api/auth/login` | 5 requests | 1 minute | Prevent brute force |
| `/api/auth/signup` | 3 requests | 1 minute | Prevent spam accounts |
| `/api/auth/google` | 10 requests | 1 minute | OAuth has own limits |

---

## Implementation Guide

### Step 1: Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Step 2: Create Rate Limit Utility

Create `lib/utils/rateLimit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
const redis = Redis.fromEnv();

// Create rate limiters for different endpoints
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:login',
});

export const signupRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'),
  analytics: true,
  prefix: 'ratelimit:signup',
});

export const oauthRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:oauth',
});

// Helper to get client IP
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

// Helper to check rate limit and return response if exceeded
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; response?: NextResponse }> {
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
```

### Step 3: Update Login Route

Modify `app/api/auth/login/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db/queries';
import { verifyPassword } from '@/lib/utils/password';
import { setSessionCookie } from '@/lib/utils/session';
import { validateUsername, validatePassword } from '@/lib/utils/validation';
import { loginRateLimiter, getClientIP, checkRateLimit } from '@/lib/utils/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const ip = getClientIP(request);
    const rateLimitResult = await checkRateLimit(loginRateLimiter, ip);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    // ... rest of existing login logic
  } catch (error) {
    // ... existing error handling
  }
}
```

### Step 4: Update Signup Route

Modify `app/api/auth/signup/route.ts` similarly, using `signupRateLimiter`.

### Step 5: Update Google OAuth Route

Modify `app/api/auth/google/route.ts` similarly, using `oauthRateLimiter`.

### Step 6: Set Up Upstash Redis

1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and token
4. Add to `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

---

## Files to Modify

| File | Action |
|------|--------|
| `package.json` | Add @upstash/ratelimit and @upstash/redis |
| `lib/utils/rateLimit.ts` | Create - Rate limiting utilities |
| `app/api/auth/login/route.ts` | Modify - Add rate limiting |
| `app/api/auth/signup/route.ts` | Modify - Add rate limiting |
| `app/api/auth/google/route.ts` | Modify - Add rate limiting |
| `.env.local` | Add Upstash credentials |
| `.env.example` | Document Upstash variables |

---

## Acceptance Criteria

- [ ] Rate limiting is applied to all auth endpoints
- [ ] Exceeding limit returns 429 status with `Retry-After` header
- [ ] Different endpoints have appropriate limits
- [ ] Rate limits reset after the specified window
- [ ] IP addresses are correctly extracted from headers
- [ ] Build succeeds and tests pass
- [ ] Logging captures rate limit events (optional)

---

## Testing Instructions

### Manual Testing

```bash
# Test login rate limiting (should fail after 5 rapid requests)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done
```

### Automated Testing

Add to `app/api/auth/login/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the rate limiter
vi.mock('@/lib/utils/rateLimit', () => ({
  loginRateLimiter: {
    limit: vi.fn(),
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
  checkRateLimit: vi.fn(),
}));

describe('Login Rate Limiting', () => {
  it('should return 429 when rate limit exceeded', async () => {
    const { checkRateLimit } = await import('@/lib/utils/rateLimit');
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      response: new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 }),
    });
    
    // Test the route...
  });
});
```

---

## Alternative: In-Memory Rate Limiting (No Redis)

If Upstash isn't available, use in-memory rate limiting (note: won't work across serverless instances):

```typescript
// Simple in-memory rate limiter (for development only)
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimitInMemory(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}
```

---

## Rollback Plan

If issues arise:
1. Remove rate limit checks from route handlers
2. Keep the utility file for future use
3. Investigate Redis connectivity issues

---

## References

- Original audit finding: `docs/SECURITY_AUDIT.md` - Finding #2
- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- OWASP: [Blocking Brute Force Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
