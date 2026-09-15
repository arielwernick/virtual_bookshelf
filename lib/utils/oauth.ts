/**
 * OAuth 2.1 primitives for the MCP connector authorization server.
 *
 * Tokens and authorization codes are opaque random strings. Only their
 * SHA-256 hashes are persisted, so a database read cannot recover a usable
 * credential. PKCE (S256 only) is required on every authorization request.
 */

const TOKEN_BYTES = 32;

export const OAUTH_SCOPE = 'shelves:read shelves:write';
export const AUTHORIZATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getOAuthIssuer(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate an opaque credential (access token or authorization code).
 * 32 random bytes, base64url — 256 bits of entropy.
 */
export function generateOpaqueToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/**
 * SHA-256 hash of a credential, base64url-encoded, for storage and lookup.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  );
  return toBase64Url(new Uint8Array(digest));
}

/**
 * Verify a PKCE S256 code_verifier against the stored code_challenge:
 * base64url(sha256(verifier)) must equal the challenge (RFC 7636).
 */
export async function verifyPkceS256(
  codeVerifier: string,
  codeChallenge: string
): Promise<boolean> {
  if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
    return false;
  }
  const computed = await hashToken(codeVerifier);
  return computed === codeChallenge;
}

/**
 * Redirect URIs must be HTTPS, except loopback addresses (RFC 8252 §7.3),
 * which local MCP clients like Claude Code use for the callback.
 */
export function isAllowedRedirectUri(uri: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return false;
  }
  if (parsed.protocol === 'https:') {
    return true;
  }
  if (parsed.protocol === 'http:') {
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  }
  return false;
}
