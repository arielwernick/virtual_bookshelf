import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getShelfByShareToken: vi.fn(),
  getItemsByShelfId: vi.fn(),
}));

import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { GET, shelfParamFromUrl } from './route';
import { Shelf } from '@/lib/types/shelf';

const SITE = 'https://virtualbookshelf.app';

function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Favorite Books',
    description: null,
    share_token: 'Xk9mP2vL',
    is_public: true,
    created_at: new Date('2026-09-01T00:00:00Z'),
    updated_at: new Date('2026-11-01T00:00:00Z'),
    ...overrides,
  };
}

function oembedRequest(query: string) {
  return new NextRequest(`${SITE}/oembed?${query}`);
}

const shelfUrl = encodeURIComponent(`${SITE}/s/favorite-books-Xk9mP2vL`);

describe('shelfParamFromUrl', () => {
  const hosts = ['virtualbookshelf.app'];

  it('accepts shelf and embed URLs on this site', () => {
    expect(shelfParamFromUrl(`${SITE}/s/favorite-books-Xk9mP2vL`, hosts)).toBe('favorite-books-Xk9mP2vL');
    expect(shelfParamFromUrl(`${SITE}/embed/Xk9mP2vL`, hosts)).toBe('Xk9mP2vL');
  });

  it('rejects other sites, other paths and non-URLs', () => {
    expect(shelfParamFromUrl('https://evil.example/s/Xk9mP2vL', hosts)).toBeNull();
    expect(shelfParamFromUrl('https://virtualbookshelf.app.evil.example/s/Xk9mP2vL', hosts)).toBeNull();
    expect(shelfParamFromUrl(`${SITE}/dashboard`, hosts)).toBeNull();
    expect(shelfParamFromUrl('javascript:alert(1)', hosts)).toBeNull();
    expect(shelfParamFromUrl('not a url', hosts)).toBeNull();
  });
});

describe('GET /oembed', () => {
  beforeEach(() => {
    vi.mocked(getShelfByShareToken).mockReset();
    vi.mocked(getItemsByShelfId).mockReset().mockResolvedValue([]);
  });

  it('returns a rich oEmbed response for a public shelf', async () => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(createMockShelf());

    const res = await GET(oembedRequest(`url=${shelfUrl}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      version: '1.0',
      type: 'rich',
      title: 'Favorite Books',
      provider_name: 'Virtual Bookshelf',
      width: 600,
      height: 600,
    });
    expect(body.html).toContain(`<iframe src="${SITE}/embed/Xk9mP2vL"`);
    expect(body.thumbnail_url).toBe(`${SITE}/api/og/Xk9mP2vL`);
  });

  it('honours maxwidth and maxheight within limits', async () => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(createMockShelf());

    const body = await (await GET(oembedRequest(`url=${shelfUrl}&maxwidth=400&maxheight=99999`))).json();

    expect(body.width).toBe(400);
    expect(body.height).toBe(1200);
  });

  it('escapes the shelf name inside the iframe markup', async () => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(
      createMockShelf({ name: '"><script>alert(1)</script>' })
    );

    const body = await (await GET(oembedRequest(`url=${shelfUrl}`))).json();

    expect(body.html).not.toContain('<script>');
    expect(body.html).not.toContain('title=""');
  });

  it('answers 404 for a private shelf', async () => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(createMockShelf({ is_public: false }));
    expect((await GET(oembedRequest(`url=${shelfUrl}`))).status).toBe(404);
  });

  it('answers 404 for a URL on another site without touching the database', async () => {
    const res = await GET(oembedRequest(`url=${encodeURIComponent('https://evil.example/s/abc')}`));

    expect(res.status).toBe(404);
    expect(getShelfByShareToken).not.toHaveBeenCalled();
  });

  it('answers 400 without a url and 501 for xml', async () => {
    expect((await GET(oembedRequest(''))).status).toBe(400);
    expect((await GET(oembedRequest(`url=${shelfUrl}&format=xml`))).status).toBe(501);
  });
});
