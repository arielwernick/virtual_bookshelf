# Content Security Policy (CSP) Documentation

## Overview

This document explains the Content Security Policy (CSP) headers implemented in Virtual Bookshelf to mitigate cross-site scripting (XSS) and injection attacks.

**Implemented:** January 2026  
**Configuration Location:** `next.config.ts`  
**Security Audit Reference:** Finding #5 in `docs/SECURITY_AUDIT.md`

## What is CSP?

Content Security Policy is a security header that helps prevent XSS attacks by controlling which resources the browser is allowed to load. It acts as an allowlist for sources of content such as scripts, styles, images, fonts, and other resources.

## Implementation Approach

### Two-Tier Policy

We implement CSP using Next.js's `headers()` configuration in `next.config.ts` with two separate policies:

1. **Main Application Policy** (`/:path*`) - Stricter policy for the main application
2. **Embed Route Policy** (`/embed/:path*`) - Modified policy to allow embedding in iframes

### Why Next.js Config vs Middleware?

We chose to implement CSP in `next.config.ts` rather than middleware because:
- **Performance**: Headers are set at the CDN/edge level, reducing runtime overhead
- **Static Configuration**: CSP directives are stable and don't require dynamic logic
- **Simplicity**: Easier to maintain and understand
- **Build-time Validation**: Configuration errors are caught during build

Consider using middleware if you need:
- Dynamic CSP based on user authentication state
- Nonce-based CSP (requires generating unique nonces per request)
- CSP reporting endpoints

## CSP Directives Explained

### Main Application Policy

#### `default-src 'self'`
**Purpose:** Sets the default policy for all resource types  
**Value:** Only allow resources from the same origin  
**Why:** Provides a secure baseline; all other directives override this for specific resource types

#### `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com`
**Purpose:** Controls which JavaScript can execute  
**Allowed Sources:**
- `'self'` - First-party scripts from our domain
- `'unsafe-eval'` - Required by Next.js for hot module replacement (HMR) in development and some runtime features
- `'unsafe-inline'` - Required for inline event handlers and some Next.js functionality
- `https://va.vercel-scripts.com` - Vercel Analytics tracking scripts

**Security Trade-offs:**
- `'unsafe-eval'` and `'unsafe-inline'` reduce XSS protection
- Future improvement: Use nonces or hashes for inline scripts
- Consider removing `'unsafe-inline'` by refactoring inline event handlers

**Files Affected:**
- All Next.js client components
- Vercel Analytics (`app/layout.tsx`)

#### `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
**Purpose:** Controls CSS sources  
**Allowed Sources:**
- `'self'` - First-party stylesheets
- `'unsafe-inline'` - Required for Tailwind CSS utility classes and inline styles
- `https://fonts.googleapis.com` - Google Fonts CSS

**Why Inline Styles:**
- Tailwind CSS generates utility classes dynamically
- Confetti component uses inline `<style>` tag (`components/Confetti.tsx`)
- OG image generation uses inline styles (`app/api/og/*`)

**Files Affected:**
- `components/Confetti.tsx` - Uses inline `<style>` for keyframe animation
- `app/globals.css` - Tailwind directives
- All components using Tailwind utilities

#### `img-src 'self' data: https: blob:`
**Purpose:** Controls image sources  
**Allowed Sources:**
- `'self'` - Images from our domain
- `data:` - Data URIs (base64 encoded images)
- `https:` - Any HTTPS image (wildcard)
- `blob:` - Blob URLs (for client-side image generation)

**Security Consideration:**
- `https:` wildcard is permissive (allows any HTTPS image)
- Matches current `next.config.ts` image configuration (`hostname: '**'`)
- See Security Audit Finding #6 for recommendations to restrict this

**Why Permissive:**
- User-generated content: Users can add items with images from various sources
- Book covers: Google Books API
- Podcast artwork: Various podcast hosting services
- Music album art: Various sources

**Future Improvement:**
Consider restricting to known domains:
```typescript
img-src 'self' data: blob:
  https://books.google.com
  https://i.scdn.co
  https://images-na.ssl-images-amazon.com
  [other specific CDNs]
```

#### `font-src 'self' https://fonts.gstatic.com data:`
**Purpose:** Controls font sources  
**Allowed Sources:**
- `'self'` - Fonts hosted on our domain
- `https://fonts.gstatic.com` - Google Fonts CDN
- `data:` - Data URI fonts (for some icon fonts)

