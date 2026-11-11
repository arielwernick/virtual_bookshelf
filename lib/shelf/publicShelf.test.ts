import { describe, it, expect } from 'vitest';
import {
  PUBLIC_SHELF_VERSION,
  buildShelfUrls,
  redactItemForPublic,
  toJsonFeed,
  toMarkdown,
  toPublicShelf,
} from './publicShelf';
import { Item, Shelf } from '@/lib/types/shelf';

const BASE = 'https://virtualbookshelf.app';

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-internal-id',
    user_id: 'owner-internal-id',
    type: 'book',
    title: 'Deep Work',
    creator: 'Cal Newport',
    image_url: 'https://example.com/cover.jpg',
    external_url: 'https://books.google.com/books?id=abc',
    notes: 'Changed how I plan my week',
    rating: 5,
    order_index: 0,
    created_at: new Date('2026-10-01T00:00:00Z'),
    updated_at: new Date('2026-10-02T00:00:00Z'),
    ...overrides,
  };
}

function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-internal-id',
    user_id: 'owner-internal-id',
    name: 'Favorite Books',
    description: 'What I hand to friends',
    share_token: 'Xk9mP2vL',
    is_public: true,
    created_at: new Date('2026-09-01T00:00:00Z'),
    updated_at: new Date('2026-11-01T00:00:00Z'),
    ...overrides,
  };
}

describe('toPublicShelf', () => {
  it('builds a versioned document with canonical URLs for every format', () => {
    const doc = toPublicShelf(createMockShelf(), [createMockItem()], BASE);

    expect(doc.version).toBe(PUBLIC_SHELF_VERSION);
    expect(doc.url).toBe(`${BASE}/s/favorite-books-Xk9mP2vL`);
    expect(doc.formats).toEqual(buildShelfUrls('Favorite Books', 'Xk9mP2vL', BASE));
    expect(doc.formats.markdown).toBe(`${doc.url}/shelf.md`);
    expect(doc.item_count).toBe(1);
  });

  it('never exposes owner or internal ids', () => {
    const json = JSON.stringify(toPublicShelf(createMockShelf(), [createMockItem()], BASE));

    expect(json).not.toContain('owner-internal-id');
    expect(json).not.toContain('shelf-internal-id');
    expect(json).not.toContain('user_id');
    expect(json).not.toContain('shelf_id');
  });

  it('orders items by order_index and numbers them from 1', () => {
    const doc = toPublicShelf(
      createMockShelf(),
      [
        createMockItem({ id: 'b', title: 'Second', order_index: 5 }),
        createMockItem({ id: 'a', title: 'First', order_index: 2 }),
      ],
      BASE
    );

    expect(doc.items.map((i) => [i.position, i.title])).toEqual([
      [1, 'First'],
      [2, 'Second'],
    ]);
  });

  it('turns empty values into null', () => {
    const doc = toPublicShelf(
      createMockShelf({ description: '' }),
      [createMockItem({ notes: null, rating: 0, creator: '', image_url: null })],
      BASE
    );

    expect(doc.description).toBeNull();
    expect(doc.items[0]).toMatchObject({ note: null, rating: null, creator: null, image_url: null });
  });
});

describe('redactItemForPublic', () => {
  it('keeps what the cards render and blanks the owner and shelf ids', () => {
    const redacted = redactItemForPublic(createMockItem());

    expect(redacted.user_id).toBeNull();
    expect(redacted.shelf_id).toBe('');
    expect(redacted).toMatchObject({ id: 'item-1', title: 'Deep Work', notes: 'Changed how I plan my week' });
  });

  it('drops any column that is not on the allowlist', () => {
    const row = { ...createMockItem(), secret_column: 'x' } as Item;
    expect(Object.keys(redactItemForPublic(row))).not.toContain('secret_column');
  });
});

describe('toMarkdown', () => {
  it('renders a title, the source URL and a numbered list with notes', () => {
    const md = toMarkdown(toPublicShelf(createMockShelf(), [createMockItem()], BASE));

    expect(md).toContain('# Favorite Books');
    expect(md).toContain('What I hand to friends');
    expect(md).toContain(`Source: ${BASE}/s/favorite-books-Xk9mP2vL`);
    expect(md).toContain('1. **[Deep Work](https://books.google.com/books?id=abc)** by Cal Newport (Book, rated 5/5)');
    expect(md).toContain('   > Changed how I plan my week');
  });

  it('escapes user text so it cannot add structure or links', () => {
    const md = toMarkdown(
      toPublicShelf(
        createMockShelf({ name: '# Not [a](http://evil) heading' }),
        [createMockItem({ title: 'Line one\n# injected heading', notes: '<script>alert(1)</script>' })],
        BASE
      )
    );

    expect(md).not.toMatch(/^# injected heading/m);
    expect(md).not.toContain('[a](http://evil)');
    expect(md).not.toContain('<script>');
  });

  it('writes only http(s) URLs as links', () => {
    const md = toMarkdown(
      toPublicShelf(createMockShelf(), [createMockItem({ external_url: 'javascript:alert(1)' })], BASE)
    );

    expect(md).not.toContain('javascript:');
    expect(md).toContain('**Deep Work**');
  });

  it('handles an empty shelf', () => {
    const md = toMarkdown(toPublicShelf(createMockShelf(), [], BASE));
    expect(md).toContain('0 items');
  });
});

describe('toJsonFeed', () => {
  it('is a JSON Feed 1.1 document with the newest item first', () => {
    const feed = toJsonFeed(
      toPublicShelf(
        createMockShelf(),
        [
          createMockItem({ id: 'old', title: 'Older', order_index: 0, created_at: new Date('2026-01-01T00:00:00Z') }),
          createMockItem({ id: 'new', title: 'Newer', order_index: 1, created_at: new Date('2026-06-01T00:00:00Z') }),
        ],
        BASE
      )
    );
    const items = feed.items as Array<Record<string, unknown>>;

    expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
    expect(feed.title).toBe('Favorite Books');
    expect(feed.feed_url).toBe(`${BASE}/s/favorite-books-Xk9mP2vL/feed.json`);
    expect(items.map((i) => i.title)).toEqual(['Newer', 'Older']);
    expect(new Set(items.map((i) => i.id)).size).toBe(2);
    expect(items[0].content_text).toContain('Changed how I plan my week');
  });

  it('leaves out non-http URLs', () => {
    const feed = toJsonFeed(
      toPublicShelf(createMockShelf(), [createMockItem({ external_url: 'javascript:alert(1)' })], BASE)
    );
    expect((feed.items as Array<Record<string, unknown>>)[0].external_url).toBeUndefined();
  });
});
