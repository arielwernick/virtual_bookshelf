# TASK-005: Add Security Headers Middleware

**Priority:** 🟠 High  
**Estimated Effort:** 1 hour  
**Security Impact:** XSS, clickjacking, and data leak prevention

---

## Context

The application is missing essential HTTP security headers:
- No Content Security Policy (CSP) - vulnerable to XSS
- No X-Frame-Options - vulnerable to clickjacking
- No X-Content-Type-Options - vulnerable to MIME sniffing
- No Referrer-Policy - may leak sensitive URLs
- No Strict-Transport-Security - no HSTS enforcement

---

## Requirements

1. Create Next.js middleware to add security headers
2. Configure Content-Security-Policy appropriate for the app
3. Prevent clickjacking with X-Frame-Options
4. Add HSTS for production environments
5. Ensure headers don't break existing functionality
6. Special handling for embed routes (need to be frameable)

---

## Implementation Guide

### Step 1: Create Middleware

Create `middleware.ts` in the project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check if this is an embed route (should be frameable)
  const isEmbedRoute = request.nextUrl.pathname.startsWith('/embed/');
  
  // Content Security Policy
  // Note: 'unsafe-inline' and 'unsafe-eval' are needed for Next.js
  // In production, consider using nonces for stricter CSP
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://openidconnect.googleapis.com https://www.googleapis.com https://api.spotify.com https://accounts.spotify.com",
    "frame-ancestors 'none'",  // Will be overridden for embed routes
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "upgrade-insecure-requests",
  ];
  
  // For embed routes, allow framing from any origin
  if (isEmbedRoute) {
    const cspWithFraming = cspDirectives.map(directive => 
      directive.startsWith('frame-ancestors') ? "frame-ancestors *" : directive
    );
    response.headers.set('Content-Security-Policy', cspWithFraming.join('; '));
    // Don't set X-Frame-Options for embeds - they need to be frameable
  } else {
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
    // Prevent clickjacking for non-embed pages
    response.headers.set('X-Frame-Options', 'DENY');
  }
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Legacy XSS protection (for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Disable browser features we don't need
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // HSTS - only in production with HTTPS
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Prevent DNS prefetching for privacy
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  
  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Step 2: Update Next.js Config (Optional Enhancement)

For additional security, update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // See TASK-006 for restricted domains
    ],
  },
  // Additional security options
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Strict mode for React
  reactStrictMode: true,
};

export default nextConfig;
```

### Step 3: Test CSP Doesn't Break Functionality

Create a simple test page or use browser dev tools:

```typescript
// Optional: Create app/api/test-csp/route.ts for testing
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'If you can see this, CSP allows API calls',
    timestamp: new Date().toISOString(),
  });
}
```

---

## Security Headers Reference

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | See above | Controls allowed content sources |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer info |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |
| `Permissions-Policy` | Disabled features | Restricts browser APIs |
| `Strict-Transport-Security` | `max-age=31536000` | Forces HTTPS |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `middleware.ts` | Create - Security headers middleware |
| `next.config.ts` | Modify - Remove powered-by header |

---

## Acceptance Criteria

- [ ] All security headers are present on responses
- [ ] CSP doesn't break: Google OAuth, Spotify API, image loading
- [ ] Embed routes (`/embed/*`) can be loaded in iframes
- [ ] Non-embed routes are protected from framing
- [ ] HSTS only applied in production
- [ ] Application functionality is not affected
- [ ] Build succeeds

---

## Testing Instructions

### Manual Testing

1. Start dev server: `npm run dev`
2. Open browser DevTools → Network tab
3. Load any page and inspect response headers
4. Verify all security headers are present:

```bash
# Using curl to check headers
curl -I http://localhost:3000/
```

Expected headers:
```
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Permissions-Policy: camera=(), microphone=(), ...
```

### Test Embed Route

```bash
curl -I http://localhost:3000/embed/some-token
```

Should NOT have `X-Frame-Options: DENY` and should have `frame-ancestors *` in CSP.

### Functionality Testing

1. Sign up/login with email/password
2. Sign in with Google OAuth
3. Search for books (Google Books API)
4. Search for music/podcasts (Spotify API)
5. View images on shelves
6. Share a shelf via link
7. Test embed in an iframe

---

## Common CSP Issues and Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Inline scripts blocked | JS doesn't execute | Add `'unsafe-inline'` or use nonces |
| External API blocked | Fetch fails | Add domain to `connect-src` |
| Images not loading | Broken images | Add domain to `img-src` |
| Fonts not loading | Fallback fonts | Add source to `font-src` |
| OAuth redirect fails | Login doesn't work | Add to `form-action` |

### Debugging CSP

Check browser console for CSP violations:
```
Refused to load the script 'https://example.com/script.js' because it violates 
the following Content Security Policy directive: "script-src 'self'"
```

---

## Rollback Plan

If issues arise:
1. Comment out specific headers causing problems
2. Or delete `middleware.ts` entirely
3. Investigate which directive is too restrictive

---

## References

- Original audit finding: `docs/SECURITY_AUDIT.md` - Finding #5
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
