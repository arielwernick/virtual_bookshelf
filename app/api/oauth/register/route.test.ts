import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('mcp-handler', () => ({ metadataCorsOptionsRequestHandler: () => vi.fn() }));
vi.mock('@/lib/db/queries', () => ({ createOAuthClient: vi.fn() }));

import { createOAuthClient } from '@/lib/db/queries';
import { POST } from './route';

function registerRequest(body: unknown, raw = false) {
  return new Request('https://virtualbookshelf.app/api/oauth/register', {
    method: 'POST',
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

describe('POST /api/oauth/register', () => {
  beforeEach(() => {
    vi.mocked(createOAuthClient)
      .mockReset()
      .mockImplementation(async (clientId, clientName, redirectUris) => ({
        id: 'row-1',
        client_id: clientId,
        client_name: clientName,
        redirect_uris: redirectUris,
        created_at: new Date(),
      }));
  });

  it('registers a public client and returns its id', async () => {
    const res = await POST(
      registerRequest({ redirect_uris: ['https://claude.ai/api/mcp/auth_callback'], client_name: 'Claude' })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.client_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body).toMatchObject({
      client_name: 'Claude',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      token_endpoint_auth_method: 'none',
    });
    // No secret is ever issued: clients are public and rely on PKCE
    expect(body.client_secret).toBeUndefined();
  });

  it('allows http only for localhost', async () => {
    const local = await POST(registerRequest({ redirect_uris: ['http://localhost:3000/callback'] }));
    const remote = await POST(registerRequest({ redirect_uris: ['http://example.com/callback'] }));

    expect(local.status).toBe(201);
    expect(remote.status).toBe(400);
  });

  it.each([
    ['no redirect URIs', {}],
    ['an empty list', { redirect_uris: [] }],
    ['a list with a non-string', { redirect_uris: ['https://example.com/cb', 5] }],
    ['a javascript: URI', { redirect_uris: ['javascript:alert(1)'] }],
    ['a custom scheme', { redirect_uris: ['myapp://callback'] }],
    ['one bad URI among good ones', { redirect_uris: ['https://example.com/cb', 'ftp://example.com/cb'] }],
  ])('answers 400 for %s, and stores nothing', async (_name, body) => {
    const res = await POST(registerRequest(body));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('invalid_redirect_uri');
    expect(createOAuthClient).not.toHaveBeenCalled();
  });

  it('answers 400 for a body that is not JSON', async () => {
    const res = await POST(registerRequest('not json', true));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_client_metadata');
  });

  it('cuts an over-long client name and ignores a non-string one', async () => {
    await POST(registerRequest({ redirect_uris: ['https://example.com/cb'], client_name: 'x'.repeat(500) }));
    await POST(registerRequest({ redirect_uris: ['https://example.com/cb'], client_name: { evil: true } }));

    expect(vi.mocked(createOAuthClient).mock.calls[0][1]).toHaveLength(200);
    expect(vi.mocked(createOAuthClient).mock.calls[1][1]).toBe('');
  });

  it('answers 500 without leaking details when the database fails', async () => {
    vi.mocked(createOAuthClient).mockRejectedValue(new Error('connection string postgres://secret'));

    const res = await POST(registerRequest({ redirect_uris: ['https://example.com/cb'] }));

    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });
});
