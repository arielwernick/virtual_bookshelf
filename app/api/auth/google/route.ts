import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { 
  getOAuthRateLimiter, 
  getClientIP, 
  checkRateLimit, 
  isRateLimitingEnabled 
} from '@/lib/utils/rateLimit';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Google OAuth initiation route
 * Redirects user to Google OAuth consent screen
 */
export async function GET(request: Request) {
  try {
    // Rate limiting check
    if (isRateLimitingEnabled()) {
      const ip = getClientIP(request);
      const rateLimitResult = await checkRateLimit(getOAuthRateLimiter(), ip);
      if (!rateLimitResult.success) {
        return rateLimitResult.response;
      }
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

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

    // Create response with redirect
    const response = NextResponse.redirect(googleAuthUrl.toString());

    // Set state in httpOnly cookie
    // 'lax' works for top-level navigations (redirects)
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
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
