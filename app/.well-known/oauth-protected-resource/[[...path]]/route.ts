import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { getOAuthIssuer } from '@/lib/utils/oauth';

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728).
 * Optional catch-all so both `/.well-known/oauth-protected-resource` and the
 * path-suffixed variant clients derive from the MCP URL
 * (`/.well-known/oauth-protected-resource/api/mcp/mcp`) resolve.
 */
export const GET = protectedResourceHandler({
  authServerUrls: [getOAuthIssuer()],
  resourceUrl: `${getOAuthIssuer()}/api/mcp/mcp`,
});

export const OPTIONS = metadataCorsOptionsRequestHandler();
