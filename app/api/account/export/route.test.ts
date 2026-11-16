import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/db/queries', () => ({
  getShelfsByUserId: vi.fn(),
  getItemsForUserShelves: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { getShelfsByUserId, getItemsForUserShelves } from '@/lib/db/queries';
import { GET } from './route';
import { Item, Shelf } from '@/lib/types/shelf';

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

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'Deep Work',
    creator: 'Cal Newport',
    image_url: null,
    external_url: null,
    notes: 'A note',
    rating: null,
    order_index: 0,
    created_at: new Date('2026-10-01T00:00:00Z'),
    updated_at: new Date('2026-10-01T00:00:00Z'),
    ...overrides,
  };
}

describe('GET /api/account/export', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getShelfsByUserId).mockReset();
    vi.mocked(getItemsForUserShelves).mockReset();
  });

  it('answers 401 when signed out, without reading any data', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(getShelfsByUserId).not.toHaveBeenCalled();
  });

  it('exports only the signed-in user\'s shelves, private ones included', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'u', email: 'e' } as never);
    vi.mocked(getShelfsByUserId).mockResolvedValue([
      createMockShelf(),
      createMockShelf({ id: 'shelf-2', name: 'Drafts', share_token: 'Pq7', is_public: false }),
    ]);
    vi.mocked(getItemsForUserShelves).mockResolvedValue([
      createMockItem(),
      createMockItem({ id: 'item-2', shelf_id: 'shelf-2', title: 'Private Pick' }),
    ]);

    const res = await GET();
    const body = JSON.parse(await res.text());

    expect(getShelfsByUserId).toHaveBeenCalledWith('user-1');
    expect(getItemsForUserShelves).toHaveBeenCalledWith('user-1');
    expect(body.shelf_count).toBe(2);
    expect(body.item_count).toBe(2);
    expect(body.shelves[0]).toMatchObject({ name: 'Favorite Books', visibility: 'public' });
    expect(body.shelves[1]).toMatchObject({ name: 'Drafts', visibility: 'private' });
    expect(body.shelves[1].items[0].title).toBe('Private Pick');
  });

  it('is a download that is never cached', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(getShelfsByUserId).mockResolvedValue([]);
    vi.mocked(getItemsForUserShelves).mockResolvedValue([]);

    const res = await GET();

    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename="virtual-bookshelf-export-/);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });
});
