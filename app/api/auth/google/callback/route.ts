import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUserGoogleId,
} from '@/lib/db/queries';
import { setSessionCookie } from '@/lib/utils/session';

/**
 * Google OAuth callback handler
 * Exchanges authorization code for user data and creates session
 */
export async function GET(request: Request) {
  try {
    console.log('\n=== Google OAuth Callback ===');
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Full URL:', url.toString());
    console.log('All search params:', Array.from(url.searchParams.entries()));
    console.log('Callback params:', {
      code: code ? code.substring(0, 10) + '...' : 'MISSING',
      state: state ? state.substring(0, 8) + '...' : 'MISSING',
      error: error,
      errorDescription: errorDescription,
    });

    // If Google returned an error
    if (error) {
      console.error('Google OAuth error:', error, errorDescription);
      return NextResponse.json(
        { success: false, error: `Google error: ${error}` },
        { status: 400 }
      );
    }

    // Validate parameters
    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    // Verify state token (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    const allCookies = cookieStore.getAll();
    
    console.log('Cookie verification:', {
      incomingState: state.substring(0, 8) + '...',
      storedState: storedState ? storedState.substring(0, 8) + '...' : 'NOT_FOUND',
      match: state === storedState,
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      rawCookieHeader: request.headers.get('cookie')?.substring(0, 100) || 'NO_COOKIE_HEADER',
    });
    
    if (state !== storedState) {
      console.error('STATE MISMATCH - CSRF token validation failed');
      return NextResponse.json(
        { success: false, error: 'Invalid state token' },
        { status: 403 }
      );
    }
    
    console.log('✓ State token verified');

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
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.json(
        { success: false, error: 'Failed to exchange token' },
        { status: 500 }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user info from Google
    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error('User info fetch failed:', await userInfoResponse.text());
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

    // Check if user exists
    let user = await getUserByEmail(email);
    console.log('Email lookup result:', { email, userFound: !!user });

    if (!user) {
      // Create new user
      // Generate username from email (before @ sign, lowercase)
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
      let username = baseUsername;
      let counter = 1;

      // Check for username uniqueness (in case of collision)
      while (await getUserByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      console.log('Creating new user:', { email, username });
      user = await createUser({
        email,
        username,
        googleId,
        name,
      });
      console.log('User created:', { userId: user.id, email: user.email });
    } else if (!user.google_id) {
      // Update existing user with google_id if not already linked
      // This allows linking Google to existing accounts
      console.log('Linking Google ID to existing user:', { userId: user.id });
      user = await updateUserGoogleId(user.id, googleId);
    } else {
      console.log('User already has Google ID linked:', { userId: user.id });
    }

    // Set session cookie
    await setSessionCookie({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Clear CSRF state cookie and redirect
    const dashboardUrl = new URL('/dashboard', request.url);
    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('Error during Google OAuth callback:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
