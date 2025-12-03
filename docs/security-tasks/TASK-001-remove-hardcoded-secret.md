# TASK-001: Remove Hardcoded Fallback Secret Key

**Priority:** 🔴 Critical  
**Estimated Effort:** 15 minutes  
**Security Impact:** Authentication bypass prevention

---

## Context

The session management module (`lib/utils/session.ts`) contains a hardcoded fallback secret key that is used when the `SESSION_SECRET` environment variable is not set. This is a critical security vulnerability because:

1. If deployed without the environment variable, all JWT tokens would be signed with a publicly known key
2. Attackers could forge valid session tokens and impersonate any user
3. The fallback string `'your-secret-key-change-in-production'` is easily guessable

---

## Requirements

1. Remove the hardcoded fallback secret key
2. Make the application fail fast if `SESSION_SECRET` is not configured
3. Provide a clear error message to help developers diagnose the issue
4. Ensure build process still works (build doesn't execute runtime code)

---

## Implementation Guide

### Step 1: Modify `lib/utils/session.ts`

Replace the current secret key initialization:

```typescript
// CURRENT (VULNERABLE)
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
);
```

With a safer implementation:

```typescript
// NEW (SECURE)
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
      'Please set it in your .env.local file or deployment environment.'
    );
  }
  return new TextEncoder().encode(secret);
}

// Lazy initialization to avoid build-time errors
let _secretKey: Uint8Array | null = null;

function getSecretKeyLazy(): Uint8Array {
  if (!_secretKey) {
    _secretKey = getSecretKey();
  }
  return _secretKey;
}
```

### Step 2: Update functions that use SECRET_KEY

Update `createSession` and `verifySession` to use the lazy getter:

```typescript
export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getSecretKeyLazy());  // Changed from SECRET_KEY

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKeyLazy());  // Changed from SECRET_KEY
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}
```

### Step 3: Update documentation

Add a note to `docs/QUICK_START.md` or `README.md` about the required environment variable.

---

## Files to Modify

| File | Action |
|------|--------|
| `lib/utils/session.ts` | Modify - Remove fallback, add lazy initialization |
| `docs/QUICK_START.md` | Update - Add SESSION_SECRET requirement |
| `.env.example` | Create/Update - Document required variables |

---

## Acceptance Criteria

- [ ] Application throws a clear error when `SESSION_SECRET` is not set
- [ ] Error message explains what needs to be configured
- [ ] Application works normally when `SESSION_SECRET` is properly set
- [ ] `npm run build` still succeeds (lazy initialization prevents build-time crash)
- [ ] All existing tests pass
- [ ] New test added to verify error is thrown when secret is missing

---

## Testing Instructions

### Manual Testing

1. Remove or comment out `SESSION_SECRET` from `.env.local`
2. Start the dev server: `npm run dev`
3. Try to access a protected route (e.g., `/dashboard`)
4. Verify you see a clear error about missing `SESSION_SECRET`
5. Restore `SESSION_SECRET` and verify login works normally

### Automated Testing

Add to `lib/utils/session.test.ts`:

```typescript
describe('Session Security', () => {
  it('should throw error when SESSION_SECRET is not set', () => {
    const originalSecret = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    
    // Reset the cached key
    // (implementation detail - may need to export a reset function for testing)
    
    expect(() => getSecretKey()).toThrow('SESSION_SECRET environment variable is required');
    
    process.env.SESSION_SECRET = originalSecret;
  });
});
```

---

## Rollback Plan

If issues arise:
1. Revert the changes to `lib/utils/session.ts`
2. Ensure `SESSION_SECRET` is set in all environments
3. Investigate the root cause before re-implementing

---

## References

- Original audit finding: `docs/SECURITY_AUDIT.md` - Finding #1
- OWASP: [Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
