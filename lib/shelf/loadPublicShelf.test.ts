import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/queries', () => ({
  getShelfByShareToken: vi.fn(),
  getItemsByShelfId: vi.fn(),
}));

import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { loadPublicShelf, twinHeaders } from './loadPublicShelf';
import { GET as getMarkdown } from '@/app/s/[shareToken]/shelf.md/route';
import { GET as getJson } from '@/app/s/[shareToken]/shelf.json/route';
import { GET as getFeed } from '@/app/s/[shareToken]/feed.json/route';
import { Shelf } from '@/lib/types/shelf';

function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-internal-id',
    user_id: 'owner-internal-id',
    name: 'Favorite Books',
    description: null,
    share_token: 'Xk9mP2vL',
    is_public: true,
    created_at: new Date('2026-09-01T00:00:00Z'),
    updated_at: new Date('2026-11-01T00:00:00Z'),
    ...overrides,
  };
}

const params = (shareToken: string) => ({ params: Promise.resolve({ shareToken }) });
const request = new Request('https://virtualbookshelf.app/s/x');

describe('loadPublicShelf', () => {
  beforeEach(() => {
    vi.mocked(getShelfByShareToken).mockReset();
    vi.mocked(getItemsByShelfId).mockReset().mockResolvedValue([]);
  });

  it('looks the shelf up by the token after the slug', async () => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(createMockShelf());

    const loaded = await loadPublicShelf('favorite-books-Xk9mP2vL');

    expect(getShelfByShareToken).toHaveBeenCalledWith('Xk9mP2vL');
    expect(loaded?.shelf.name).toBe('Favorite Books');
  });

  it('returns null for a private shelf without loading its items', async () => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(createMockShelf({ is_public: false }));

    expect(await loadPublicShelf('Xk9mP2vL')).toBeNull();
    expect(getItemsByShelfId).not.toHaveBeenCalled();
  });

  it('returns null for an unknown shelf', async () => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(null);
    expect(await loadPublicShelf('nope')).toBeNull();
  });
});

describe('machine-readable shelf routes', () => {
  beforeEach(() => {
    vi.mocked(getShelfByShareToken).mockReset();
    vi.mocked(getItemsByShelfId).mockReset().mockResolvedValue([]);
  });

  it.each([
    ['shelf.md', getMarkdown, 'text/markdown'],
    ['shelf.json', getJson, 'application/json'],
    ['feed.json', getFeed, 'application/feed+json'],
  ] as const)('%s answers 200 for a public shelf, canonical to the HTML page', async (_name, GET, type) => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(createMockShelf());

    const res = await GET(request, params('favorite-books-Xk9mP2vL'));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain(type);
    expect(res.headers.get('link')).toContain('/s/favorite-books-Xk9mP2vL>; rel="canonical"');
    expect(res.headers.get('x-robots-tag')).toBe('noindex');
    expect(await res.text()).not.toContain('owner-internal-id');
  });

  it.each([
    ['shelf.md', getMarkdown],
    ['shelf.json', getJson],
    ['feed.json', getFeed],
  ] as const)('%s answers 404 for a private shelf', async (_name, GET) => {
    vi.mocked(getShelfByShareToken).mockResolvedValue(createMockShelf({ is_public: false }));

    const res = await GET(request, params('Xk9mP2vL'));

    expect(res.status).toBe(404);
  });
});

describe('twinHeaders', () => {
  it('lets the CDN cache the twin', () => {
    const headers = twinHeaders(createMockShelf(), 'text/markdown') as Record<string, string>;
    expect(headers['Cache-Control']).toContain('s-maxage');
  });
});
