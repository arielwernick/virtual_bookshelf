import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ sql: vi.fn() }));
vi.mock('@/lib/db/queries', () => ({ createItem: vi.fn() }));
vi.mock('@/lib/utils/revalidateShelf', () => ({ revalidateSharedShelf: vi.fn() }));
vi.mock('@/lib/api/youtube', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/youtube')>()),
  getVideoDetails: vi.fn(),
}));
vi.mock('@/lib/api/microlink', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/microlink')>()),
  fetchLinkMetadata: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { sql } from '@/lib/db/client';
import { createItem } from '@/lib/db/queries';
import { getVideoDetails } from '@/lib/api/youtube';
import { fetchLinkMetadata, MicrolinkQuotaExceededError } from '@/lib/api/microlink';
import { POST } from './route';

function fromUrlRequest(body: unknown) {
  return new Request('https://virtualbookshelf.app/api/items/from-url', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Queue the two lookups of a successful add: the owned shelf, then the next position. */
function mockOwnedShelf() {
  vi.mocked(sql)
    .mockResolvedValueOnce([{ id: 'shelf-1', share_token: 'tok', name: 'Shelf' }] as never)
    .mockResolvedValueOnce([{ next_order: 3 }] as never);
}

/** What the route asked createItem to save. */
const savedItem = () => vi.mocked(createItem).mock.calls[0][1];

describe('POST /api/items/from-url', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset().mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(sql).mockReset();
    vi.mocked(createItem).mockReset().mockResolvedValue({ id: 'item-1', title: 'T' } as never);
    vi.mocked(getVideoDetails).mockReset();
    vi.mocked(fetchLinkMetadata).mockReset();
  });

  it('answers 401 when signed out, before touching the database', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await POST(fromUrlRequest({ url: 'https://example.com', shelf_id: 'shelf-1' }));

    expect(res.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing url', { shelf_id: 'shelf-1' }],
    ['a non-string url', { url: 5, shelf_id: 'shelf-1' }],
    ['a missing shelf id', { url: 'https://example.com' }],
  ])('answers 400 for %s', async (_name, body) => {
    expect((await POST(fromUrlRequest(body))).status).toBe(400);
  });

  it('answers 404 for a shelf the user does not own, and adds nothing', async () => {
    vi.mocked(sql).mockResolvedValueOnce([] as never);

    const res = await POST(fromUrlRequest({ url: 'https://example.com/a', shelf_id: 'not-mine' }));

    expect(res.status).toBe(404);
    expect(createItem).not.toHaveBeenCalled();
    // The ownership check is scoped to the signed-in user
    expect(vi.mocked(sql).mock.calls[0].slice(1)).toEqual(['not-mine', 'user-1']);
    expect(fetchLinkMetadata).not.toHaveBeenCalled();
  });

  it('adds a YouTube link as a video, with its canonical identifier', async () => {
    mockOwnedShelf();
    vi.mocked(getVideoDetails).mockResolvedValue({
      id: 'dQw4w9WgXcQ',
      title: 'A Video',
      channelName: 'A Channel',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });

    const res = await POST(fromUrlRequest({ url: 'https://youtu.be/dQw4w9WgXcQ', shelf_id: 'shelf-1' }));

    expect(res.status).toBe(200);
    expect(getVideoDetails).toHaveBeenCalledWith('dQw4w9WgXcQ');
    expect(vi.mocked(createItem).mock.calls[0]).toEqual([
      'shelf-1',
      {
        type: 'video',
        title: 'A Video',
        creator: 'A Channel',
        image_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        external_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        order_index: 3,
      },
      'user-1',
    ]);
    expect(fetchLinkMetadata).not.toHaveBeenCalled();
  });

  it('adds any other URL as a link, using the fetched metadata', async () => {
    mockOwnedShelf();
    vi.mocked(fetchLinkMetadata).mockResolvedValue({
      title: 'A Post',
      image: 'https://example.com/og.png',
      publisher: 'example.com',
      description: null,
      url: 'https://example.com/post',
    });

    const res = await POST(fromUrlRequest({ url: 'https://example.com/post?utm=1', shelf_id: 'shelf-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(savedItem()).toMatchObject({
      type: 'link',
      title: 'A Post',
      creator: 'example.com',
      image_url: 'https://example.com/og.png',
      external_url: 'https://example.com/post',
    });
  });

  it('stores only web URLs, even when the metadata service returns something else', async () => {
    mockOwnedShelf();
    vi.mocked(fetchLinkMetadata).mockResolvedValue({
      title: 'A Post',
      image: 'data:text/html,x',
      publisher: 'example.com',
      description: null,
      url: 'javascript:alert(1)',
    });

    await POST(fromUrlRequest({ url: 'https://example.com/post', shelf_id: 'shelf-1' }));

    // Falls back to the URL the person pasted. The image is passed on to
    // createItem, which drops anything that is not a web URL.
    expect(savedItem().external_url).toBe('https://example.com/post');
  });

  it('answers 503 when the metadata quota is used up, and adds nothing', async () => {
    vi.mocked(sql)
      .mockResolvedValueOnce([{ id: 'shelf-1', share_token: 'tok', name: 'Shelf' }] as never)
      .mockResolvedValueOnce([{ next_order: 0 }] as never);
    vi.mocked(fetchLinkMetadata).mockRejectedValue(new MicrolinkQuotaExceededError());

    const res = await POST(fromUrlRequest({ url: 'https://example.com/post', shelf_id: 'shelf-1' }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe('quota_exceeded');
    expect(createItem).not.toHaveBeenCalled();
  });
});
