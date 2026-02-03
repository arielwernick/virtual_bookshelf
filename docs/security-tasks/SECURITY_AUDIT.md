# Virtual Bookshelf Security Audit

**Audit Date:** December 1, 2025  
**Auditor:** Security Review Agent  
**Branch:** `security/audit-december-2025`  
**Scope:** Full application security review

---

## Executive Summary

This security audit identifies potential vulnerabilities and security gaps in the Virtual Bookshelf application. The findings are categorized by severity and include recommended remediation steps.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 5 |
| 🟡 Medium | 6 |
| 🔵 Low | 4 |
| ℹ️ Informational | 3 |

---

## 🔴 Critical Findings

### 1. Hardcoded Fallback Secret Key

**File:** `lib/utils/session.ts`  
**Line:** 4-6

```typescript
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
);
```

**Issue:** A hardcoded fallback secret key is used when `SESSION_SECRET` environment variable is not set. If deployed without the environment variable, all sessions would use this predictable key, allowing attackers to forge valid session tokens.

**Impact:** Complete authentication bypass. Attackers could impersonate any user.

**Remediation:**
```typescript
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set');
}
const SECRET_KEY = new TextEncoder().encode(SESSION_SECRET);
```

---

### 2. No Rate Limiting on Authentication Endpoints

**Files:** 
- `app/api/auth/login/route.ts`
- `app/api/auth/signup/route.ts`
- `app/api/auth/google/route.ts`

**Issue:** Authentication endpoints have no rate limiting, making the application vulnerable to:
- Brute force attacks on login
- Credential stuffing attacks
- Account enumeration
- Signup spam/resource exhaustion

**Impact:** Attackers can attempt unlimited password guesses or create unlimited accounts.

**Remediation:**
- Implement rate limiting middleware (e.g., using `@upstash/ratelimit` with Vercel KV)
- Add progressive delays after failed attempts
- Consider CAPTCHA after multiple failures

```typescript
// Example using Upstash
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
});

// In route handler:
const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
const { success } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

---

## 🟠 High Severity Findings

### 3. Excessive Logging of Sensitive Data

**Files:**
- `app/api/auth/google/route.ts` (lines 17-55)
- `app/api/auth/google/callback/route.ts` (lines 17-65)

**Issue:** OAuth flow logs contain sensitive information including:
- Full URLs with authorization codes
- OAuth state tokens
- User email addresses
- Cookie headers

```typescript
console.log('Full URL:', url.toString());
console.log('All search params:', Array.from(url.searchParams.entries()));
console.log('Cookie verification:', { ... rawCookieHeader ... });
```

**Impact:** In production, these logs could expose sensitive tokens and PII to anyone with log access, or leak through error monitoring services.

**Remediation:**
- Remove debug logging in production
- Use conditional logging: `if (process.env.NODE_ENV === 'development')`
- Never log full URLs, tokens, or credentials
- Implement proper structured logging with PII redaction

---

### 4. No Password Complexity Requirements

**File:** `lib/utils/validation.ts` (lines 44-56)

```typescript
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  // No complexity checks!
  return { valid: true };
}
```

**Issue:** Password validation only checks minimum length (6 characters). No requirements for:
- Uppercase letters
- Lowercase letters  
- Numbers
- Special characters
- Common password blocking

**Impact:** Users can set weak passwords like `123456` or `password`, making accounts vulnerable to dictionary attacks.

**Remediation:**
```typescript
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  // Optionally check against common passwords list
  return { valid: true };
}
```

---

### 5. Missing Security Headers

**Issue:** No security headers are configured. The application lacks:
- `Content-Security-Policy` (CSP)
- `X-Frame-Options` (clickjacking protection)
- `X-Content-Type-Options` (MIME sniffing)
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` (HSTS)

**Impact:** 
- Application is vulnerable to clickjacking (can be embedded in malicious iframes)
- No protection against XSS via CSP
- Sensitive referer data may be leaked

**Remediation:** Create `middleware.ts` in the root directory:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https://accounts.google.com https://www.googleapis.com https://api.spotify.com;"
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  return response;
}
```

---

### 6. Wildcard Image Domain Configuration

**File:** `next.config.ts`

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',  // Allows ANY hostname
    },
  ],
},
```

**Issue:** The application allows loading images from any HTTPS domain. This opens up:
- Server-Side Request Forgery (SSRF) potential
- Abuse of the image optimization API
- Loading of malicious/inappropriate content

