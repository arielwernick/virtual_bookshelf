/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { generateOpaqueToken, hashToken } from '@/lib/utils/oauth';
import type { OAuthAuthorizationCode, OAuthAccessToken } from '@/lib/types/shelf';

// Mock dependencies
vi.mock('@/lib/db/queries', () => ({
  consumeOAuthAuthorizationCode: vi.fn(),
  createOAuthAccessToken: vi.fn(),
}));

import {
  consumeOAuthAuthorizationCode,
  createOAuthAccessToken,
} from '@/lib/db/queries';

const CLIENT_ID = 'client-123';
const REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback';

function createMockCodeRecord(
  overrides: Partial<OAuthAuthorizationCode> = {}
): OAuthAuthorizationCode {
  return {
    id: 'code-row-1',
    code_hash: 'hash',
    client_id: CLIENT_ID,
    user_id: 'user-1',
    redirect_uri: REDIRECT_URI,
    code_challenge: 'challenge',
    scope: 'shelves:read shelves:write',
    expires_at: new Date(Date.now() + 60_000),
    created_at: new Date(),
    ...overrides,
  };
}

function createTokenRequest(params: Record<string, string>): Request {
  return new Request('http://localhost/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
}

function validParams(overrides: Record<string, string> = {}) {
  return {
    grant_type: 'authorization_code',
    code: 'the-code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: generateOpaqueToken(),
    ...overrides,
  };
}

describe('POST /api/oauth/token', () => {
  beforeEach(() => {
    vi.mocked(consumeOAuthAuthorizationCode).mockReset();
    vi.mocked(createOAuthAccessToken).mockReset();
  });

  describe('Validation', () => {
    it('rejects unsupported grant types', async () => {
      const res = await POST(createTokenRequest(validParams({ grant_type: 'password' })));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('unsupported_grant_type');
    });

    it('rejects requests missing required parameters', async () => {
      const params = validParams();
      delete (params as Record<string, string | undefined>).code_verifier;

      const res = await POST(createTokenRequest(params));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('invalid_request');
    });
  });

  describe('Code exchange', () => {
    it('rejects unknown or already-used codes', async () => {
      vi.mocked(consumeOAuthAuthorizationCode).mockResolvedValue(null);

      const res = await POST(createTokenRequest(validParams()));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('invalid_grant');
    });

    it('rejects expired codes', async () => {
      vi.mocked(consumeOAuthAuthorizationCode).mockResolvedValue(
        createMockCodeRecord({ expires_at: new Date(Date.now() - 1000) })
      );

      const res = await POST(createTokenRequest(validParams()));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('invalid_grant');
    });

    it('rejects a client_id mismatch', async () => {
      vi.mocked(consumeOAuthAuthorizationCode).mockResolvedValue(
        createMockCodeRecord({ client_id: 'someone-else' })
      );

      const res = await POST(createTokenRequest(validParams()));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('invalid_grant');
    });

    it('rejects a redirect_uri mismatch', async () => {
      vi.mocked(consumeOAuthAuthorizationCode).mockResolvedValue(
        createMockCodeRecord({ redirect_uri: 'https://other.example/cb' })
      );

      const res = await POST(createTokenRequest(validParams()));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('invalid_grant');
    });

    it('rejects a failed PKCE verification', async () => {
      vi.mocked(consumeOAuthAuthorizationCode).mockResolvedValue(
        createMockCodeRecord({ code_challenge: await hashToken('a-different-verifier-entirely-1234567890') })
      );

      const res = await POST(createTokenRequest(validParams()));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('invalid_grant');
    });

    it('issues a bearer token for a valid exchange', async () => {
      const verifier = generateOpaqueToken();
      vi.mocked(consumeOAuthAuthorizationCode).mockResolvedValue(
        createMockCodeRecord({ code_challenge: await hashToken(verifier) })
      );
      vi.mocked(createOAuthAccessToken).mockResolvedValue({} as OAuthAccessToken);

      const res = await POST(createTokenRequest(validParams({ code_verifier: verifier })));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.token_type).toBe('Bearer');
      expect(data.access_token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(data.expires_in).toBeGreaterThan(0);
      expect(res.headers.get('Cache-Control')).toBe('no-store');

      // The stored hash must correspond to the issued token
      const stored = vi.mocked(createOAuthAccessToken).mock.calls[0][0];
      expect(stored.tokenHash).toBe(await hashToken(data.access_token));
      expect(stored.userId).toBe('user-1');
    });
  });
});