**Files Affected:**
- `app/layout.tsx` - Loads Geist and Geist Mono fonts from Google Fonts via `next/font/google`

#### `connect-src 'self' https://vitals.vercel-insights.com https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com`
**Purpose:** Controls AJAX/fetch/WebSocket connections  
**Allowed Sources:**
- `'self'` - API routes on our domain
- `https://vitals.vercel-insights.com` - Vercel Analytics endpoint
- `https://accounts.google.com` - Google OAuth
- `https://www.googleapis.com` - Google APIs (OAuth token exchange)
- `https://oauth2.googleapis.com` - Google OAuth token endpoints

**Files Affected:**
- All API client calls (`lib/api/*`)
- Google OAuth flow (`app/api/auth/google/*`)
- Vercel Analytics (`@vercel/analytics`)

#### `frame-src 'self' https://www.youtube.com`
**Purpose:** Controls iframe sources  
**Allowed Sources:**
- `'self'` - Iframes from our domain
- `https://www.youtube.com` - YouTube video embeds

**Files Affected:**
- `components/shelf/ItemModal.tsx` - Embeds YouTube videos for video items

#### `form-action 'self' https://accounts.google.com`
**Purpose:** Controls form submission targets  
**Allowed Sources:**
- `'self'` - Forms can only submit to our domain
- `https://accounts.google.com` - Google OAuth login form

**Why:** Prevents forms from being hijacked to submit to malicious sites

#### `base-uri 'self'`
**Purpose:** Restricts the URLs that can be used in `<base>` element  
**Value:** Only allow same-origin base tags  
**Why:** Prevents attackers from injecting `<base>` tags that could redirect relative URLs

#### `object-src 'none'`
**Purpose:** Blocks `<object>`, `<embed>`, and `<applet>` elements  
**Value:** No plugins allowed  
**Why:** Flash and other plugins are security risks; modern web apps don't need them

#### `upgrade-insecure-requests` (Production Only)
**Purpose:** Automatically upgrade HTTP requests to HTTPS  
**When:** Only in production (`process.env.NODE_ENV === 'production'`)  
**Why:** Ensures all resources are loaded securely; not needed in local development

### Embed Route Policy (`/embed/:path*`)

The embed routes have a modified policy to allow the shelf to be embedded in external websites:

**Key Differences:**
- `X-Frame-Options: ALLOWALL` instead of `SAMEORIGIN`
- Removed Google OAuth from `connect-src` (not needed in embed context)
- Same CSP directives otherwise

**Files Affected:**
- `app/embed/[shareToken]/page.tsx`

## Other Security Headers

In addition to CSP, we implement several other security headers:

### `X-Frame-Options`
**Value:** `SAMEORIGIN` (main app) or `ALLOWALL` (embeds)  
**Purpose:** Prevents clickjacking by controlling iframe embedding  
**Why:**
- Main app: `SAMEORIGIN` allows embedding only on our own domain
- Embed routes: `ALLOWALL` is intentional to allow third-party embedding

### `X-Content-Type-Options`
**Value:** `nosniff`  
**Purpose:** Prevents MIME type sniffing  
**Why:** Stops browsers from interpreting files as a different MIME type than declared (e.g., serving an image but executing it as JavaScript)

### `Referrer-Policy`
**Value:** `strict-origin-when-cross-origin`  
**Purpose:** Controls what referrer information is sent with requests  
**Behavior:**
- Same-origin: Send full URL
- Cross-origin HTTPS→HTTPS: Send origin only
- Cross-origin HTTPS→HTTP: Send nothing
**Why:** Balances privacy with functionality (analytics still work)

### `X-XSS-Protection`
**Value:** `1; mode=block`  
**Purpose:** Enables browser's built-in XSS filter  
**Note:** This header is legacy (deprecated in modern browsers) but included for compatibility with older browsers

