import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/db/queries', () => ({
  createOAuthAuthorizationCode: vi.fn(),
  getOAuthClientByClientId: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { createOAuthAuthorizationCode, getOAuthClientByClientId } from '@/lib/db/queries';
import { hashToken } from '@/lib/utils/oauth';
import { POST } from './route';

const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';

function authorizeRequest(fields: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return new Request('https://virtualbookshelf.app/api/oauth/authorize', { method: 'POST', body: form });
}

const validFields = { client_id: 'client-1', redirect_uri: REDIRECT, code_challenge: 'challenge', state: 'xyz' };

describe('POST /api/oauth/authorize', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset().mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(getOAuthClientByClientId).mockReset().mockResolvedValue({
      id: 'row-1',
      client_id: 'client-1',
      client_name: 'Claude',
      redirect_uris: [REDIRECT],
      created_at: new Date(),
    });
    vi.mocked(createOAuthAuthorizationCode).mockReset().mockResolvedValue(undefined as never);
  });

  it('answers 401 when signed out, and issues no code', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await POST(authorizeRequest(validFields));

    expect(res.status).toBe(401);
    expect(createOAuthAuthorizationCode).not.toHaveBeenCalled();
  });

  it.each([['client_id'], ['redirect_uri'], ['code_challenge']])(
    'answers 400 when %s is missing',
    async (missing) => {
      const fields: Record<string, string> = { ...validFields };
      delete fields[missing];

      expect((await POST(authorizeRequest(fields))).status).toBe(400);
      expect(createOAuthAuthorizationCode).not.toHaveBeenCalled();
    }
  );

  it('answers 400 for an unknown client', async () => {
    vi.mocked(getOAuthClientByClientId).mockResolvedValue(null);

    expect((await POST(authorizeRequest(validFields))).status).toBe(400);
    expect(createOAuthAuthorizationCode).not.toHaveBeenCalled();
  });

  it('answers 400 for a redirect URI the client did not register, and never redirects there', async () => {
    const res = await POST(authorizeRequest({ ...validFields, redirect_uri: 'https://evil.example/steal' }));

    expect(res.status).toBe(400);
    expect(res.headers.get('location')).toBeNull();
    expect(createOAuthAuthorizationCode).not.toHaveBeenCalled();
  });

  it('issues a code for the signed-in user and redirects back with the state', async () => {
    const res = await POST(authorizeRequest(validFields));
    const location = new URL(res.headers.get('location')!);
    const code = location.searchParams.get('code')!;
    const stored = vi.mocked(createOAuthAuthorizationCode).mock.calls[0][0];

    expect(res.status).toBe(303);
    expect(`${location.origin}${location.pathname}`).toBe(REDIRECT);
    expect(location.searchParams.get('state')).toBe('xyz');
    expect(code.length).toBeGreaterThan(20);
    expect(stored).toMatchObject({
      clientId: 'client-1',
      userId: 'user-1',
      redirectUri: REDIRECT,
      codeChallenge: 'challenge',
    });
  });

  it('stores only a hash of the code, never the code itself', async () => {
    const res = await POST(authorizeRequest(validFields));
    const code = new URL(res.headers.get('location')!).searchParams.get('code')!;
    const stored = vi.mocked(createOAuthAuthorizationCode).mock.calls[0][0];

    expect(stored.codeHash).not.toBe(code);
    expect(stored.codeHash).toBe(await hashToken(code));
  });

  it('gives the code a short life', async () => {
    const before = Date.now();
    await POST(authorizeRequest(validFields));
    const { expiresAt } = vi.mocked(createOAuthAuthorizationCode).mock.calls[0][0];

    expect(expiresAt.getTime()).toBeGreaterThan(before);
    expect(expiresAt.getTime() - before).toBeLessThanOrEqual(15 * 60 * 1000);
  });
});
