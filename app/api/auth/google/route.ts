import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Google OAuth initiation route
 * Redirects user to Google OAuth consent screen
 */
export async function GET(request: Request) {
  try {
    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Generate PKCE code verifier (optional but recommended)
    // Not used in server flow, but kept for future enhancement
    const codeVerifier = crypto.randomBytes(32).toString('base64url');

    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.append('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'openid email profile');
    googleAuthUrl.searchParams.append('state', state);
    googleAuthUrl.searchParams.append('prompt', 'consent'); // Force consent screen

    // Create response with redirect
    const response = NextResponse.redirect(googleAuthUrl.toString());

    // Set state in secure httpOnly cookie (short-lived)
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Optional: Store code verifier for PKCE (if implementing)
    response.cookies.set('code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
