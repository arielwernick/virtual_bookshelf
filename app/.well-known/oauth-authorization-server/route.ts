import { NextResponse } from 'next/server';
import { metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { getOAuthIssuer } from '@/lib/utils/oauth';

/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414).
 * MCP clients (claude.ai connectors, Claude Code) discover our OAuth
 * endpoints here before starting the authorization flow.
 */
export function GET() {
  const issuer = getOAuthIssuer();

  return NextResponse.json(
    {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/api/oauth/token`,
      registration_endpoint: `${issuer}/api/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ['shelves:read', 'shelves:write'],
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