**Impact:** Attackers could use the app as a proxy to fetch arbitrary URLs or load objectionable content.

**Remediation:** Restrict to known trusted domains:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'books.google.com',
    },
    {
      protocol: 'https',
      hostname: 'i.scdn.co', // Spotify CDN
    },
    {
      protocol: 'https',
      hostname: 'image.simplecastcdn.com', // Podcast images
    },
    // Add other specific domains as needed
  ],
},
```

---

### 7. No CSRF Protection on State-Changing Operations

**Files:** All API routes that accept POST/PATCH/DELETE

**Issue:** While the session uses `sameSite: 'lax'` cookies (which provides some CSRF protection), there's no explicit CSRF token validation for state-changing operations.

**Impact:** In certain scenarios (e.g., with older browsers or specific attack vectors), CSRF attacks may be possible.

**Remediation:**
- Consider implementing double-submit cookie pattern
- Or use `sameSite: 'strict'` for session cookies (may affect UX with external links)
- Add CSRF tokens to forms and validate in API routes

---

## 🟡 Medium Severity Findings

### 8. User Enumeration via Signup

**File:** `app/api/auth/signup/route.ts`

```typescript
const existingUsername = await getUserByUsername(normalizedUsername);
if (existingUsername) {
  return NextResponse.json(
    { success: false, error: 'Username already taken' },
    { status: 409 }
  );
}

const existingEmail = await getUserByEmail(normalizedEmail);
if (existingEmail) {
  return NextResponse.json(
    { success: false, error: 'Email already registered' },
    { status: 409 }
  );
}
```

**Issue:** Different error messages reveal whether a username or email already exists, allowing attackers to enumerate valid usernames/emails.

**Impact:** Attackers can build lists of valid users for targeted attacks.

**Remediation:** Return a generic message:
```typescript
// Check both and return generic message
if (existingUsername || existingEmail) {
  return NextResponse.json(
    { success: false, error: 'Account creation failed. Please try different credentials.' },
    { status: 409 }
  );
}
```

---

### 9. Share Tokens Are Not Access-Controlled

**File:** `app/api/shelf/share/[shareToken]/route.ts`

**Issue:** Share tokens provide permanent, revocable-only-by-deletion access to shelf data. There's no:
- Token expiration
- Access logging/auditing  
- Ability to regenerate tokens without deleting the shelf

**Impact:** Once a share link is exposed, it provides permanent access until the shelf is deleted.

**Remediation:**
- Add `share_token_created_at` column to track token age
- Implement token regeneration endpoint
- Consider adding optional expiration
- Log share token access for auditing

---

### 10. Verbose Error Messages in Production

**Files:** Multiple API routes

```typescript
} catch (error) {
  console.error('Error during login:', error);
  return NextResponse.json(
    { success: false, error: 'Login failed' },
    { status: 500 }
  );
}
```

**Issue:** While user-facing errors are generic, the `console.error` logs the full error stack which may contain sensitive information in production logs.

**Remediation:**
- Log only necessary details
- Use structured logging with severity levels
- Implement error tracking service (Sentry) with PII scrubbing

---

### 11. No Input Sanitization for Rich Text Fields

**Files:** 
- `app/api/items/route.ts` (notes field)
- `app/api/shelf/[shelfId]/route.ts` (description field)

**Issue:** While React escapes output by default, the `notes` and `description` fields accept free-text input without sanitization. If these fields are ever rendered in a non-React context (emails, OG images, exports), XSS could occur.

**Impact:** Potential XSS if content rendering changes in the future.

**Remediation:**
- Sanitize input on the way in (strip HTML tags)
- Or ensure all rendering contexts properly escape output

```typescript
import { stripHtml } from 'string-strip-html';

// In validation
if (notes) {
  const sanitized = stripHtml(notes).result;
  // Store sanitized version
}
```

---

### 12. Session Does Not Invalidate on Password Change

**Issue:** There's no mechanism to invalidate existing sessions when a user changes their password. If an attacker has obtained a valid session, changing the password won't revoke their access.

**Remediation:**
- Add a `password_changed_at` field to users table
- Include this timestamp in JWT
- Validate during session verification that token was issued after last password change

---

### 13. No Account Lockout Mechanism

**Issue:** Failed login attempts are not tracked, so there's no automatic account lockout after multiple failures.

**Impact:** Brute force attacks can continue indefinitely.

**Remediation:**
- Track failed attempts per account (not just per IP)
- Implement temporary lockout after N failures
- Require CAPTCHA or 2FA after suspicious activity

---

## 🔵 Low Severity Findings

### 14. Missing Request Size Limits

**Issue:** API routes don't explicitly limit request body sizes, relying on platform defaults.

**Remediation:** Add size limits in routes:
```typescript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

