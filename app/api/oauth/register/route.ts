import { NextResponse } from 'next/server';
import { metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { createOAuthClient } from '@/lib/db/queries';
import { isAllowedRedirectUri } from '@/lib/utils/oauth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('OAuthRegister');

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

/**
 * Dynamic Client Registration (RFC 7591).
 * MCP clients self-register to obtain a client_id before the authorization
 * flow. Clients are public (no secret); PKCE secures the code exchange.
 * Request body: { redirect_uris: string[], client_name?: string }
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'invalid_client_metadata', error_description: 'Request body must be JSON' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { redirect_uris, client_name } = body as {
      redirect_uris?: unknown;
      client_name?: unknown;
    };

    if (
      !Array.isArray(redirect_uris) ||
      redirect_uris.length === 0 ||
      !redirect_uris.every((uri) => typeof uri === 'string')
    ) {
      return NextResponse.json(
        { error: 'invalid_redirect_uri', error_description: 'redirect_uris must be a non-empty array of strings' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const invalid = redirect_uris.find((uri) => !isAllowedRedirectUri(uri));
    if (invalid) {
      return NextResponse.json(
        { error: 'invalid_redirect_uri', error_description: `Redirect URI not allowed: ${invalid}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const name =
      typeof client_name === 'string' ? client_name.slice(0, 200) : '';
    const clientId = globalThis.crypto.randomUUID();

    const client = await createOAuthClient(clientId, name, redirect_uris);
    logger.info('Registered OAuth client', { clientId, clientName: name });

    return NextResponse.json(
      {
        client_id: client.client_id,
        client_name: client.client_name,
        redirect_uris: client.redirect_uris,
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code'],
        response_types: ['code'],
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    logger.errorWithException('Client registration failed', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