### `Permissions-Policy`
**Value:** `camera=(), microphone=(), geolocation=(), interest-cohort=()`  
**Purpose:** Disables browser features we don't use  
**Disabled Features:**
- Camera access
- Microphone access
- Geolocation
- FLoC (Google's tracking mechanism)
**Why:** Reduces attack surface and improves privacy

### HSTS (Not Implemented)
**Note:** `Strict-Transport-Security` is not implemented in our config because:
- Vercel automatically handles HSTS for custom domains
- Adding it in Next.js config can cause conflicts
- If self-hosting, add:
  ```typescript
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }
  ```

## Testing CSP

### Browser DevTools

1. Open browser DevTools (F12)
2. Go to the Console tab
3. Look for CSP violation warnings in red
4. Example violation:
   ```
   Refused to load the script 'https://evil.com/script.js' because it violates the following Content Security Policy directive: "script-src 'self'"
   ```

### Report-Only Mode (For Testing)

To test CSP without blocking resources, temporarily change the header name:

```typescript
{
  key: 'Content-Security-Policy-Report-Only',  // Note: -Report-Only suffix
  value: '...'
}
```

This will log violations without blocking resources. Useful for:
- Testing new CSP directives
- Finding violations in production
- Gradual rollout

### CSP Validation Tools

- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/
  - Paste your CSP and get security analysis
  - Identifies potential bypasses
  
- **Report URI CSP Builder**: https://report-uri.com/home/generate
  - Interactive CSP builder
  - Generates policies with explanations

### Manual Testing Checklist

After deploying CSP changes, verify:

- [ ] Homepage loads correctly
- [ ] Images display (book covers, podcast art)
- [ ] Google Fonts load
- [ ] Vercel Analytics works (check Network tab)
- [ ] Login/signup forms work
- [ ] Google OAuth flow works
- [ ] YouTube videos embed and play
- [ ] Confetti animation works
- [ ] No CSP errors in console
- [ ] Embed routes work in iframes

## CSP Reporting (Future Enhancement)

Consider implementing CSP reporting to monitor violations in production:

```typescript
{
  key: 'Content-Security-Policy',
  value: '... ; report-uri https://yourdomain.com/api/csp-report'
}
```

Then create an API route to log violations:
```typescript
// app/api/csp-report/route.ts
export async function POST(request: Request) {
  const report = await request.json();
  console.error('CSP Violation:', report);
  // Optionally send to error tracking service (Sentry, etc.)
  return new Response('OK', { status: 200 });
}
```

## Common Issues and Solutions

### Issue: Inline styles/scripts blocked
**Symptom:** Components render unstyled or JavaScript doesn't execute  
**Solution:**
1. Use `'unsafe-inline'` (less secure, current approach)
2. Generate nonces per request (more secure, requires middleware)
3. Hash inline content and add to CSP (static content only)

### Issue: Third-party resource blocked
**Symptom:** Images, fonts, or scripts from CDN don't load  
**Solution:** Add the domain to the appropriate directive:
```typescript
"script-src 'self' https://trusted-cdn.com"
```

### Issue: Google OAuth breaks
**Symptom:** OAuth redirects fail or API calls blocked  
**Solution:** Ensure these domains are in `connect-src`:
- `https://accounts.google.com`
- `https://www.googleapis.com`
- `https://oauth2.googleapis.com`

### Issue: Vercel Analytics not tracking
**Symptom:** No analytics data in Vercel dashboard  
**Solution:** Add to CSP:
```typescript
"script-src 'self' https://va.vercel-scripts.com"
"connect-src 'self' https://vitals.vercel-insights.com"
```

### Issue: Development hot reload breaks
**Symptom:** Changes don't reflect, HMR errors in console  
**Solution:** Include `'unsafe-eval'` in development:
```typescript
"script-src 'self' 'unsafe-eval' ..."
```

## Security Improvements Roadmap

### Short-term
- [ ] Monitor CSP violations in production
- [ ] Remove `'unsafe-inline'` from script-src by refactoring inline event handlers
- [ ] Implement nonce-based CSP for scripts

### Medium-term
- [ ] Restrict `img-src` to specific CDNs (see Security Audit Finding #6)
- [ ] Implement CSP reporting endpoint
- [ ] Add `script-src-elem` and `script-src-attr` for more granular control
- [ ] Consider using `strict-dynamic` for script loading

### Long-term
- [ ] Move to hash-based CSP for inline styles (remove `'unsafe-inline'`)
- [ ] Implement Subresource Integrity (SRI) for CDN resources
- [ ] Evaluate removing `'unsafe-eval'` with build-time code generation

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google Web Fundamentals: CSP](https://developers.google.com/web/fundamentals/security/csp)
- [OWASP: Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Next.js: Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/headers)
- Security Audit: `docs/SECURITY_AUDIT.md` (Finding #5)

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Initial CSP implementation | Security Team |

---

**Last Updated:** 2026-01-13  
**Document Owner:** Security Team  
**Review Frequency:** Quarterly or when adding new third-party services
