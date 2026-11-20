// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/utils/rateLimit', () => ({
  getSignupRateLimiter: vi.fn(),
  getLoginRateLimiter: vi.fn(),
  getOAuthRateLimiter: vi.fn(),
  getClientIP: vi.fn(),
  checkRateLimit: vi.fn(),
  isRateLimitingEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/auth/config', () => ({ getAuth: vi.fn() }));

import { limiterForPath } from './route';
import {
  getLoginRateLimiter,
  getOAuthRateLimiter,
  getSignupRateLimiter,
} from '@/lib/utils/rateLimit';

describe('limiterForPath', () => {
  it('keeps the signup limiter on sign-up', () => {
    expect(limiterForPath('/api/auth/sign-up/email')).toBe(getSignupRateLimiter);
  });

  it('keeps the login limiter on username and email sign-in', () => {
    expect(limiterForPath('/api/auth/sign-in/username')).toBe(getLoginRateLimiter);
    expect(limiterForPath('/api/auth/sign-in/email')).toBe(getLoginRateLimiter);
  });

  it('keeps the OAuth limiter on Google sign-in and its callback', () => {
    expect(limiterForPath('/api/auth/sign-in/social')).toBe(getOAuthRateLimiter);
    expect(limiterForPath('/api/auth/callback/google')).toBe(getOAuthRateLimiter);
  });

  it('does not limit session reads or sign-out', () => {
    expect(limiterForPath('/api/auth/get-session')).toBeNull();
    expect(limiterForPath('/api/auth/sign-out')).toBeNull();
  });
});
