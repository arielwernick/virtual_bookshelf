import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/db/queries', () => ({ createShelf: vi.fn(), createItem: vi.fn() }));

import { getSession } from '@/lib/utils/session';
import { createShelf, createItem } from '@/lib/db/queries';
import { POST } from './route';
import { Shelf } from '@/lib/types/shelf';

function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Reading list',
    description: null,
    share_token: 'tok',
    is_public: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function importRequest(body: unknown) {
  return new Request('https://virtualbookshelf.app/api/import/create', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const item = (overrides: Record<string, unknown> = {}) => ({
  url: 'https://example.com/post',
  title: 'A Post',
  ...overrides,
});

describe('POST /api/import/create', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset().mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(createShelf).mockReset().mockResolvedValue(createMockShelf());
    vi.mocked(createItem).mockReset().mockResolvedValue({ id: 'item-1' } as never);
  });

  it('answers 401 when signed out, and creates nothing', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await POST(importRequest({ title: 'Reading list', items: [item()] }));

    expect(res.status).toBe(401);
    expect(createShelf).not.toHaveBeenCalled();
  });

  it.each([
    ['no title', { items: [item()] }],
    ['a blank title', { title: '   ', items: [item()] }],
    ['no items', { title: 'Reading list', items: [] }],
    ['items that is not a list', { title: 'Reading list', items: 'nope' }],
    ['an item with no url', { title: 'Reading list', items: [{ title: 'x' }] }],
    ['an item whose url is not a web address', { title: 'Reading list', items: [item({ url: 'javascript:alert(1)' })] }],
    ['an item with a file url', { title: 'Reading list', items: [item({ url: 'file:///etc/passwd' })] }],
  ])('answers 400 for %s, and creates nothing', async (_name, body) => {
    const res = await POST(importRequest(body));

    expect(res.status).toBe(400);
    expect(createShelf).not.toHaveBeenCalled();
    expect(createItem).not.toHaveBeenCalled();
  });

  it('answers 400 for more items than one import allows', async () => {
    const items = Array.from({ length: 51 }, (_, i) => item({ url: `https://example.com/${i}` }));
    expect((await POST(importRequest({ title: 'Reading list', items }))).status).toBe(400);
  });

  it('creates the shelf for the signed-in user, then the items in order', async () => {
    const res = await POST(
      importRequest({
        title: '  Reading list  ',
        items: [item({ title: 'First' }), item({ url: 'https://example.com/second', title: 'Second' })],
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(createShelf).toHaveBeenCalledWith('user-1', 'Reading list', null);
    expect(vi.mocked(createItem).mock.calls.map(([shelfId, data, userId]) => [shelfId, data.title, data.order_index, userId])).toEqual([
      ['shelf-1', 'First', 0, 'user-1'],
      ['shelf-1', 'Second', 1, 'user-1'],
    ]);
    expect(body.data).toMatchObject({ itemsCreated: 2, itemsFailed: 0 });
  });

  it('drops an image that is not a web URL but still imports the item', async () => {
    await POST(importRequest({ title: 'Reading list', items: [item({ imageUrl: 'data:text/html,x' })] }));

    expect(vi.mocked(createItem).mock.calls[0][1].image_url).toBeUndefined();
  });

  it('reports items that fail without losing the ones that succeed', async () => {
    vi.mocked(createItem)
      .mockResolvedValueOnce({ id: 'item-1' } as never)
      .mockRejectedValueOnce(new Error('db hiccup'));

    const res = await POST(
      importRequest({ title: 'Reading list', items: [item(), item({ url: 'https://example.com/b' })] })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({ itemsCreated: 1, itemsFailed: 1 });
    expect(body.data.failedItems[0]).toMatchObject({ index: 1, url: 'https://example.com/b' });
  });
});
