import { NextResponse } from 'next/server';
import { metadataCorsOptionsRequestHandler } from 'mcp-handler';
import {
  consumeOAuthAuthorizationCode,
  createOAuthAccessToken,
} from '@/lib/db/queries';
import {
  ACCESS_TOKEN_TTL_MS,
  generateOpaqueToken,
  hashToken,
  verifyPkceS256,
} from '@/lib/utils/oauth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('OAuthToken');

const RESPONSE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
};

function tokenError(error: string, description: string, status = 400) {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: RESPONSE_HEADERS }
  );
}

/**
 * OAuth 2.1 token endpoint: exchanges an authorization code + PKCE verifier
 * for an opaque bearer access token (RFC 6749 §4.1.3, RFC 7636).
 * Accepts application/x-www-form-urlencoded per spec (JSON tolerated).
 */
export async function POST(request: Request) {
  try {
    let params: Record<string, string>;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      params = (await request.json()) as Record<string, string>;
    } else {
      const form = await request.formData();
      params = Object.fromEntries(
        [...form.entries()].map(([k, v]) => [k, String(v)])
      );
    }

    const { grant_type, code, redirect_uri, client_id, code_verifier } = params;

    if (grant_type !== 'authorization_code') {
      return tokenError('unsupported_grant_type', 'Only authorization_code is supported');
    }
    if (!code || !client_id || !redirect_uri || !code_verifier) {
      return tokenError(
        'invalid_request',
        'code, client_id, redirect_uri and code_verifier are required'
      );
    }

    // Codes are single-use: consume atomically before any further checks.
    const codeHash = await hashToken(code);
    const codeRecord = await consumeOAuthAuthorizationCode(codeHash);

    if (!codeRecord) {
      return tokenError('invalid_grant', 'Authorization code is invalid or already used');
    }
    if (new Date(codeRecord.expires_at).getTime() < Date.now()) {
      return tokenError('invalid_grant', 'Authorization code has expired');
    }
    if (codeRecord.client_id !== client_id) {
      return tokenError('invalid_grant', 'client_id does not match authorization code');
    }
    if (codeRecord.redirect_uri !== redirect_uri) {
      return tokenError('invalid_grant', 'redirect_uri does not match authorization request');
    }
    if (!(await verifyPkceS256(code_verifier, codeRecord.code_challenge))) {
      return tokenError('invalid_grant', 'PKCE verification failed');
    }

    const accessToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
    await createOAuthAccessToken({
      tokenHash: await hashToken(accessToken),
      clientId: client_id,
      userId: codeRecord.user_id,
      scope: codeRecord.scope,
      expiresAt,
    });

    logger.info('Issued access token', { clientId: client_id, userId: codeRecord.user_id });

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
        scope: codeRecord.scope,
      },
      { headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    logger.errorWithException('Token exchange failed', error);
    return tokenError('server_error', 'Token exchange failed', 500);
  }
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
