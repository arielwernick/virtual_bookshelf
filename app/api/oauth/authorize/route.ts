import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import {
  createOAuthAuthorizationCode,
  getOAuthClientByClientId,
} from '@/lib/db/queries';
import {
  AUTHORIZATION_CODE_TTL_MS,
  OAUTH_SCOPE,
  generateOpaqueToken,
  hashToken,
} from '@/lib/utils/oauth';
import { createLogger } from '@/lib/utils/logger';
import { AUTH_ERRORS } from '@/lib/constants/errors';

const logger = createLogger('OAuthAuthorize');

/**
 * Consent form target: issues an authorization code and redirects back to
 * the client. Only reachable via the /oauth/authorize consent page — the
 * session cookie is SameSite=Lax, so a cross-site form POST carries no
 * session and fails the auth check below.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: AUTH_ERRORS.NOT_AUTHENTICATED },
        { status: 401 }
      );
    }

    const form = await request.formData();
    const clientId = String(form.get('client_id') || '');
    const redirectUri = String(form.get('redirect_uri') || '');
    const codeChallenge = String(form.get('code_challenge') || '');
    const state = form.get('state');

    if (!clientId || !redirectUri || !codeChallenge) {
      return NextResponse.json(
        { success: false, error: 'Missing required authorization parameters' },
        { status: 400 }
      );
    }

    const client = await getOAuthClientByClientId(clientId);
    if (!client || !client.redirect_uris.includes(redirectUri)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client or redirect URI' },
        { status: 400 }
      );
    }

    const code = generateOpaqueToken();
    await createOAuthAuthorizationCode({
      codeHash: await hashToken(code),
      clientId,
      userId: session.userId,
      redirectUri,
      codeChallenge,
      scope: OAUTH_SCOPE,
      expiresAt: new Date(Date.now() + AUTHORIZATION_CODE_TTL_MS),
    });

    logger.info('Issued authorization code', { clientId, userId: session.userId });

    const target = new URL(redirectUri);
    target.searchParams.set('code', code);
    if (typeof state === 'string' && state) {
      target.searchParams.set('state', state);
    }

    return NextResponse.redirect(target, 303);
  } catch (error) {
    logger.errorWithException('Authorization failed', error);
    return NextResponse.json(
      { success: false, error: 'Authorization failed' },
      { status: 500 }
    );
  }
}