---

### 15. Console Logging in Client Components

**Files:** Multiple client components

```typescript
} catch (error) {
  console.error('Error fetching shelf:', error);
}
```

**Issue:** Error details logged to browser console could expose implementation details.

**Remediation:** Use error boundaries and proper error handling in production.

---

### 16. No Session Refresh Mechanism

**Issue:** Sessions are valid for 7 days with no sliding window or refresh. Long-lived sessions increase risk if compromised.

**Remediation:**
- Implement shorter session duration (1 day)
- Add refresh token rotation
- Or use sliding window that extends on activity

---

### 17. Google OAuth State Token Short Expiry

**File:** `app/api/auth/google/route.ts`

```typescript
maxAge: 60 * 10, // 10 minutes
```

**Issue:** While 10 minutes is reasonable, users on slow connections or who pause during OAuth might timeout.

**Remediation:** Consider increasing to 15-20 minutes, or implement better timeout UX.

---

## ℹ️ Informational Findings

### 18. No Two-Factor Authentication (2FA)

**Issue:** The application doesn't support 2FA/MFA, relying solely on password or Google OAuth.

**Recommendation:** Consider adding TOTP-based 2FA for enhanced security.

---

### 19. No Password Reset Functionality

**Issue:** If users forget their password (and didn't use Google OAuth), there's no recovery mechanism visible in the codebase.

**Recommendation:** Implement secure password reset via email with time-limited tokens.

---

### 20. Dependency Security

**Issue:** No automated dependency vulnerability scanning is configured.

**Recommendation:**
- Enable Dependabot or Snyk
- Run `npm audit` in CI/CD pipeline
- Regularly update dependencies

---

## Compliance Considerations

### GDPR / Data Privacy

- **Data Retention:** No automatic data deletion policy
- **Right to Deletion:** No user data export or account deletion feature visible
- **Privacy Policy:** Not included in audit scope, but should document data handling

### OWASP Top 10 Coverage

| Category | Status |
|----------|--------|
| A01:2021 - Broken Access Control | ⚠️ Partially covered |
| A02:2021 - Cryptographic Failures | ✅ Good (bcrypt, JWT) |
| A03:2021 - Injection | ✅ Good (parameterized queries) |
| A04:2021 - Insecure Design | ⚠️ Missing rate limiting |
| A05:2021 - Security Misconfiguration | ❌ Missing headers |
| A06:2021 - Vulnerable Components | ⚠️ No scanning |
| A07:2021 - Auth Failures | ⚠️ Weak password policy |
| A08:2021 - Data Integrity Failures | ✅ CSRF protection (partial) |
| A09:2021 - Security Logging | ❌ Excessive/insecure logging |
| A10:2021 - SSRF | ⚠️ Image wildcard allows SSRF |

---

## Recommended Priority Order

1. **Immediate (This Week):**
   - Fix hardcoded secret key fallback
   - Remove sensitive data from logs
   - Implement rate limiting on auth endpoints

2. **Short-term (This Month):**
   - Add security headers (middleware)
   - Restrict image domains
   - Improve password complexity requirements
   - Fix user enumeration

3. **Medium-term (Next Quarter):**
   - Implement account lockout
   - Add session invalidation on password change
   - Implement 2FA
   - Add password reset functionality

4. **Ongoing:**
   - Set up dependency vulnerability scanning
   - Regular security reviews
   - Penetration testing before major releases

---

## Appendix: Positive Security Findings

The application does several things well:

✅ **Parameterized SQL Queries:** Using Neon's tagged template literals prevents SQL injection  
✅ **Secure Password Hashing:** bcrypt with 10 salt rounds  
✅ **JWT Implementation:** Using `jose` library with proper signing  
✅ **HTTP-Only Cookies:** Session cookies aren't accessible via JavaScript  
✅ **SameSite Cookies:** Provides baseline CSRF protection  
✅ **Authorization Checks:** All state-changing operations verify ownership  
✅ **Input Validation:** Core validation utilities exist and are used  
✅ **HTTPS Enforcement:** Via Vercel's default configuration  
✅ **No `dangerouslySetInnerHTML`:** React's default escaping is used throughout

---

*This audit was performed on the codebase as of December 1, 2025. Security is an ongoing process, and regular re-audits are recommended.*
