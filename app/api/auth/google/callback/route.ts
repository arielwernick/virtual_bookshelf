import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUserGoogleId,
} from '@/lib/db/queries';
import { setSessionCookie } from '@/lib/utils/session';
import { createLogger } from '@/lib/utils/logger';
import {
  validationError,
  forbiddenError,
  externalServiceError,
} from '@/lib/utils/errors';

const logger = createLogger('OAuthCallback');

/**
 * Google OAuth callback handler
 * Exchanges authorization code for user data and creates session
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    logger.debug('Callback received', { 
      hasCode: !!code, 
      hasState: !!state, 
      hasError: !!error 
    });

    // If Google returned an error
    if (error) {
      logger.error('Google returned error', { error });
      return validationError(`Authentication failed: ${error}`);
    }

    // Validate parameters
    if (!code || !state) {
      return validationError('Missing authorization code or state');
    }

    // Verify state token (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    
    logger.debug('State verification', { stateMatch: state === storedState });
    
    if (state !== storedState) {
      logger.error('State mismatch - possible CSRF attempt');
      return forbiddenError('Invalid state token');
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
      logger.error('Token exchange failed');
      return externalServiceError('Google OAuth');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user info from Google
    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      logger.error('User info fetch failed');
      return externalServiceError('Google OAuth');
    }

    const googleUser = await userInfoResponse.json();
    const { sub: googleId, email, name } = googleUser;

    if (!email || !googleId) {
      return validationError('Invalid user data from Google');
    }

    // Check if user exists
    let user = await getUserByEmail(email);

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

      logger.debug('Creating new user');
      user = await createUser({
        email,
        username,
        googleId,
        name,
      });
    } else if (!user.google_id) {
      // Link Google to existing account
      logger.debug('Linking Google account to existing user');
      user = await updateUserGoogleId(user.id, googleId);
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

    logger.debug('Authentication successful');

    return response;
  } catch (error) {
    logger.errorWithException('Authentication failed', error);
    return externalServiceError('Google OAuth');
  }
}
