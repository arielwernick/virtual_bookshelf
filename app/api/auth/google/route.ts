import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Google OAuth initiation route
 * Redirects user to Google OAuth consent screen
 */
export async function GET() {
  try {
    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Determine if we're in production (HTTPS)
    const isProduction = process.env.NODE_ENV === 'production';

    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.append('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'openid email profile');
    googleAuthUrl.searchParams.append('state', state);
    googleAuthUrl.searchParams.append('access_type', 'offline');
    // Don't force consent every time - only on first auth
    // googleAuthUrl.searchParams.append('prompt', 'consent');

    console.log('OAuth flow initiated:', {
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      state: state.substring(0, 8) + '...',
      isProduction,
    });

    // Create response with redirect
    const response = NextResponse.redirect(googleAuthUrl.toString());

    // Set state in httpOnly cookie
    // Key fix: Use 'none' for sameSite in production with secure: true
    // This allows the cookie to be sent on cross-site redirects from Google
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // 'lax' works for top-level navigations (redirects)
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
    
    console.log('State cookie set:', { state: state.substring(0, 8) + '...' });

    return response;
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
