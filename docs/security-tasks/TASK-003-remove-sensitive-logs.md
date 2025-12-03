# TASK-003: Remove Sensitive Data from OAuth Logs

**Priority:** 🟠 High  
**Estimated Effort:** 30 minutes  
**Security Impact:** Prevent credential exposure in logs

---

## Context

The Google OAuth routes contain extensive debug logging that exposes sensitive information:

- Full URLs containing authorization codes
- OAuth state tokens
- User email addresses  
- Cookie headers
- Search parameters

This data in production logs could be accessed by:
- Anyone with log access (team members, support staff)
- Error monitoring services (Sentry, LogRocket)
- Log aggregation tools (CloudWatch, Datadog)

---

## Requirements

1. Remove all sensitive data from production logs
2. Keep useful debugging information for development
3. Use conditional logging based on environment
4. Never log: tokens, codes, emails, full URLs, cookie values

---

## Implementation Guide

### Step 1: Update `app/api/auth/google/route.ts`

Replace verbose logging with safe logging:

```typescript
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';

    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.append('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'openid email profile');
    googleAuthUrl.searchParams.append('state', state);
    googleAuthUrl.searchParams.append('access_type', 'offline');

    // SAFE: Only log non-sensitive info, and only in development
    if (!isProduction) {
      console.log('[OAuth] Initiating Google OAuth flow', {
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        timestamp: new Date().toISOString(),
      });
    }

    const response = NextResponse.redirect(googleAuthUrl.toString());

    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });

    return response;
  } catch (error) {
    // SAFE: Log error type, not full error which may contain sensitive data
    console.error('[OAuth] Failed to initiate OAuth flow:', 
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
```

### Step 2: Update `app/api/auth/google/callback/route.ts`

Replace the entire callback route logging:

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUserGoogleId,
} from '@/lib/db/queries';
import { setSessionCookie } from '@/lib/utils/session';

const isDev = process.env.NODE_ENV === 'development';

// Helper for safe logging
function safeLog(message: string, data?: Record<string, unknown>) {
  if (isDev) {
    console.log(`[OAuth Callback] ${message}`, data || '');
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Log only that callback was received, not the actual values
    safeLog('Callback received', { 
      hasCode: !!code, 
      hasState: !!state, 
      hasError: !!error 
    });

    if (error) {
      // SAFE: Error type is not sensitive
      console.error('[OAuth Callback] Google returned error:', error);
      return NextResponse.json(
        { success: false, error: `Authentication failed: ${error}` },
        { status: 400 }
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    // Verify state token
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    
    // SAFE: Only log whether match succeeded, not the actual values
    safeLog('State verification', { stateMatch: state === storedState });
    
    if (state !== storedState) {
      console.error('[OAuth Callback] State mismatch - possible CSRF attempt');
      return NextResponse.json(
        { success: false, error: 'Invalid state token' },
        { status: 403 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      console.error('[OAuth Callback] Token exchange failed');
      return NextResponse.json(
        { success: false, error: 'Failed to exchange token' },
        { status: 500 }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user info
    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[OAuth Callback] User info fetch failed');
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user info' },
        { status: 500 }
      );
    }

    const googleUser = await userInfoResponse.json();
    const { sub: googleId, email, name } = googleUser;

    if (!email || !googleId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user data from Google' },
        { status: 400 }
      );
    }

    // SAFE: Log action, not the actual email
    safeLog('Processing user', { isNewUser: false }); // Updated below

    let user = await getUserByEmail(email);

    if (!user) {
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
      let username = baseUsername;
      let counter = 1;

      while (await getUserByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      safeLog('Creating new user');
      user = await createUser({ email, username, googleId, name });
    } else if (!user.google_id) {
      safeLog('Linking Google account to existing user');
      user = await updateUserGoogleId(user.id, googleId);
    }

    await setSessionCookie({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const dashboardUrl = new URL('/dashboard', request.url);
    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.delete('oauth_state');

    // SAFE: Only log success, not user details
    safeLog('Authentication successful');

    return response;
  } catch (error) {
    console.error('[OAuth Callback] Authentication failed:', 
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `app/api/auth/google/route.ts` | Modify - Remove sensitive logging |
| `app/api/auth/google/callback/route.ts` | Modify - Remove sensitive logging |

---

## Acceptance Criteria

- [ ] No tokens, codes, or credentials are logged in any environment
- [ ] No email addresses are logged in production
- [ ] No full URLs are logged
- [ ] No cookie values are logged
- [ ] Development logging provides useful debug info without sensitive data
- [ ] Error messages are logged safely (error type, not full stack with data)
- [ ] OAuth flow still works correctly

---

## Testing Instructions

### Manual Testing

1. Enable browser console and network tab
2. Complete OAuth flow in development
3. Check server logs - verify no sensitive data appears
4. Set `NODE_ENV=production` and repeat
5. Verify production logs are minimal

### Log Verification Checklist

Search logs for these patterns (should NOT appear in production):
- [ ] `@` (email addresses)
- [ ] Long hex strings (tokens, state values)
- [ ] `code=` (authorization codes)
- [ ] `state=` (CSRF tokens)
- [ ] `Cookie:` (cookie headers)

---

## Rollback Plan

If debugging becomes too difficult:
1. Create a feature flag for verbose logging
2. Only enable in specific debugging scenarios
3. Ensure it's disabled by default

---

## References

- Original audit finding: `docs/SECURITY_AUDIT.md` - Finding #3
- OWASP: [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
