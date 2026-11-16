import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/db/queries', () => ({
  updateItemOrder: vi.fn(),
  getShelfById: vi.fn(),
  getItemsByShelfId: vi.fn(),
}));
vi.mock('@/lib/utils/revalidateShelf', () => ({ revalidateSharedShelf: vi.fn() }));

import { getSession } from '@/lib/utils/session';
import { updateItemOrder, getShelfById, getItemsByShelfId } from '@/lib/db/queries';
import { POST } from './route';
import { Item, Shelf } from '@/lib/types/shelf';

function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Favorite Books',
    description: null,
    share_token: 'Xk9mP2vL',
    is_public: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const item = (id: string) => ({ id, shelf_id: 'shelf-1' }) as Item;

function reorderRequest(body: unknown) {
  return new Request('https://virtualbookshelf.app/api/items/reorder', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/items/reorder', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset().mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(getShelfById).mockReset().mockResolvedValue(createMockShelf());
    vi.mocked(getItemsByShelfId).mockReset().mockResolvedValue([item('a'), item('b'), item('c')]);
    vi.mocked(updateItemOrder).mockReset().mockResolvedValue();
  });

  it('reorders with one lookup for the whole shelf', async () => {
    const res = await POST(reorderRequest({ shelf_id: 'shelf-1', item_ids: ['c', 'a', 'b'] }));

    expect(res.status).toBe(200);
    expect(getItemsByShelfId).toHaveBeenCalledTimes(1);
    expect(updateItemOrder).toHaveBeenCalledWith('shelf-1', ['c', 'a', 'b']);
  });

  it('answers 401 when signed out', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await POST(reorderRequest({ shelf_id: 'shelf-1', item_ids: [] }))).status).toBe(401);
  });

  it('answers 403 for someone else\'s shelf, without writing', async () => {
    vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'someone-else' }));

    const res = await POST(reorderRequest({ shelf_id: 'shelf-1', item_ids: ['a'] }));

    expect(res.status).toBe(403);
    expect(updateItemOrder).not.toHaveBeenCalled();
  });

  it('answers 403 when an id belongs to another shelf', async () => {
    const res = await POST(reorderRequest({ shelf_id: 'shelf-1', item_ids: ['a', 'stranger'] }));

    expect(res.status).toBe(403);
    expect(updateItemOrder).not.toHaveBeenCalled();
  });

  it.each([
    ['repeated ids', ['a', 'a']],
    ['non-string ids', ['a', 5]],
    ['empty ids', ['a', '']],
  ])('answers 400 for %s', async (_name, item_ids) => {
    const res = await POST(reorderRequest({ shelf_id: 'shelf-1', item_ids }));

    expect(res.status).toBe(400);
    expect(getShelfById).not.toHaveBeenCalled();
  });

  it('answers 400 for a list longer than the cap', async () => {
    const item_ids = Array.from({ length: 501 }, (_, i) => `id-${i}`);
    expect((await POST(reorderRequest({ shelf_id: 'shelf-1', item_ids }))).status).toBe(400);
  });
});
